import { Injectable } from '@nestjs/common';
import { AttributeDataType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export interface RegistryOption {
  id: string;
  value: string;
  label: string;
  colorHex: string | null;
}
export interface RegistryUnit {
  id: string;
  key: string;
  code: string;
  dimension: string;
  toBaseFactor: number;
}
export interface RegistryDefinition {
  id: string;
  key: string;
  name: string;
  dataType: AttributeDataType;
  aiExtractionKey: string | null;
  unitDimension: string | null;
  defaultUnitId: string | null;
  validationRegex: string | null;
  minValue: number | null;
  maxValue: number | null;
  options: RegistryOption[];
}

/**
 * Read-through cache over the attribute registry (definitions, options, units).
 * The registry changes rarely (admin/seed writes) but is read on every mapping,
 * so a short-TTL in-process cache keeps the hot path off Postgres.
 */
@Injectable()
export class AiCatalogAttributeRegistryService {
  private defsCache?: { data: RegistryDefinition[]; expiresAt: number };
  private unitsCache?: { data: RegistryUnit[]; expiresAt: number };
  private readonly ttlMs = 60_000;

  constructor(private readonly prisma: PrismaService) {}

  async definitions(): Promise<RegistryDefinition[]> {
    if (this.defsCache && this.defsCache.expiresAt > Date.now()) return this.defsCache.data;
    const rows = await this.prisma.attributeDefinition.findMany({
      where: { isActive: true },
      include: { options: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });
    const data: RegistryDefinition[] = rows.map((d) => ({
      id: d.id,
      key: d.key,
      name: d.name,
      dataType: d.dataType,
      aiExtractionKey: d.aiExtractionKey,
      unitDimension: d.unitDimension,
      defaultUnitId: d.defaultUnitId,
      validationRegex: d.validationRegex,
      minValue: d.minValue,
      maxValue: d.maxValue,
      options: d.options.map((o) => ({ id: o.id, value: o.value, label: o.label, colorHex: o.colorHex })),
    }));
    this.defsCache = { data, expiresAt: Date.now() + this.ttlMs };
    return data;
  }

  async units(): Promise<RegistryUnit[]> {
    if (this.unitsCache && this.unitsCache.expiresAt > Date.now()) return this.unitsCache.data;
    const rows = await this.prisma.unitDefinition.findMany({ where: { isActive: true } });
    const data = rows.map((u) => ({
      id: u.id,
      key: u.key,
      code: u.code,
      dimension: u.dimension,
      toBaseFactor: u.toBaseFactor,
    }));
    this.unitsCache = { data, expiresAt: Date.now() + this.ttlMs };
    return data;
  }

  /** Definitions attached to a category (with global fallback for AI-mappable). */
  async definitionsForCategory(categoryId: string | null): Promise<RegistryDefinition[]> {
    const all = await this.definitions();
    if (!categoryId) return all.filter((d) => d.aiExtractionKey);
    const links = await this.prisma.categoryAttributeDefinition.findMany({
      where: { categoryId },
      select: { definitionId: true },
    });
    if (!links.length) return all.filter((d) => d.aiExtractionKey);
    const allowed = new Set(links.map((l) => l.definitionId));
    return all.filter((d) => allowed.has(d.id));
  }

  invalidate(): void {
    this.defsCache = undefined;
    this.unitsCache = undefined;
  }
}
