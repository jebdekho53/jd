import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AddonSelectionType,
  DietType,
  MenuItemAvailability,
  SpiceLevel,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { slugifyMenu } from './vertical.constants';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateAddonGroupDto } from './dto/create-addon-group.dto';
import { CreateComboDto } from './dto/create-combo.dto';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async assertStoreOwnership(merchantProfileId: string, storeId: string) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId, deletedAt: null },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
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
      include: { _count: { select: { items: true } } },
    });
  }

  async getMerchantMenu(merchantProfileId: string, storeId: string) {
    await this.assertStoreOwnership(merchantProfileId, storeId);
    const [categories, addonGroups, combos] = await Promise.all([
      this.prisma.restaurantMenuCategory.findMany({
        where: { storeId },
        orderBy: { sortOrder: 'asc' },
        include: {
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
    return { categories, addonGroups, combos };
  }

  async createCategory(merchantProfileId: string, storeId: string, dto: CreateMenuCategoryDto) {
    await this.assertStoreOwnership(merchantProfileId, storeId);
    const slug = dto.slug ?? slugifyMenu(dto.name);
    return this.prisma.restaurantMenuCategory.create({
      data: {
        storeId,
        name: dto.name,
        slug,
        categorySlug: dto.categorySlug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async createMenuItem(merchantProfileId: string, storeId: string, dto: CreateMenuItemDto) {
    await this.assertStoreOwnership(merchantProfileId, storeId);
    const category = await this.prisma.restaurantMenuCategory.findFirst({
      where: { id: dto.categoryId, storeId },
    });
    if (!category) throw new NotFoundException('Menu category not found');

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
    return item;
  }

  async createAddonGroup(merchantProfileId: string, storeId: string, dto: CreateAddonGroupDto) {
    await this.assertStoreOwnership(merchantProfileId, storeId);
    return this.prisma.restaurantAddonGroup.create({
      data: {
        storeId,
        name: dto.name,
        selectionType: dto.selectionType ?? AddonSelectionType.SINGLE,
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
