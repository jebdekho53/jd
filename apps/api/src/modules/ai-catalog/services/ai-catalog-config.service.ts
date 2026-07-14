import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { ALL_IMAGE_OUTPUTS, DEFAULT_IMAGE_OUTPUTS, ImageOutputType } from '../ai-catalog.constants';

/**
 * Runtime configuration for AI Catalog v2. Precedence: DB override
 * (ai_catalog_settings) > env var > hard default. Values are cached in-process
 * for a short TTL so hot paths (every job) don't hit Postgres; the cache is
 * busted on admin writes. This is the single source of truth for the feature
 * flag, pricing, thresholds, provider/model and per-output enablement.
 */
export interface AiCatalogPricing {
  perOutputPaise: Record<string, number>;
  analysisPaise: number;
}

export const SETTING_KEYS = {
  FEATURE_ENABLED: 'feature.enabled',
  PRICING: 'pricing',
  DISABLED_OUTPUTS: 'outputs.disabled',
  AUTO_SELECT_CATEGORY_THRESHOLD: 'category.autoSelectThreshold',
  AUTO_SELECT_CATEGORY_MARGIN: 'category.autoSelectMargin',
  ATTR_AUTO_APPROVE_THRESHOLD: 'attributes.autoApproveThreshold',
  PUBLISH_MIN_CONFIDENCE: 'publish.minConfidence',
  DAILY_ANALYSIS_LIMIT: 'limits.dailyAnalyses',
  VISION_MODEL: 'provider.visionModel',
  IMAGE_MODEL: 'provider.imageModel',
} as const;

@Injectable()
export class AiCatalogConfigService {
  private readonly logger = new Logger(AiCatalogConfigService.name);
  private cache = new Map<string, { value: unknown; expiresAt: number }>();
  private readonly cacheTtlMs = 30_000;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Master feature flag with a HARD environment kill switch.
   *
   * Precedence (default: DISABLED):
   *   1. `AI_CATALOG_V2_ENABLED=false`  → hard OFF. The admin DB toggle CANNOT
   *      override this — it is the operational kill switch.
   *   2. Otherwise the DB `feature.enabled` row decides (admin toggle).
   *   3. If no DB row exists, fall back to `AI_CATALOG_V2_ENABLED === 'true'`
   *      (env unset ⇒ false).
   *
   * Enablement is GLOBAL (one flag for the whole platform). Per-merchant
   * enablement is not implemented; add an allowlist setting if needed later.
   */
  async isEnabled(): Promise<boolean> {
    const env = this.config.get<string>('AI_CATALOG_V2_ENABLED');
    // (1) Explicit env kill switch wins over everything, including DB.
    if (typeof env === 'string' && env.trim().toLowerCase() === 'false') return false;

    // (2) DB toggle, only consulted when the kill switch is not engaged.
    const dbValue = await this.get<boolean | null>(SETTING_KEYS.FEATURE_ENABLED, null);
    if (typeof dbValue === 'boolean') return dbValue;

    // (3) No DB row → env=true enables, otherwise disabled by default.
    return typeof env === 'string' && env.trim().toLowerCase() === 'true';
  }

  async pricing(): Promise<AiCatalogPricing> {
    const stored = await this.get<Partial<AiCatalogPricing> | null>(SETTING_KEYS.PRICING, null);
    const defaults: AiCatalogPricing = {
      analysisPaise: this.config.get<number>('AI_CATALOG_ANALYSIS_PAISE', 150),
      perOutputPaise: {
        main: 150,
        transparent_png: 150,
        hero: 200,
        lifestyle: 250,
        infographic: 250,
        social_square: 150,
        social_story: 150,
        alternate_background: 150,
      },
    };
    return {
      analysisPaise: stored?.analysisPaise ?? defaults.analysisPaise,
      perOutputPaise: { ...defaults.perOutputPaise, ...(stored?.perOutputPaise ?? {}) },
    };
  }

