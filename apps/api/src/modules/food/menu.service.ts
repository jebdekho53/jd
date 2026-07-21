import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoryCatalogKind,
  DietType,
  MenuItemAvailability,
  StoreBusinessTypeStatus,
  StoreStatus,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StoreCategoryAccessService } from '../category-governance/store-category-access.service';
import { VerticalService } from '../store-vertical/vertical.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { isFoodVertical, slugifyMenu } from './vertical.constants';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateAddonGroupDto } from './dto/create-addon-group.dto';
import { CreateComboDto } from './dto/create-combo.dto';
import { mapPlatformSlugToMenuCategorySlug } from './utils/menu-category-slug.util';
import { storeHasFssaiOnFile } from '../../common/utils/store-fssai.util';

@Injectable()
export class MenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryAccess: StoreCategoryAccessService,
    private readonly verticalService: VerticalService,
    private readonly buyerCache: BuyerCacheService,
  ) {}

  async assertStoreOwnership(merchantProfileId: string, storeId: string) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId, deletedAt: null },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  /** Public gate for callers outside this service (e.g. menu AI). */
  async assertMenuAccess(storeId: string): Promise<void> {
    return this.assertFoodBusinessTypeApproved(storeId);
  }

  private async assertFoodBusinessTypeApproved(storeId: string): Promise<void> {
    await this.verticalService.ensureStoreBusinessTypesFromApplication(storeId);

    const foodTypes = await this.prisma.storeBusinessType.findMany({
      where: { storeId },
      select: { businessType: true, status: true },
    });

    if (
      foodTypes.some(
        (row) =>
          isFoodVertical(row.businessType) && row.status === StoreBusinessTypeStatus.APPROVED,
      )
    ) {
      return;
    }

    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: { status: true },
    });

    if (
      store?.status === StoreStatus.APPROVED &&
      foodTypes.some(
        (row) =>
          isFoodVertical(row.businessType) && row.status === StoreBusinessTypeStatus.PENDING,
      )
    ) {
      return;
    }

    // FOOD_VERTICALS only covers RESTAURANT / CLOUD_KITCHEN / CAFE, but the MENU
    // catalog also holds Bakery, Cakes and Sweets. An approved MENU category IS an
    // admin decision that this store may run a menu, so honour it — otherwise an
    // approved bakery is handed a menu builder it can never write to.
    const approvedMenuTree = await this.categoryAccess.listApprovedCategoryTree(
      storeId,
      CategoryCatalogKind.MENU,
    );
    if (approvedMenuTree.length > 0) return;

    throw new ForbiddenException(
      'Restaurant business type must be approved before managing menu categories',
    );
  }

  private async invalidateBuyerMenuCache(storeId: string): Promise<void> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: { slug: true },
    });
    if (!store?.slug) return;
    await this.buyerCache.invalidateStoreCache(store.slug);
  }

  /**
   * A missing FSSAI license no longer blocks the merchant from building their
   * menu — it holds the dish back from the storefront instead. Items created
   * without a license are stored HIDDEN and released automatically once the
   * license is on file (see releaseFssaiHeldItems), so a bakery can prepare its
   * catalog while the certificate is being uploaded, but nothing food-related
   * ever reaches a buyer uncertified.
   */
  private async assertStoreFssai(storeId: string): Promise<boolean> {
    return storeHasFssaiOnFile(this.prisma, storeId);
  }

  /** Publish dishes that were held back only because the FSSAI license was missing. */
  private async releaseFssaiHeldItems(storeId: string): Promise<void> {
    const held = await this.prisma.restaurantMenuItem.count({
      where: { storeId, availability: MenuItemAvailability.HIDDEN },
    });
    if (held === 0) return;
    if (!(await storeHasFssaiOnFile(this.prisma, storeId))) return;

    await this.prisma.restaurantMenuItem.updateMany({
      where: { storeId, availability: MenuItemAvailability.HIDDEN },
      data: { availability: MenuItemAvailability.AVAILABLE },
    });
    void this.invalidateBuyerMenuCache(storeId);
  }

  async getBuyerMenu(storeSlug: string) {
    const store = await this.prisma.store.findFirst({
      where: { slug: storeSlug, isActive: true, deletedAt: null },
      include: {
        restaurantProfile: { include: { cuisines: { include: { cuisine: true } } } },
        businessTypes: { where: { status: 'APPROVED' } },
      },
    });
    if (!store) throw new NotFoundException('Restaurant not found');

    const categories = await this.prisma.restaurantMenuCategory.findMany({
      where: { storeId: store.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { isActive: true, availability: { not: MenuItemAvailability.HIDDEN } },
          orderBy: { sortOrder: 'asc' },
          include: {
            variants: { orderBy: { sortOrder: 'asc' } },
            addonGroups: {
              orderBy: { sortOrder: 'asc' },
              include: {
                group: {
                  include: {
                    addons: {
                      where: { isActive: true },
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const combos = await this.prisma.restaurantCombo.findMany({
      where: { storeId: store.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          include: { menuItem: { select: { id: true, name: true, imageUrls: true, dietType: true } } },
        },
      },
    });

    return { store, categories, combos };
  }

  async listCategories(merchantProfileId: string, storeId: string) {
    await this.assertStoreOwnership(merchantProfileId, storeId);
    return this.prisma.restaurantMenuCategory.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { items: true } },
        platformCategory: { select: { id: true, name: true, slug: true, catalogKind: true } },
      },
    });
  }

  async getMerchantMenu(merchantProfileId: string, storeId: string) {
    await this.assertStoreOwnership(merchantProfileId, storeId);
    await this.releaseFssaiHeldItems(storeId);
    const fssaiOnFile = await storeHasFssaiOnFile(this.prisma, storeId);
    const [categories, addonGroups, combos] = await Promise.all([
      this.prisma.restaurantMenuCategory.findMany({
        where: { storeId },
        orderBy: { sortOrder: 'asc' },
        include: {
          platformCategory: { select: { id: true, name: true, slug: true } },
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              variants: { orderBy: { sortOrder: 'asc' } },
              addonGroups: {
                orderBy: { sortOrder: 'asc' },
                include: { group: { include: { addons: { orderBy: { sortOrder: 'asc' } } } } },
              },
            },
          },
        },
      }),
      this.prisma.restaurantAddonGroup.findMany({
        where: { storeId },
        orderBy: { sortOrder: 'asc' },
        include: { addons: { orderBy: { sortOrder: 'asc' } } },
      }),
      this.prisma.restaurantCombo.findMany({
        where: { storeId },
        orderBy: { sortOrder: 'asc' },
        include: {
          items: {
            include: { menuItem: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);
    return { categories, addonGroups, combos, fssaiOnFile };
  }

  async createCategory(merchantProfileId: string, storeId: string, dto: CreateMenuCategoryDto) {
    await this.assertStoreOwnership(merchantProfileId, storeId);
    await this.assertFoodBusinessTypeApproved(storeId);

    if (!dto.platformCategoryId?.trim()) {
      throw new BadRequestException('platformCategoryId is required — select an approved menu subcategory');
    }

    const platform = await this.categoryAccess.assertMenuSubcategoryApproved(
      storeId,
      merchantProfileId,
      dto.platformCategoryId,
    );

    const existing = await this.prisma.restaurantMenuCategory.findFirst({
      where: { storeId, platformCategoryId: dto.platformCategoryId, isActive: true },
    });
    if (existing) {
      throw new ConflictException('A menu category for this approved subcategory already exists');
    }

    const displayName = dto.name?.trim() || platform.name;
    const slug = dto.slug ?? slugifyMenu(displayName);
    const categorySlug = dto.categorySlug ?? mapPlatformSlugToMenuCategorySlug(platform.slug);

    const category = await this.prisma.restaurantMenuCategory.create({
      data: {
        storeId,
        platformCategoryId: platform.subcategoryId,
        name: displayName,
        slug,
        categorySlug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        platformCategory: { select: { id: true, name: true, slug: true } },
      },
    });
    void this.invalidateBuyerMenuCache(storeId);
    return category;
  }

  async createMenuItem(merchantProfileId: string, storeId: string, dto: CreateMenuItemDto) {
    await this.assertStoreOwnership(merchantProfileId, storeId);
    await this.assertFoodBusinessTypeApproved(storeId);
    const fssaiOnFile = await this.assertStoreFssai(storeId);

    const category = await this.prisma.restaurantMenuCategory.findFirst({
      where: { id: dto.categoryId, storeId },
    });
    if (!category) throw new NotFoundException('Menu category not found');

    if (category.platformCategoryId) {
      await this.categoryAccess.assertMenuSubcategoryApproved(
        storeId,
        merchantProfileId,
        category.platformCategoryId,
      );
    }

    const slug = dto.slug ?? slugifyMenu(dto.name);
    const item = await this.prisma.restaurantMenuItem.create({
      data: {
        storeId,
        categoryId: dto.categoryId,
        name: dto.name,
        slug,
        description: dto.description,
        imageUrls: (dto.imageUrls ?? []) as Prisma.InputJsonValue,
        basePrice: dto.basePrice,
        mrp: dto.mrp,
        dietType: dto.dietType ?? DietType.VEG,
        spiceLevel: dto.spiceLevel,
        prepTimeMins: dto.prepTimeMins ?? 15,
        servingSize: dto.servingSize,
        cuisineName: dto.cuisineName,
        availability: fssaiOnFile
          ? MenuItemAvailability.AVAILABLE
          : MenuItemAvailability.HIDDEN,
        allowsSpecialInstructions: dto.allowsSpecialInstructions ?? true,
        sortOrder: dto.sortOrder ?? 0,
        variants: dto.variants?.length
          ? {
              create: dto.variants.map((v, i) => ({
                name: v.name,
                price: v.price,
                isDefault: v.isDefault ?? i === 0,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: { variants: true },
    });

    await this.upsertSearchIndex(item.id);
    void this.invalidateBuyerMenuCache(storeId);
    return { ...item, fssaiHold: !fssaiOnFile };
  }

  async createAddonGroup(merchantProfileId: string, storeId: string, dto: CreateAddonGroupDto) {
    await this.assertStoreOwnership(merchantProfileId, storeId);
    return this.prisma.restaurantAddonGroup.create({
      data: {
        storeId,
        name: dto.name,
        selectionType: dto.selectionType ?? 'SINGLE',
        isRequired: dto.isRequired ?? false,
        minSelections: dto.minSelections ?? 0,
        maxSelections: dto.maxSelections ?? 1,
        sortOrder: dto.sortOrder ?? 0,
        addons: dto.addons?.length
          ? {
              create: dto.addons.map((a, i) => ({
                name: a.name,
                price: a.price ?? 0,
                dietType: a.dietType,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: { addons: true },
    });
  }

  async linkAddonGroupToItem(
    merchantProfileId: string,
    storeId: string,
    menuItemId: string,
    groupId: string,
  ) {
    await this.assertStoreOwnership(merchantProfileId, storeId);
    const [item, group] = await Promise.all([
      this.prisma.restaurantMenuItem.findFirst({ where: { id: menuItemId, storeId } }),
      this.prisma.restaurantAddonGroup.findFirst({ where: { id: groupId, storeId } }),
    ]);
    if (!item || !group) throw new NotFoundException('Menu item or addon group not found');

    return this.prisma.restaurantMenuItemAddonGroup.upsert({
      where: { menuItemId_groupId: { menuItemId, groupId } },
      create: { menuItemId, groupId },
      update: {},
    });
  }

  async createCombo(merchantProfileId: string, storeId: string, dto: CreateComboDto) {
    await this.assertStoreOwnership(merchantProfileId, storeId);
    if (!dto.items?.length) throw new BadRequestException('Combo must include at least one item');

    const slug = dto.slug ?? slugifyMenu(dto.name);
    return this.prisma.restaurantCombo.create({
      data: {
        storeId,
        name: dto.name,
        slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        comboPrice: dto.comboPrice,
        sortOrder: dto.sortOrder ?? 0,
        items: {
          create: dto.items.map((it, i) => ({
            menuItemId: it.menuItemId,
            quantity: it.quantity ?? 1,
            sortOrder: i,
          })),
        },
      },
      include: { items: { include: { menuItem: true } } },
    });
  }

  async upsertSearchIndex(menuItemId: string) {
    const item = await this.prisma.restaurantMenuItem.findUnique({
      where: { id: menuItemId },
      include: { category: true },
    });
    if (!item) return;

    const searchText = [item.name, item.description, item.cuisineName, item.category.name]
      .filter(Boolean)
      .join(' ');

    await this.prisma.$executeRaw`
      INSERT INTO restaurant_menu_search_index (id, store_id, menu_item_id, name, description, cuisine_name, category_name, diet_type, search_vector, updated_at)
      VALUES (
        ${`rms_${menuItemId}`},
        ${item.storeId},
        ${item.id},
        ${item.name},
        ${item.description},
        ${item.cuisineName},
        ${item.category.name},
        ${item.dietType}::"DietType",
        to_tsvector('english', ${searchText}),
        NOW()
      )
      ON CONFLICT (menu_item_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        cuisine_name = EXCLUDED.cuisine_name,
        category_name = EXCLUDED.category_name,
        diet_type = EXCLUDED.diet_type,
        search_vector = EXCLUDED.search_vector,
        updated_at = NOW()
    `;
  }
}