import { Injectable, Logger } from '@nestjs/common';
import { AttributeDataType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AiCatalogConfigService } from './ai-catalog-config.service';
import {
  AiCatalogAttributeRegistryService,
  RegistryDefinition,
  RegistryUnit,
} from './ai-catalog-attribute-registry.service';
import type { ExtractedAttributesV2 } from '../ai-catalog.types';

export interface AttributeApproval {
  /** AttributeDefinition.key or aiExtractionKey. */
  key: string;
  approved: boolean;
  /** Merchant-edited value; when present it overrides the AI value. */
  value?: unknown;
  unitKey?: string;
}

export interface MappingResult {
  written: number;
  skipped: string[];
  rejected: { key: string; reason: string }[];
}

interface CoercedValue {
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueDate?: Date | null;
  valueOptionId?: string | null;
  valueOptionIds?: string[];
  valueJson?: Prisma.InputJsonValue;
  unitId?: string | null;
  normalizedNumber?: number | null;
}

/**
 * Maps the immutable AI extraction (+ merchant approvals) into normalized,
 * indexable ProductAttribute rows. Rules enforced here:
 *  - extractedJson is never mutated (source of truth lives on the analysis).
 *  - Only approved values (explicit merchant approval OR auto-approve above the
 *    configured confidence threshold) are normalized.
 *  - Merchant-verified attributes are NEVER overwritten by a later AI run.
 *  - ENUM/MULTI_SELECT values must resolve to a real AttributeOption; unknown
 *    values are rejected, never silently created.
 *  - Every change appends a ProductAttributeHistory row (suggested → modified →
 *    approved) for a full audit trail.
 */
@Injectable()
export class AiCatalogAttributeService {
  private readonly logger = new Logger(AiCatalogAttributeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: AiCatalogAttributeRegistryService,
    private readonly config: AiCatalogConfigService,
  ) {}

  async syncFromApproval(params: {
    productId: string;
    analysisId: string | null;
    categoryId: string | null;
    extracted: ExtractedAttributesV2;
    approvals: AttributeApproval[];
    actorId?: string;
  }): Promise<MappingResult> {
    const { productId, analysisId, categoryId, extracted, approvals, actorId } = params;
    const defs = await this.registry.definitionsForCategory(categoryId);
    const units = await this.registry.units();
    const autoApproveThreshold = await this.config.attributeAutoApproveThreshold();
    const approvalByKey = new Map(approvals.map((a) => [a.key.toLowerCase(), a]));

    const result: MappingResult = { written: 0, skipped: [], rejected: [] };

    for (const def of defs) {
      const aiKey = def.aiExtractionKey ?? def.key;
      const approval = approvalByKey.get(def.key.toLowerCase()) ?? approvalByKey.get(aiKey.toLowerCase());

      // Source value: merchant override first, else the AI-extracted value.
      const merchantEdited = approval?.value !== undefined;
      const rawValue = merchantEdited ? approval!.value : this.readExtracted(extracted, aiKey);
      if (rawValue === null || rawValue === undefined || rawValue === '') {
        result.skipped.push(def.key);
        continue;
      }

      const meta = extracted.fieldMeta?.[aiKey];
      const confidence = merchantEdited ? 1 : meta?.confidence ?? extracted.confidence ?? 0;
      const source = merchantEdited ? 'merchant' : meta?.source ?? 'ai_inferred';

      // Approval gate: explicit approval, or auto-approve for high-confidence AI.
      const approved = approval?.approved === true || (!approval && confidence >= autoApproveThreshold);
      if (!approved) {
        result.skipped.push(def.key);
        continue;
      }

      // Coerce + validate per data type.
      let coerced: CoercedValue;
      try {
        coerced = this.coerce(def, rawValue, approval?.unitKey, units);
      } catch (e) {
        result.rejected.push({ key: def.key, reason: (e as Error).message });
        continue;
      }

      // Never clobber a merchant-verified value with a fresh AI value.
      const existing = await this.prisma.productAttribute.findUnique({
        where: { productId_definitionId: { productId, definitionId: def.id } },
        select: { id: true, verifiedByMerchant: true, valueText: true, valueNumber: true, valueOptionId: true, valueJson: true },
      });
      if (existing?.verifiedByMerchant && !merchantEdited) {
        result.skipped.push(def.key);
        continue;
      }

      await this.prisma.$transaction(async (tx) => {
        const previous = existing
          ? { valueText: existing.valueText, valueNumber: existing.valueNumber, valueOptionId: existing.valueOptionId, valueJson: existing.valueJson }
          : null;

        await tx.productAttribute.upsert({
          where: { productId_definitionId: { productId, definitionId: def.id } },
          create: {
            productId,
            definitionId: def.id,
            analysisId,
            confidence,
            source,
            verifiedByMerchant: merchantEdited || approval?.approved === true,
            ...coerced,
          },
          update: {
            analysisId,
            confidence,
            source,
            verifiedByMerchant: merchantEdited || approval?.approved === true,
            ...coerced,
          },
        });

        await tx.productAttributeHistory.create({
          data: {
            productId,
            definitionId: def.id,
            analysisId,
            stage: merchantEdited ? 'merchant_modified' : 'approved',
            previousValue: (previous ?? Prisma.JsonNull) as Prisma.InputJsonValue,
            newValue: this.historyValue(coerced),
            confidence,
            source,
            actorId,
          },
        });
      });

      result.written += 1;
    }

    return result;
  }

