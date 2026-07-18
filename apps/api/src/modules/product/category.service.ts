import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Category, CategoryScope } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { StoreCategoryAccessService } from '../category-governance/store-category-access.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
    private readonly storeCategoryAccess: StoreCategoryAccessService,
  ) {}

  /**
   * List categories the merchant may use when creating products:
   * approved global categories + store-specific categories.
   */
  async listCategories(storeId: string, userId: string): Promise<Category[]> {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    await this.verifyStoreOwnership(profile.id, storeId);

    const approvedTree = await this.storeCategoryAccess.listApprovedCategoryTree(storeId);
    const approvedIds = new Set<string>();
    for (const parent of approvedTree) {
      approvedIds.add(parent.id);
      for (const child of parent.children) approvedIds.add(child.id);
    }

    const [globalTree, storeCategories] = await Promise.all([
      approvedIds.size
        ? this.buildApprovedGlobalTree(approvedIds)
        : Promise.resolve([] as Category[]),
      this.prisma.category.findMany({
        where: { storeId, scope: CategoryScope.STORE, isActive: true },
        include: {
          children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return [...globalTree, ...storeCategories];
  }

  /**
   * Build the full-depth tree the merchant can assign products to (4 levels
   * today, but nothing here caps it). Approval is
   * "by branch": if a store is approved for a category, all of its descendants
   * (sub-subcategories / product types) become usable, and every ancestor is
   * shown so the full path renders in the product form.
   */
  private async buildApprovedGlobalTree(approvedIds: Set<string>): Promise<Category[]> {
    const all = await this.prisma.category.findMany({
      where: { storeId: null, scope: CategoryScope.GLOBAL, isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const byId = new Map(all.map((c) => [c.id, c]));
    const childrenOf = new Map<string | null, typeof all>();
    for (const c of all) {
      const key = c.parentId ?? null;
      (childrenOf.get(key) ?? childrenOf.set(key, []).get(key)!).push(c);
    }

    // Closure: approved ids + all descendants + all ancestors.
    const usable = new Set<string>();
    const addDescendants = (id: string) => {
      if (usable.has(id)) return;
      usable.add(id);
      for (const child of childrenOf.get(id) ?? []) addDescendants(child.id);
    };
    for (const id of approvedIds) addDescendants(id);
    for (const id of [...usable]) {
      let cur = byId.get(id)?.parentId ?? null;
      while (cur) {
        usable.add(cur);
        cur = byId.get(cur)?.parentId ?? null;
      }
    }

    const toNode = (c: (typeof all)[number]): Category =>
      ({
        ...c,
        children: (childrenOf.get(c.id) ?? [])
          .filter((ch) => usable.has(ch.id))
          .map(toNode),
      }) as unknown as Category;

    return (childrenOf.get(null) ?? []).filter((c) => usable.has(c.id)).map(toNode);
  }

  async createCategory(
    userId: string,
    storeId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    await this.verifyStoreOwnership(
      (await this.merchantService.requireMerchantProfile(userId)).id,
      storeId,
    );

    const slug = this.toSlug(dto.name);

    const existing = await this.prisma.category.findFirst({
      where: { storeId, slug },
    });
    if (existing) {
      throw new ConflictException(`Category with slug "${slug}" already exists in this store`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException(`Parent category not found: ${dto.parentId}`);
    }

    const category = await this.prisma.category.create({
      data: {
        storeId,
        name: dto.name,
        slug,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
        scope: CategoryScope.STORE,
        isActive: true,
      },
    });

    this.logger.debug({ storeId, categoryId: category.id }, 'Category created');
    return category;
  }

  async updateCategory(
    userId: string,
    storeId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    await this.verifyStoreOwnership(
      (await this.merchantService.requireMerchantProfile(userId)).id,
      storeId,
    );

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, storeId, scope: CategoryScope.STORE },
    });
    if (!category) {
      throw new NotFoundException(`Store category not found: ${categoryId}`);
    }

    const slug =
      dto.name && dto.name !== category.name ? this.toSlug(dto.name) : undefined;

    if (slug) {
      const dupe = await this.prisma.category.findFirst({
        where: { storeId, slug, id: { not: categoryId } },
      });
      if (dupe) throw new ConflictException(`Slug "${slug}" already in use`);
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(dto.name !== undefined && { name: dto.name, slug: slug ?? category.slug }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  private async verifyStoreOwnership(
    merchantProfileId: string,
    storeId: string,
  ): Promise<void> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId, deletedAt: null },
    });
    if (!store) throw new NotFoundException('Store not found or not owned by you');
  }

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .slice(0, 60);
  }
}