  async priceForOutput(outputType: ImageOutputType): Promise<number> {
    const pricing = await this.pricing();
    return pricing.perOutputPaise[outputType] ?? pricing.perOutputPaise.main ?? 150;
  }

  async disabledOutputs(): Promise<Set<string>> {
    const list = await this.get<string[]>(SETTING_KEYS.DISABLED_OUTPUTS, []);
    return new Set(Array.isArray(list) ? list : []);
  }

  async isOutputEnabled(outputType: ImageOutputType): Promise<boolean> {
    if (!ALL_IMAGE_OUTPUTS.includes(outputType)) return false;
    return !(await this.disabledOutputs()).has(outputType);
  }

  async defaultOutputs(): Promise<ImageOutputType[]> {
    const disabled = await this.disabledOutputs();
    return DEFAULT_IMAGE_OUTPUTS.filter((o) => !disabled.has(o));
  }

  async categoryAutoSelectThreshold(): Promise<number> {
    return this.get(SETTING_KEYS.AUTO_SELECT_CATEGORY_THRESHOLD, 0.82);
  }

  async categoryAutoSelectMargin(): Promise<number> {
    return this.get(SETTING_KEYS.AUTO_SELECT_CATEGORY_MARGIN, 0.15);
  }

  async attributeAutoApproveThreshold(): Promise<number> {
    return this.get(SETTING_KEYS.ATTR_AUTO_APPROVE_THRESHOLD, 0.9);
  }

  async publishMinConfidence(): Promise<number> {
    return this.get(SETTING_KEYS.PUBLISH_MIN_CONFIDENCE, 0.55);
  }

  async dailyAnalysisLimit(): Promise<number> {
    return this.get(SETTING_KEYS.DAILY_ANALYSIS_LIMIT, this.config.get<number>('AI_CATALOG_DAILY_LIMIT', 200));
  }

  async visionModel(): Promise<string> {
    return this.get(SETTING_KEYS.VISION_MODEL, this.config.get<string>('OPENAI_VISION_MODEL', 'gpt-4o'));
  }

  async imageModel(): Promise<string> {
    return this.get(SETTING_KEYS.IMAGE_MODEL, this.config.get<string>('OPENAI_IMAGE_MODEL', 'gpt-image-1'));
  }

  /** Admin write. Upserts the setting and busts the cache. */
  async setSetting(key: string, value: unknown, updatedById?: string): Promise<void> {
    await this.prisma.aICatalogSetting.upsert({
      where: { key },
      create: { key, value: value as never, updatedById },
      update: { value: value as never, updatedById },
    });
    this.cache.delete(key);
  }

  async allSettings(): Promise<Record<string, unknown>> {
    const rows = await this.prisma.aICatalogSetting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  // ── Active prompt (versioned) ────────────────────────────────────────────────
  async activePrompt(kind: string): Promise<{ content: string; version: number } | null> {
    const cacheKey = `prompt:${kind}`;
    const cached = this.readCache<{ content: string; version: number } | null>(cacheKey);
    if (cached !== undefined) return cached;
    const row = await this.prisma.aICatalogPromptVersion.findFirst({
      where: { kind, isActive: true },
      orderBy: { version: 'desc' },
      select: { content: true, version: true },
    });
    this.writeCache(cacheKey, row);
    return row;
  }

  private async get<T>(key: string, fallback: T): Promise<T> {
    const cached = this.readCache<T>(key);
    if (cached !== undefined) return cached;
    try {
      const row = await this.prisma.aICatalogSetting.findUnique({ where: { key } });
      const value = (row?.value ?? fallback) as T;
      this.writeCache(key, value);
      return value;
    } catch (e) {
      this.logger.warn(`Setting read failed for ${key}: ${(e as Error).message}`);
      return fallback;
    }
  }

  private readCache<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.value as T;
    return undefined;
  }

  private writeCache(key: string, value: unknown): void {
    this.cache.set(key, { value, expiresAt: Date.now() + this.cacheTtlMs });
  }
}