  /** Record the raw AI suggestion in history at analysis time (pre-approval). */
  async recordSuggestions(params: {
    productId: string;
    analysisId: string | null;
    categoryId: string | null;
    extracted: ExtractedAttributesV2;
  }): Promise<void> {
    const defs = await this.registry.definitionsForCategory(params.categoryId);
    const rows: Prisma.ProductAttributeHistoryCreateManyInput[] = [];
    for (const def of defs) {
      const aiKey = def.aiExtractionKey ?? def.key;
      const value = this.readExtracted(params.extracted, aiKey);
      if (value === null || value === undefined || value === '') continue;
      const meta = params.extracted.fieldMeta?.[aiKey];
      rows.push({
        productId: params.productId,
        definitionId: def.id,
        analysisId: params.analysisId,
        stage: 'ai_suggested',
        newValue: { raw: value } as Prisma.InputJsonValue,
        confidence: meta?.confidence ?? params.extracted.confidence ?? 0,
        source: meta?.source ?? 'ai_inferred',
      });
    }
    if (rows.length) await this.prisma.productAttributeHistory.createMany({ data: rows });
  }

  // ── coercion + validation ─────────────────────────────────────────────────────
  private coerce(
    def: RegistryDefinition,
    raw: unknown,
    unitKey: string | undefined,
    units: RegistryUnit[],
  ): CoercedValue {
    switch (def.dataType) {
      case AttributeDataType.TEXT: {
        const text = this.asText(raw, def);
        return { valueText: text };
      }
      case AttributeDataType.BOOLEAN:
        return { valueBoolean: this.asBoolean(raw) };
      case AttributeDataType.DATE:
        return { valueDate: this.asDate(raw) };
      case AttributeDataType.NUMBER: {
        const n = this.asNumber(raw, def);
        return { valueNumber: n, normalizedNumber: n };
      }
      case AttributeDataType.WEIGHT:
      case AttributeDataType.VOLUME: {
        const parsed = this.parseMeasure(raw, unitKey, units, def);
        return {
          valueNumber: parsed.value,
          unitId: parsed.unitId,
          normalizedNumber: parsed.normalized,
          valueText: parsed.display,
        };
      }
      case AttributeDataType.DIMENSION: {
        const dim = this.parseDimension(raw, unitKey, units);
        return { valueJson: dim.json, valueText: dim.display, unitId: dim.unitId };
      }
      case AttributeDataType.COLOR: {
        const text = this.asText(raw, def);
        // Match against known options for a swatch, but free-text colors are ok.
        const opt = def.options.find((o) => o.value.toLowerCase() === String(text).toLowerCase());
        return {
          valueOptionId: opt?.id ?? null,
          valueText: text,
          valueJson: opt?.colorHex ? { hex: opt.colorHex, name: text } : { name: text },
        };
      }
      case AttributeDataType.ENUM: {
        const opt = this.resolveOption(def, raw);
        return { valueOptionId: opt.id, valueText: opt.value };
      }
      case AttributeDataType.MULTI_SELECT: {
        const values = Array.isArray(raw) ? raw : String(raw).split(/[,;/]/);
        const ids = values
          .map((v) => String(v).trim())
          .filter(Boolean)
          .map((v) => this.resolveOption(def, v).id);
        if (!ids.length) throw new Error(`No valid options for ${def.key}`);
        return { valueOptionIds: ids };
      }
      default:
        return { valueText: this.asText(raw, def) };
    }
  }

