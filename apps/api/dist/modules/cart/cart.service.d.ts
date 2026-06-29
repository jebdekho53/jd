import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { CartCacheService } from './cart-cache.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { StorePromotionService } from '../promotion/store-promotion.service';
import { MembershipBenefitService } from '../membership/membership-benefit.service';
import type { PromoBreakdown } from '../promotion/promotion-pricing.service';
import { type ReturnPolicySummary } from '../../common/utils/product-return-policy.util';
export interface CartItemView {
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    unitPrice: number;
    mrp: number | null;
    lineTotal: number;
    savings: number;
    product: {
        name: string;
        slug: string;
        imageUrls: string[];
        isVeg: boolean | null;
    };
    variant: {
        name: string;
        sku: string;
        weightGrams: number | null;
    };
    availableQty: number;
    returnPolicy?: ReturnPolicySummary;
}
export interface CartTotals {
    subtotal: number;
    discount: number;
    catalogSavings: number;
    offerDiscount: number;
    couponDiscount: number;
    deliveryDiscount: number;
    totalSavings: number;
    tax: number;
    deliveryFee: number;
    grandTotal: number;
    promo?: PromoBreakdown;
}
export interface CartView {
    id: string;
    storeId: string;
    store: {
        id: string;
        name: string;
        slug: string;
        minOrderAmount: number;
    };
    items: CartItemView[];
    totals: CartTotals;
    itemCount: number;
    appliedCouponCode?: string | null;
}
export declare class CartService {
    private readonly prisma;
    private readonly audit;
    private readonly domainEvents;
    private readonly cartCache;
    private readonly promotions;
    private readonly membershipBenefits;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditService, domainEvents: DomainEventsService, cartCache: CartCacheService, promotions: StorePromotionService, membershipBenefits: MembershipBenefitService);
    getBuyerProfileId(userId: string): Promise<string>;
    invalidateCache(userId: string): Promise<void>;
    private getOrCreateBuyerProfile;
    getCart(userId: string): Promise<CartView | null>;
    addItem(userId: string, dto: AddCartItemDto, ipAddress?: string): Promise<CartView>;
    updateItem(userId: string, cartItemId: string, dto: UpdateCartItemDto, ipAddress?: string): Promise<CartView | null>;
    removeItem(userId: string, cartItemId: string, ipAddress?: string): Promise<CartView | null>;
    clearCart(userId: string, ipAddress?: string): Promise<void>;
    private loadCartFromDb;
    private resolveVariant;
    private availableQty;
    private assertCartItemOwnership;
    private removeItemById;
    private getStoreName;
}
