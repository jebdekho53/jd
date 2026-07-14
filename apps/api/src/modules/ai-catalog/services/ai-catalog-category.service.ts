import { Injectable } from '@nestjs/common';
import { CategoryService } from '../../product/category.service';
import { AiCatalogConfigService } from './ai-catalog-config.service';
import type { CategoryPathNode } from '../ai-catalog.types';

export interface CategoryCandidate {
  categoryId: string;
  path: string[];
  depth: number;
  score: number;
}

export interface CategoryMatchResult {
  candidates: CategoryCandidate[];
  autoSelected: CategoryCandidate | null;
  requiresConfirmation: boolean;
  /** The AI-suggested tree, preserved verbatim for audit even if unmatched. */
  aiSuggestedTree: CategoryPathNode[];
}

interface FlatNode {
  id: string;
  name: string;
  normalized: string;
  tokens: Set<string>;
  depth: number;
  path: string[];
}

type TreeNode = { id: string; name: string; children?: TreeNode[] };

/**
 * Matches the AI-suggested category hierarchy against the REAL, store-eligible
 * JebDekho category tree. Never invents categories. Returns ranked candidates
 * with confidence; auto-selects the top one ONLY when it clears a configurable
 * confidence threshold AND beats the runner-up by a configurable margin —
 * otherwise the merchant must confirm.
 */
@Injectable()
export class AiCatalogCategoryService {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly config: AiCatalogConfigService,
  ) {}

  async match(
    storeId: string,
    userId: string,
    aiTree: CategoryPathNode[],
  ): Promise<CategoryMatchResult> {
    const tree = (await this.categoryService.listCategories(storeId, userId)) as unknown as TreeNode[];
    const flat = this.flatten(tree);

    const ranked = this.rank(aiTree, flat);
    const threshold = await this.config.categoryAutoSelectThreshold();
    const margin = await this.config.categoryAutoSelectMargin();

    const top = ranked[0] ?? null;
    const second = ranked[1] ?? null;
    const clears = Boolean(top && top.score >= threshold);
    const beatsSecond = !second || (top ? top.score - second.score >= margin : false);
    const autoSelected = clears && beatsSecond ? top : null;

    return {
      candidates: ranked.slice(0, 5),
      autoSelected,
      requiresConfirmation: !autoSelected,
      aiSuggestedTree: aiTree,
    };
  }

  /** Flattened, store-eligible categories (id + path). Used to validate a
   * merchant-chosen categoryId before product creation. */
  async eligibleFlat(storeId: string, userId: string): Promise<FlatNode[]> {
    const tree = (await this.categoryService.listCategories(storeId, userId)) as unknown as TreeNode[];
    return this.flatten(tree);
  }

  /** Pure ranking — exposed for unit testing without the DB. */
  rank(aiTree: CategoryPathNode[], flat: FlatNode[]): CategoryCandidate[] {
    if (!flat.length) return [];
    // Weight deeper AI nodes more (they are more specific and more valuable to
    // match), and multiply by the AI's own confidence for that node.
    const scored = new Map<string, number>();
    for (const dbNode of flat) {
      let best = 0;
      for (const aiNode of aiTree) {
        const specificity = 0.5 + 0.5 * (aiNode.level / Math.max(1, aiTree.length - 1));
        const sim = this.similarity(this.normalize(aiNode.name), dbNode.normalized, this.tokenize(aiNode.name), dbNode.tokens);
        const conf = Number.isFinite(aiNode.confidence) ? aiNode.confidence : 0.5;
        best = Math.max(best, sim * specificity * (0.6 + 0.4 * conf));
      }
      // Small bonus for deeper DB categories so an equal-name match prefers the
      // more specific node (Whey Protein over Supplements).
      const depthBonus = 1 + Math.min(0.1, dbNode.depth * 0.03);
      scored.set(dbNode.id, best * depthBonus);
    }

    return flat
      .map((n) => ({
        categoryId: n.id,
        path: n.path,
        depth: n.depth,
        score: Number((scored.get(n.id) ?? 0).toFixed(4)),
      }))
      .filter((c) => c.score > 0.2)
      .sort((a, b) => b.score - a.score || b.depth - a.depth);
  }

  flatten(tree: TreeNode[]): FlatNode[] {
    const out: FlatNode[] = [];
    const walk = (nodes: TreeNode[], depth: number, path: string[]): void => {
      for (const n of nodes) {
        const nextPath = [...path, n.name];
        out.push({
          id: n.id,
          name: n.name,
          normalized: this.normalize(n.name),
          tokens: this.tokenize(n.name),
          depth,
          path: nextPath,
        });
        if (n.children?.length) walk(n.children, depth + 1, nextPath);
      }
    };
    walk(tree, 0, []);
    return out;
  }

  private similarity(a: string, b: string, aTokens: Set<string>, bTokens: Set<string>): number {
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 0.85;
    // Jaccard over word tokens for partial matches ("running shoes" vs "shoes").
    let inter = 0;
    for (const t of aTokens) if (bTokens.has(t)) inter++;
    const union = aTokens.size + bTokens.size - inter;
    return union === 0 ? 0 : (inter / union) * 0.8;
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  private tokenize(value: string): Set<string> {
    return new Set(this.normalize(value).split(' ').filter((t) => t.length > 1));
  }
}