  private resolveOption(def: RegistryDefinition, raw: unknown): { id: string; value: string } {
    const needle = String(raw).trim().toLowerCase();
    const opt = def.options.find(
      (o) => o.value.toLowerCase() === needle || o.label.toLowerCase() === needle,
    );
    if (!opt) {
      throw new Error(`"${raw}" is not a valid option for ${def.name}`);
    }
    return { id: opt.id, value: opt.value };
  }

  private asText(raw: unknown, def: RegistryDefinition): string {
    const text = String(raw).trim();
    if (def.validationRegex && !new RegExp(def.validationRegex).test(text)) {
      throw new Error(`Value for ${def.name} failed validation`);
    }
    return text.slice(0, 2000);
  }

  private asNumber(raw: unknown, def: RegistryDefinition): number {
    const n = Number(String(raw).replace(/[^0-9.\-]/g, ''));
    if (!Number.isFinite(n)) throw new Error(`${def.name} must be a number`);
    if (def.minValue != null && n < def.minValue) throw new Error(`${def.name} below minimum`);
    if (def.maxValue != null && n > def.maxValue) throw new Error(`${def.name} above maximum`);
    return n;
  }

  private asBoolean(raw: unknown): boolean {
    if (typeof raw === 'boolean') return raw;
    return ['true', 'yes', '1', 'y'].includes(String(raw).trim().toLowerCase());
  }

  private asDate(raw: unknown): Date {
    const d = new Date(String(raw));
    if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
    return d;
  }

  private parseMeasure(
    raw: unknown,
    unitKey: string | undefined,
    units: RegistryUnit[],
    def: RegistryDefinition,
  ): { value: number; unitId: string | null; normalized: number; display: string } {
    const text = String(raw).trim();
    const m = /([\d.]+)\s*([a-zA-Z]+)?/.exec(text);
    if (!m) throw new Error(`Could not parse ${def.name}`);
    const value = Number(m[1]);
    if (!Number.isFinite(value)) throw new Error(`${def.name} must be numeric`);
    const code = (unitKey ?? m[2] ?? '').toLowerCase();
    const unit =
      units.find((u) => u.key.toLowerCase() === code || u.code.toLowerCase() === code) ?? null;
    const normalized = unit ? value * unit.toBaseFactor : value;
    return { value, unitId: unit?.id ?? null, normalized, display: text };
  }

  private parseDimension(
    raw: unknown,
    unitKey: string | undefined,
    units: RegistryUnit[],
  ): { json: Prisma.InputJsonValue; display: string; unitId: string | null } {
    const text = String(raw).trim();
    const nums = (text.match(/[\d.]+/g) ?? []).map(Number).filter(Number.isFinite);
    const unit = unitKey
      ? units.find((u) => u.key.toLowerCase() === unitKey.toLowerCase()) ?? null
      : units.find((u) => text.toLowerCase().includes(u.code.toLowerCase())) ?? null;
    const [l, w, h] = nums;
    return {
      json: { length: l ?? null, width: w ?? null, height: h ?? null, unit: unit?.code ?? null, raw: text },
      display: text,
      unitId: unit?.id ?? null,
    };
  }

  private historyValue(coerced: CoercedValue): Prisma.InputJsonValue {
    const { valueDate, ...rest } = coerced;
    return { ...rest, valueDate: valueDate ? valueDate.toISOString() : null } as Prisma.InputJsonValue;
  }

  private readExtracted(extracted: ExtractedAttributesV2, key: string): unknown {
    return (extracted as unknown as Record<string, unknown>)[key] ?? null;
  }
}
