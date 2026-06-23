import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Category, CategoryScope } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantService: MerchantService,
  ) {}

  /**
   * List all categories visible to a store:
   *   - Global categories (storeId = null)
   *   - Store-specific categories (storeId = this store)
   * Active only.
   */
  async listCategories(storeId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        OR: [
          { storeId: null, scope: CategoryScope.GLOBAL },
          { storeId },
        ],
        isActive: true,
      },
      include: {
        children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Create a store-specific category.
   */
  async createCategory(
    userId: string,
    storeId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    await this.verifyStoreOwnership(userId, storeId);

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

  /**
   * Update a store-specific category.
   */
  async updateCategory(
    userId: string,
    storeId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    await this.verifyStoreOwnership(userId, storeId);

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

  // ---------------------------------------------------------------------------

  private async verifyStoreOwnership(userId: string, storeId: string): Promise<void> {
    const profile = await this.merchantService.requireMerchantProfile(userId);
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
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
