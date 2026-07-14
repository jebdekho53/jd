import { Injectable } from '@nestjs/common';
import { AiCatalogConfigService } from './ai-catalog-config.service';
import type { ExtractedAttributesV2 } from '../ai-catalog.types';

export type ModerationDecision = 'auto_approved' | 'needs_review' | 'rejected';

export interface ModerationResult {
  decision: ModerationDecision;
  reasons: string[];
}

// Categories/keywords that always require a human before going live.
const RESTRICTED_KEYWORDS = [
  'medicine', 'prescription', 'drug', 'tablet', 'capsule', 'antibiotic', 'schedule h',
  'tobacco', 'cigarette', 'vape', 'nicotine', 'alcohol', 'liquor', 'weapon', 'knife',
  'firearm', 'ammunition', 'pesticide',
];

/**
 * Deterministic first-pass moderation. It never blocks silently: a "needs_review"
 * decision routes the analysis to an admin moderation queue rather than
 * publishing. This keeps risky categories (medicine, tobacco, weapons) and
 * low-confidence supplement labels behind human review while letting clean,
 * high-confidence everyday products flow through.
 */
@Injectable()
export class AiCatalogModerationService {
  constructor(private readonly config: AiCatalogConfigService) {}

  async evaluate(extracted: ExtractedAttributesV2): Promise<ModerationResult> {
    const reasons: string[] = [];
    const haystack = [
      extracted.department, extracted.category, extracted.subCategory, extracted.productType,
      extracted.productName, ...extracted.categoryTree.map((c) => c.name),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const restricted = RESTRICTED_KEYWORDS.filter((k) => haystack.includes(k));
    if (restricted.length) reasons.push(`Restricted category signals: ${restricted.join(', ')}`);

    const minConfidence = await this.config.publishMinConfidence();
    if (extracted.confidence < minConfidence) {
      reasons.push(`Overall confidence ${extracted.confidence.toFixed(2)} below ${minConfidence}`);
    }

    if (extracted.isSupplement && (extracted.labelReadable === false || !extracted.canPublishDirectly)) {
      reasons.push('Supplement label unreadable or not directly publishable');
    }

    if (extracted.imageQualityScore < 0.4) {
      reasons.push(`Low image quality (${extracted.imageQualityScore.toFixed(2)})`);
    }

    const decision: ModerationDecision = reasons.length ? 'needs_review' : 'auto_approved';
    return { decision, reasons };
  }
}
