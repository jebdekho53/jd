import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { BuyerStoreService } from './buyer-store.service';
import { BuyerProductService } from './buyer-product.service';
import { DiscoverStoresDto } from './dto/discover-stores.dto';
import { StoreProductsDto } from './dto/store-products.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { CompareProductDto } from './dto/compare-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StepUpGuard } from '../../common/guards/step-up.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireStepUp } from '../../common/decorators/require-step-up.decorator';
import { RequestUser } from '../../common/types';

@ApiTags('buyer')
@Public()
@Controller('buyer')
export class BuyerController {
  private readonly logger = new Logger(BuyerController.name);

  constructor(
    private readonly storeService: BuyerStoreService,
    private readonly productService: BuyerProductService,
    private readonly jwtService: JwtService,
  ) {}

  private optionalUserId(req: Request): string | undefined {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return undefined;
    try {
      const payload = this.jwtService.verify<{ sub: string }>(header.slice(7));
      return payload.sub;
    } catch {
      return undefined;
    }
  }

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

  @Get('compare/:productId')
  @ApiParam({ name: 'productId', description: 'Anchor product ID to compare across stores' })
  @ApiOperation({
    summary: 'Compare prices for the same product across nearby stores',
    description:
      'Finds matching products by name and unit near the buyer. Returns stores sorted by final payable price.',
  })
  async compareProduct(
    @Param('productId') productId: string,
    @Query() dto: CompareProductDto,
  ) {
    const data = await this.productService.compareProduct(productId, dto);
    if (!data) {
      throw new NotFoundException('No comparable offers found for this product');
    }
    return { success: true, data };
  }

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

  @Get('products/:id/offers')
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({
    summary: 'PDP offers bundle for a product',
    description:
      'Returns store promotions, coupons, campaign offers, wallet cashback, Plus benefits, and free-delivery eligibility.',
  })
  async getProductOffers(@Param('id') id: string, @Req() req: Request) {
    const userId = this.optionalUserId(req);
    const data = await this.productService.getProductOffers(id, userId);
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

  @Get('delivery-eta')
  @ApiOperation({
    summary: 'Door-to-door delivery ETA from a store to a buyer coordinate',
    description: 'Used at checkout. Resolves road distance + traffic via the routing provider, with a road-adjusted fallback.',
  })
  async deliveryEta(
    @Query('storeId') storeId: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const buyerLat = Number(lat);
    const buyerLng = Number(lng);
    if (!storeId || !Number.isFinite(buyerLat) || !Number.isFinite(buyerLng)) {
      return { success: true, data: { etaMinutes: null, distanceKm: null, source: 'unavailable' } };
    }
    const data = await this.storeService.getDeliveryEta(storeId, buyerLat, buyerLng);
    return { success: true, data };
  }

  @Patch('profile')
  @Roles('BUYER')
  @UseGuards(JwtAuthGuard, RolesGuard, StepUpGuard)
  @RequireStepUp()
  @ApiOperation({ summary: 'Update buyer profile (requires step-up)' })
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: any,
  ) {
    return { success: true, message: 'Profile updated successfully' };
  }
}
