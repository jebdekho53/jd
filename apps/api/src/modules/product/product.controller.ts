import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { UpdateProductStatusDto } from './dto/update-status.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

const STORE_PARAM = ':storeId';

@ApiTags(Tags.PRODUCTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller(`merchant/stores/${STORE_PARAM}`)
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
  ) {}

  // ── Categories ─────────────────────────────────────────────────────────────

  @Get('categories')
  @Permissions('products:read')
  @ApiParam({ name: 'storeId' })
  @ApiOperation({ summary: 'List approved categories for product creation' })
  async listCategories(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
  ) {
    const data = await this.categoryService.listCategories(storeId, user.id);
    return { success: true, data };
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiOperation({ summary: 'Create a store-specific category' })
  async createCategory(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    const data = await this.categoryService.createCategory(user.id, storeId, dto);
    return { success: true, data };
  }

  @Patch('categories/:categoryId')
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'categoryId' })
  @ApiOperation({ summary: 'Update a store-specific category' })
  async updateCategory(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const data = await this.categoryService.updateCategory(user.id, storeId, categoryId, dto);
    return { success: true, data };
  }

  // ── Products ───────────────────────────────────────────────────────────────

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiOperation({ summary: 'Create a new product with default variant + inventory' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 400, description: 'Price > MRP or duplicate SKU' })
  async createProduct(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Body() dto: CreateProductDto,
    @Ip() ip: string,
  ) {
    const data = await this.productService.createProduct(user.id, storeId, dto, ip);
    return { success: true, data };
  }

  @Get('products')
  @Permissions('products:read')
  @ApiParam({ name: 'storeId' })
  @ApiOperation({ summary: 'List products with pagination, status and category filters' })
  async listProducts(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Query() query: ListProductsDto,
  ) {
    const { products, total } = await this.productService.listProducts(user.id, storeId, query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return {
      success: true,
      data: products,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get('products/:id')
  @Permissions('products:read')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({ summary: 'Get product detail with all variants and inventory' })
  async getProduct(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('id') productId: string,
  ) {
    const data = await this.productService.getProduct(user.id, storeId, productId);
    return { success: true, data };
  }

  @Patch('products/:id')
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({ summary: 'Update product fields (name, description, images, price…)' })
  async updateProduct(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('id') productId: string,
    @Body() dto: UpdateProductDto,
    @Ip() ip: string,
  ) {
    const data = await this.productService.updateProduct(user.id, storeId, productId, dto, ip);
    return { success: true, data };
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({ summary: 'Soft-delete product (removed from buyer view immediately)' })
  async deleteProduct(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('id') productId: string,
    @Ip() ip: string,
  ) {
    await this.productService.deleteProduct(user.id, storeId, productId, ip);
    return { success: true, data: { message: 'Product deleted' } };
  }

  // ── Inventory ──────────────────────────────────────────────────────────────

  @Patch('products/:id/inventory')
  @Permissions('inventory:write')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({
    summary: 'Update stock for the default variant. For multi-variant products pass ?variantId=',
  })
  async updateInventory(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('id') productId: string,
    @Query('variantId') variantId: string | undefined,
    @Body() dto: UpdateInventoryDto,
    @Ip() ip: string,
  ) {
    const vid = await this.resolveVariantId(productId, variantId);
    const data = await this.productService.updateInventory(user.id, storeId, productId, vid, dto, ip);
    return { success: true, data };
  }

  // ── Price ─────────────────────────────────────────────────────────────────

  @Patch('products/:id/price')
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({
    summary: 'Update selling price (and optional MRP) for default or specific variant',
  })
  async updatePrice(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('id') productId: string,
    @Query('variantId') variantId: string | undefined,
    @Body() dto: UpdatePriceDto,
    @Ip() ip: string,
  ) {
    const vid = await this.resolveVariantId(productId, variantId);
    const data = await this.productService.updatePrice(user.id, storeId, productId, vid, dto, ip);
    return { success: true, data };
  }

  // ── Status ────────────────────────────────────────────────────────────────

  @Patch('products/:id/status')
  @Permissions('products:write')
  @ApiParam({ name: 'storeId' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({ summary: 'Toggle product active/inactive status' })
  async updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Param('id') productId: string,
    @Body() dto: UpdateProductStatusDto,
    @Ip() ip: string,
  ) {
    const data = await this.productService.updateStatus(user.id, storeId, productId, dto, ip);
    return { success: true, data };
  }

  // ---------------------------------------------------------------------------
  // Private: resolve variantId — defaults to product's default variant
  // ---------------------------------------------------------------------------

  private async resolveVariantId(
    productId: string,
    variantId?: string,
  ): Promise<string> {
    if (variantId) return variantId;
    return this.productService.resolveDefaultVariantId(productId);
  }
}
