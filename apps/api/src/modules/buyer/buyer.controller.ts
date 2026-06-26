import {
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { BuyerStoreService } from './buyer-store.service';
import { BuyerProductService } from './buyer-product.service';
import { DiscoverStoresDto } from './dto/discover-stores.dto';
import { StoreProductsDto } from './dto/store-products.dto';
import { SearchProductsDto } from './dto/search-products.dto';

@ApiTags('buyer')
@Public()
@Controller('buyer')
export class BuyerController {
  private readonly logger = new Logger(BuyerController.name);

  constructor(
    private readonly storeService: BuyerStoreService,
    private readonly productService: BuyerProductService,
  ) {}

  // ── Store Discovery ─────────────────────────────────────────────────────

  @Get('stores')
  @ApiOperation({
    summary: 'Discover APPROVED, active stores near a coordinate',
    description:
      'Returns stores sorted by distance. Only APPROVED + isActive stores are returned. ' +
      'Each card includes an `isOpen` flag computed from today\'s store hours (IST).',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of nearby stores' })
  async discoverStores(@Query() dto: DiscoverStoresDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const { stores, total } = await this.storeService.discoverStores(dto);
    this.logger.log(
      `GET /buyer/stores → ${stores.length} stores (total=${total}, radiusKm=${dto.radiusKm ?? 5})`,
    );
    return {
      success: true,
      data: stores,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get('stores/:slug')
  @ApiParam({ name: 'slug', description: 'Store slug' })
  @ApiOperation({
    summary: 'Get full store detail including hours, service areas and category list',
  })
  @ApiResponse({ status: 200, description: 'Store detail' })
  @ApiResponse({ status: 404, description: 'Store not found or not approved' })
  async getStore(@Param('slug') slug: string) {
    const data = await this.storeService.getStoreBySlug(slug);
    return { success: true, data };
  }

  // ── Store Products ──────────────────────────────────────────────────────

  @Get('stores/:slug/products')
  @ApiParam({ name: 'slug', description: 'Store slug' })
  @ApiOperation({
    summary: 'List in-stock, active products for an approved store',
    description:
      'Only returns products where isActive=true and at least one variant has inventory > 0.',
  })
  async getStoreProducts(
    @Param('slug') slug: string,
    @Query() dto: StoreProductsDto,
  ) {
    // Resolve storeId from slug first (fast since store detail is cached)
    const storeDetail = await this.storeService.getStoreBySlug(slug);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const { products, total } = await this.productService.listStoreProducts(
      storeDetail.id,
      dto,
    );
    return {
      success: true,
      data: products,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Product Search ──────────────────────────────────────────────────────

  @Get('products/search')
  @ApiOperation({
    summary: 'Search products by name, brand, description or tags',
    description:
      'Uses PostgreSQL full-text search via the productSearchIndex.searchText field. ' +
      'Optionally filter by categoryId or storeId.',
  })
  async searchProducts(@Query() dto: SearchProductsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const { products, total } = await this.productService.searchProducts(dto);
    return {
      success: true,
      data: products,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get('products/search/grouped')
  @ApiOperation({ summary: 'Search products grouped by store (store-centric results)' })
  async searchProductsGrouped(@Query() dto: SearchProductsDto) {
    const { groups, total } = await this.productService.searchProductsGrouped(dto);
    return { success: true, data: groups, meta: { total, storeCount: groups.length } };
  }

  @Get('products/:id')
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({
    summary: 'Get a single in-stock product by ID',
    description:
      'Returns one visible product with store info. Optionally narrow to a store via the `store` slug query param.',
  })
  @ApiResponse({ status: 200, description: 'Product detail' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(
    @Param('id') id: string,
    @Query('store') storeSlug?: string,
  ) {
    const data = await this.productService.getProductById(id, storeSlug);
    if (!data) {
      throw new NotFoundException('Product not found');
    }
    return { success: true, data };
  }

  @Get('categories/:categoryId/stores')
  @ApiOperation({ summary: 'List approved stores selling in a category near the buyer' })
  async listCategoryStores(
    @Param('categoryId') categoryId: string,
    @Query() dto: DiscoverStoresDto,
    @Query('subcategoryId') subcategoryId?: string,
  ) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const { stores, total } = await this.storeService.listStoresForCategory(categoryId, {
      ...dto,
      subcategoryId,
    });
    return {
      success: true,
      data: stores,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Categories ──────────────────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({
    summary: 'List global categories (and optionally a store\'s custom categories)',
    description: 'Pass ?storeId= to include store-specific categories alongside global ones.',
  })
  async listCategories(@Query('storeId') storeId?: string) {
    const data = await this.productService.listCategories(storeId);
    this.logger.log(
      `GET /buyer/categories storeId=${storeId ?? 'global'} → ${data.length} categories`,
    );
    return { success: true, data };
  }
}
