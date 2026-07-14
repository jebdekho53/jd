import { AiCatalogCategoryService } from './ai-catalog-category.service';
import { CategoryService } from '../../product/category.service';
import { AiCatalogConfigService } from './ai-catalog-config.service';
import type { CategoryPathNode } from '../ai-catalog.types';

const TREE = [
  {
    id: 'health',
    name: 'Health & Nutrition',
    children: [
      {
        id: 'supp',
        name: 'Supplements',
        children: [
          { id: 'protein', name: 'Protein', children: [{ id: 'whey', name: 'Whey Protein' }] },
          { id: 'creatine', name: 'Creatine' },
        ],
      },
    ],
  },
  { id: 'grocery', name: 'Grocery', children: [{ id: 'dairy', name: 'Dairy', children: [{ id: 'milk', name: 'Milk' }] }] },
];

function makeService(threshold = 0.82, margin = 0.15): AiCatalogCategoryService {
  const categoryService = { listCategories: jest.fn().mockResolvedValue(TREE) } as unknown as CategoryService;
  const config = {
    categoryAutoSelectThreshold: jest.fn().mockResolvedValue(threshold),
    categoryAutoSelectMargin: jest.fn().mockResolvedValue(margin),
  } as unknown as AiCatalogConfigService;
  return new AiCatalogCategoryService(categoryService, config);
}

const aiTree = (names: string[]): CategoryPathNode[] =>
  names.map((name, level) => ({ level, name, confidence: 0.9 }));

describe('AiCatalogCategoryService', () => {
  it('flattens the tree with full paths + depth', () => {
    const svc = makeService();
    const flat = svc.flatten(TREE as never);
    const whey = flat.find((n) => n.id === 'whey');
    expect(whey).toBeDefined();
    expect(whey!.depth).toBe(3);
    expect(whey!.path).toEqual(['Health & Nutrition', 'Supplements', 'Protein', 'Whey Protein']);
  });

  it('ranks the deepest specific match highest', () => {
    const svc = makeService();
    const flat = svc.flatten(TREE as never);
    const ranked = svc.rank(aiTree(['Health & Nutrition', 'Supplements', 'Protein', 'Whey Protein']), flat);
    expect(ranked[0].categoryId).toBe('whey');
  });

  it('auto-selects when top clears threshold and beats runner-up by margin', async () => {
    const svc = makeService();
    const result = await svc.match('store1', 'user1', aiTree(['Health & Nutrition', 'Supplements', 'Protein', 'Whey Protein']));
    expect(result.autoSelected?.categoryId).toBe('whey');
    expect(result.requiresConfirmation).toBe(false);
  });

  it('requires confirmation when confidence is too low', async () => {
    const svc = makeService(0.95, 0.2);
    const result = await svc.match('store1', 'user1', [{ level: 0, name: 'Something Vague', confidence: 0.3 }]);
    expect(result.autoSelected).toBeNull();
    expect(result.requiresConfirmation).toBe(true);
  });

  it('preserves the AI-suggested tree for audit even when unmatched', async () => {
    const svc = makeService();
    const tree = aiTree(['Totally Unknown Dept']);
    const result = await svc.match('store1', 'user1', tree);
    expect(result.aiSuggestedTree).toEqual(tree);
  });

  it('never returns categories outside the eligible tree', async () => {
    const svc = makeService(0.1, 0);
    const result = await svc.match('store1', 'user1', aiTree(['Whey Protein']));
    const ids = new Set(svc.flatten(TREE as never).map((n) => n.id));
    for (const c of result.candidates) expect(ids.has(c.categoryId)).toBe(true);
  });
});
