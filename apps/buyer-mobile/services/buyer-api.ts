import { getAccessToken, getApiBaseUrl, getRefreshToken, setTokens, clearTokens } from '@/lib/auth/session';
import { useAuthStore } from '@/store/auth-store';
import { normalizeError, type NormalizedError } from '@/types/errors';
import { uid } from '@/lib/uid';
import type { BuyerAddress, UpsertAddressPayload } from '@/types/address';
import type { AuthUser, RequestOtpResult, VerifyOtpResult } from '@/types/auth';
import type { CategoryItem, StoreCard, StoreDetail, BuyerProduct, BuyerProductWithStore } from '@/types/buyer';
import type { Cart } from '@/types/cart';
import type { CompareProductResult } from '@/types/compare';
import type {
  CheckoutPayload,
  CodCheckoutResult,
  InitiateCheckoutPayload,
  InitiateCheckoutResult,
  LegalDocument,
  LegalPendingDocument,
  RazorpayOrderResult,
  VerifyPaymentPayload,
  VerifyPaymentResult,
} from '@/types/checkout';
import type {
  AddFoodCartItemPayload,
  Cuisine,
  FoodCart,
  FoodCodCheckoutResult,
  InitiateFoodCheckoutPayload,
  ListRestaurantsParams,
  RestaurantDetail,
  RestaurantMenu,
  RestaurantSummary,
} from '@/types/food';
import type { OrderDetail, OrderListResponse } from '@/types/orders';
import type {
  CreateTicketPayload,
  InboxPage,
  NotificationPreferences,
  SupportArticle,
  SupportCategory,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketsPage,
} from '@/types/profile';
import type {
  CreateProductReviewPayload,
  ProductReview,
  ProductReviewsResult,
} from '@/types/reviews';
import type { ReferralSummary, RewardsSummary, WalletSummary } from '@/types/wallet';
import type { WishlistItem } from '@/types/wishlist';

export class BuyerApiError extends Error {
  public normalized: NormalizedError;

  constructor(message: string, public status: number, public code?: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'BuyerApiError';
    this.normalized = normalizeError(this, { status, code, ...context });
  }
}

/** Thrown when the API rejects a sensitive action (checkout) because the
 *  session's login is more than 15 minutes old — the caller must trigger a
 *  step-up re-auth (OTP) and retry. */
export class StepUpRequiredError extends BuyerApiError {
  constructor() {
    super('Please verify your phone again to continue', 403, 'STEP_UP_REQUIRED');
    this.name = 'StepUpRequiredError';
  }
}

/** Thrown when a legal document (e.g. buyer terms) must be accepted before
 *  the action can proceed — the caller should show the pending documents. */
export class LegalAcceptanceRequiredError extends BuyerApiError {
  constructor() {
    super('Please accept the latest terms to continue', 451, 'LEGAL_ACCEPTANCE_REQUIRED');
    this.name = 'LegalAcceptanceRequiredError';
  }
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

function errorCode(status: number): string {
  if (status === 0) return 'NETWORK_ERROR';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 422) return 'VALIDATION_ERROR';
  if (status === 451) return 'LEGAL_ACCEPTANCE_REQUIRED';
  if (status >= 500) return 'SERVER_ERROR';
  return `HTTP_${status}`;
}

let refreshInFlight: Promise<boolean> | null = null;

/** Rotates the access token using the stored refresh token. Returns false
 *  (and clears the session) if the refresh token itself is invalid/expired. */
async function tryRefreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;
      try {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const body = (await res.json()) as ApiResponse<{ accessToken: string; refreshToken: string }>;
        await setTokens(body.data.accessToken, body.data.refreshToken);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/**
 * Talks directly to the NestJS API (never through a web BFF — there is no
 * Next.js layer for this app to sit behind). Bearer-token auth via
 * SecureStore. On a 401 it tries one silent refresh-token rotation before
 * giving up and clearing the session, so a merely-expired access token never
 * bounces the buyer back to the login screen mid-session.
 */
export async function buyerFetch<T>(
  path: string,
  init?: RequestInit & { skipAuthRetry?: boolean; idempotencyKey?: string },
): Promise<T> {
  const base = getApiBaseUrl();
  const token = await getAccessToken();

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.idempotencyKey ? { 'Idempotency-Key': init.idempotencyKey } : {}),
        'X-Client': 'buyer-mobile',
        ...init?.headers,
      },
    });
  } catch (err) {
    const normalized = normalizeError(err, { path, method: init?.method ?? 'GET' });
    throw new BuyerApiError(normalized.message, 0, 'NETWORK_ERROR', { path });
  }

  if (res.status === 401 && !init?.skipAuthRetry) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return buyerFetch<T>(path, { ...init, skipAuthRetry: true });
    }
    await clearTokens();
    useAuthStore.getState().clearSession();
    throw new BuyerApiError('Session expired', 401, 'UNAUTHORIZED', { path });
  }

  const body = await res.json().catch(() => ({}));

  if (res.status === 403) {
    const message = (body as { message?: string })?.message ?? '';
    if (/step-up/i.test(message) || /re-authentication required/i.test(message)) {
      throw new StepUpRequiredError();
    }
  }

  if (res.status === 451 || /legal.*accept/i.test((body as { message?: string })?.message ?? '')) {
    throw new LegalAcceptanceRequiredError();
  }

  if (!res.ok) {
    const raw = (body as { message?: string | string[] })?.message ?? 'Request failed';
    const message = Array.isArray(raw) ? raw.join(', ') : String(raw);
    // Some endpoints throw a structured payload (e.g. the food cart's
    // FOOD_CART_STORE_CONFLICT) — prefer its own code over the status-derived
    // one so callers can branch on the specific failure.
    const code = (body as { code?: string })?.code ?? errorCode(res.status);
    throw new BuyerApiError(message, res.status, code, { path });
  }

  return body as T;
}

function buildQuery(params: object): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') q.set(key, String(val));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function requestOtp(phone: string): Promise<RequestOtpResult> {
  const res = await buyerFetch<ApiResponse<RequestOtpResult>>('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, deviceName: 'buyer-mobile' }),
  });
  return res.data;
}

export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  const res = await buyerFetch<ApiResponse<VerifyOtpResult>>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code, deviceName: 'buyer-mobile' }),
  });
  await setTokens(res.data.accessToken, res.data.refreshToken);
  return res.data;
}

/** Re-authenticates the current session for a sensitive action (checkout)
 *  without a full logout — issues a fresh access token with a new authTime. */
export async function stepUp(phone: string, code: string): Promise<void> {
  await buyerFetch<ApiResponse<unknown>>('/auth/step-up', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await buyerFetch<ApiResponse<AuthUser>>('/auth/me');
  return res.data;
}

export async function logoutSession(): Promise<void> {
  await buyerFetch<ApiResponse<unknown>>('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
}

// ─── Discovery ───────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await buyerFetch<ApiResponse<CategoryItem[]>>('/buyer/categories');
  return res.data;
}

export interface DiscoverStoresParams {
  lat: number;
  lng: number;
  pincode?: string;
  radiusKm?: number;
  page?: number;
  limit?: number;
  sort?: 'distance' | 'popular' | 'fast' | 'new' | 'rating';
}

export async function discoverStores(
  params: DiscoverStoresParams,
): Promise<{ stores: StoreCard[]; meta: ApiResponse<unknown>['meta'] }> {
  const res = await buyerFetch<ApiResponse<StoreCard[]>>(`/buyer/stores${buildQuery(params)}`);
  return { stores: res.data, meta: res.meta };
}

export async function getStore(slug: string): Promise<StoreDetail> {
  const res = await buyerFetch<ApiResponse<StoreDetail>>(`/buyer/stores/${slug}`);
  return res.data;
}

export async function getStoreProducts(
  slug: string,
  params?: { categoryId?: string; page?: number; limit?: number },
): Promise<{ products: BuyerProduct[]; meta: ApiResponse<unknown>['meta'] }> {
  const res = await buyerFetch<ApiResponse<BuyerProduct[]>>(
    `/buyer/stores/${slug}/products${buildQuery(params ?? {})}`,
  );
  return { products: res.data, meta: res.meta };
}

export interface SearchProductsParams {
  q?: string;
  categoryId?: string;
  lat?: number;
  lng?: number;
  pincode?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export async function searchProducts(
  params: SearchProductsParams,
): Promise<{ products: BuyerProductWithStore[]; meta: ApiResponse<unknown>['meta'] }> {
  const res = await buyerFetch<ApiResponse<BuyerProductWithStore[]>>(
    `/buyer/products/search${buildQuery(params)}`,
  );
  return { products: res.data, meta: res.meta };
}

export async function getProduct(id: string, storeSlug?: string): Promise<BuyerProductWithStore> {
  const res = await buyerFetch<ApiResponse<BuyerProductWithStore>>(
    `/buyer/products/${id}${buildQuery({ store: storeSlug })}`,
  );
  return res.data;
}

/** Compares the anchor product's price across nearby grocery stores. Only
 *  works for GROCERY/FRUITS_VEGETABLES stores — the server 400s otherwise
 *  (restaurants, and stores without an approved grocery catalog). Returns
 *  null when nothing comparable is found nearby. */
export async function compareProduct(
  productId: string,
  params?: { lat?: number; lng?: number; pincode?: string },
): Promise<CompareProductResult | null> {
  try {
    const res = await buyerFetch<ApiResponse<CompareProductResult>>(
      `/buyer/compare/${productId}${buildQuery(params ?? {})}`,
    );
    return res.data;
  } catch (e) {
    if (e instanceof BuyerApiError && (e.status === 404 || e.status === 400)) return null;
    throw e;
  }
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export async function getCart(): Promise<Cart | null> {
  const res = await buyerFetch<ApiResponse<Cart | null>>('/buyer/cart');
  return res.data;
}

export async function addCartItem(input: {
  productId: string;
  variantId: string;
  quantity: number;
}): Promise<Cart> {
  const res = await buyerFetch<ApiResponse<Cart>>('/buyer/cart/items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateCartItem(cartItemId: string, quantity: number): Promise<Cart | null> {
  const res = await buyerFetch<ApiResponse<Cart | null>>(`/buyer/cart/items/${cartItemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
  return res.data;
}

export async function removeCartItem(cartItemId: string): Promise<Cart | null> {
  const res = await buyerFetch<ApiResponse<Cart | null>>(`/buyer/cart/items/${cartItemId}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function clearCart(): Promise<void> {
  await buyerFetch<ApiResponse<unknown>>('/buyer/cart', { method: 'DELETE' });
}

// ─── Legal ───────────────────────────────────────────────────────────────────

export async function getPendingLegal(portal: 'buyer' = 'buyer'): Promise<LegalPendingDocument[]> {
  const res = await buyerFetch<ApiResponse<LegalPendingDocument[]>>(
    `/legal/pending${buildQuery({ portal })}`,
  );
  return res.data;
}

/** Public. The buyer terms screen renders from here so its words are the exact
 *  ones recorded against an acceptance — never a separately-maintained copy. */
export async function getLegalDocument(code: string): Promise<LegalDocument> {
  const res = await buyerFetch<ApiResponse<LegalDocument>>(`/legal/documents/${code}`);
  return res.data;
}

export async function acceptLegal(code: string, version: string): Promise<void> {
  await buyerFetch<ApiResponse<unknown>>('/legal/accept', {
    method: 'POST',
    body: JSON.stringify({ code, version }),
  });
}

// ─── Checkout ────────────────────────────────────────────────────────────────

/** COD checkout. Idempotency-Key is generated once per attempt so a retried
 *  request (e.g. after a step-up re-auth) never double-places the order. */
export async function checkoutCod(
  payload: CheckoutPayload,
  idempotencyKey: string = uid(),
): Promise<CodCheckoutResult> {
  const res = await buyerFetch<ApiResponse<CodCheckoutResult>>('/buyer/checkout/cod', {
    method: 'POST',
    body: JSON.stringify(payload),
    idempotencyKey,
  });
  return res.data;
}

/** Initiates online (Razorpay) checkout — reserves inventory and creates a
 *  pending order, but does not charge anything yet. Follow up with
 *  createRazorpayOrder(checkoutId) to open the payment sheet. */
export async function initiateCheckout(
  payload: InitiateCheckoutPayload,
  idempotencyKey: string = uid(),
): Promise<InitiateCheckoutResult> {
  const res = await buyerFetch<ApiResponse<InitiateCheckoutResult>>('/buyer/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
    idempotencyKey,
  });
  return res.data;
}

/** Idempotent — re-calling with the same checkoutId returns the same
 *  Razorpay order, so it is safe to retry after a step-up re-auth. */
export async function createRazorpayOrder(
  checkoutId: string,
  idempotencyKey: string = uid(),
): Promise<RazorpayOrderResult> {
  const res = await buyerFetch<ApiResponse<RazorpayOrderResult>>('/payments/razorpay/create-order', {
    method: 'POST',
    body: JSON.stringify({ checkoutId }),
    idempotencyKey,
  });
  return res.data;
}

/** Verifies the Razorpay signature server-side and confirms the order.
 *  The signature is never trusted client-side. */
export async function verifyRazorpayPayment(
  payload: VerifyPaymentPayload,
  idempotencyKey: string = uid(),
): Promise<VerifyPaymentResult> {
  const res = await buyerFetch<ApiResponse<VerifyPaymentResult>>('/payments/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
    idempotencyKey,
  });
  return res.data;
}

/** Reconciles payment status from Razorpay's side when the client-side
 *  verify call itself failed (e.g. app backgrounded) but the payment
 *  actually captured. */
export async function syncRazorpayPayment(
  checkoutId: string,
  idempotencyKey: string = uid(),
): Promise<VerifyPaymentResult> {
  const res = await buyerFetch<ApiResponse<VerifyPaymentResult>>('/payments/razorpay/sync', {
    method: 'POST',
    body: JSON.stringify({ checkoutId }),
    idempotencyKey,
  });
  return res.data;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function listOrders(params?: {
  status?: string;
  statusGroup?: 'active' | 'cancelled' | 'completed';
  page?: number;
  limit?: number;
}): Promise<OrderListResponse> {
  const res = await buyerFetch<ApiResponse<OrderListResponse>>(
    `/buyer/orders${buildQuery(params ?? {})}`,
  );
  return res.data;
}

export async function getOrder(orderId: string): Promise<OrderDetail> {
  const res = await buyerFetch<ApiResponse<OrderDetail>>(`/buyer/orders/${orderId}`);
  return res.data;
}

export async function cancelOrder(orderId: string, reason: string): Promise<OrderDetail> {
  const res = await buyerFetch<ApiResponse<OrderDetail>>(`/buyer/orders/${orderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return res.data;
}

// ─── Notification preferences & inbox ────────────────────────────────────────

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const res = await buyerFetch<ApiResponse<NotificationPreferences>>('/buyer/crm/preferences');
  return res.data;
}

export async function updateNotificationPreferences(
  patch: Partial<Record<string, boolean>>,
): Promise<NotificationPreferences> {
  const res = await buyerFetch<ApiResponse<NotificationPreferences>>('/buyer/crm/preferences', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return res.data;
}

export async function getInbox(page = 1): Promise<InboxPage> {
  const res = await buyerFetch<ApiResponse<InboxPage>>(`/buyer/crm/inbox${buildQuery({ page })}`);
  return res.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await buyerFetch<ApiResponse<unknown>>(`/buyer/crm/inbox/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await buyerFetch<ApiResponse<unknown>>('/buyer/crm/inbox/read-all', { method: 'PATCH' });
}

// ─── Support ─────────────────────────────────────────────────────────────────

export async function getSupportCategories(): Promise<SupportCategory[]> {
  const res = await buyerFetch<ApiResponse<SupportCategory[]>>('/buyer/support/categories');
  return res.data;
}

export async function searchSupportArticles(params?: {
  q?: string;
  category?: string;
}): Promise<SupportArticle[]> {
  const res = await buyerFetch<ApiResponse<SupportArticle[]>>(
    `/buyer/support/articles${buildQuery(params ?? {})}`,
  );
  return res.data;
}

export async function listSupportTickets(params?: {
  page?: number;
  limit?: number;
}): Promise<SupportTicketsPage> {
  const res = await buyerFetch<ApiResponse<SupportTicketsPage>>(
    `/buyer/support/tickets${buildQuery(params ?? {})}`,
  );
  return res.data;
}

export async function getSupportTicket(id: string): Promise<SupportTicketDetail> {
  const res = await buyerFetch<ApiResponse<SupportTicketDetail>>(`/buyer/support/tickets/${id}`);
  return res.data;
}

export async function createSupportTicket(payload: CreateTicketPayload): Promise<SupportTicket> {
  const res = await buyerFetch<ApiResponse<SupportTicket>>('/buyer/support/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function replyToSupportTicket(id: string, body: string): Promise<void> {
  await buyerFetch<ApiResponse<unknown>>(`/buyer/support/tickets/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

// ─── Security ────────────────────────────────────────────────────────────────

/** Revokes every refresh token for this user, signing out all devices
 *  including this one. */
export async function logoutAllDevices(): Promise<void> {
  await buyerFetch<ApiResponse<unknown>>('/auth/logout-all', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// ─── Wallet, rewards & referrals ─────────────────────────────────────────────

export async function getWallet(): Promise<WalletSummary> {
  const res = await buyerFetch<ApiResponse<WalletSummary>>('/buyer/wallet');
  return res.data;
}

export async function getRewards(): Promise<RewardsSummary> {
  const res = await buyerFetch<ApiResponse<RewardsSummary>>('/buyer/rewards');
  return res.data;
}

export async function getReferrals(): Promise<ReferralSummary> {
  const res = await buyerFetch<ApiResponse<ReferralSummary>>('/buyer/referrals');
  return res.data;
}

/** 400s if a code was already applied, the code is unknown, or it is the
 *  buyer's own (which also raises a self-referral fraud flag server-side). */
export async function applyReferralCode(code: string): Promise<void> {
  await buyerFetch<ApiResponse<unknown>>('/buyer/referrals/apply', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

// ─── Addresses ───────────────────────────────────────────────────────────────

export async function listAddresses(): Promise<BuyerAddress[]> {
  const res = await buyerFetch<ApiResponse<BuyerAddress[]>>('/buyer/addresses');
  return res.data;
}

export async function createAddress(payload: UpsertAddressPayload): Promise<BuyerAddress> {
  const res = await buyerFetch<ApiResponse<BuyerAddress>>('/buyer/addresses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateAddress(
  id: string,
  patch: Partial<UpsertAddressPayload>,
): Promise<BuyerAddress> {
  const res = await buyerFetch<ApiResponse<BuyerAddress>>(`/buyer/addresses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return res.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await buyerFetch<ApiResponse<{ deleted: boolean }>>(`/buyer/addresses/${id}`, {
    method: 'DELETE',
  });
}

// ─── Product reviews ─────────────────────────────────────────────────────────

/** The aggregate rating rides along in `meta`, not `data`. */
export async function getProductReviews(
  productId: string,
  params?: { page?: number; limit?: number },
): Promise<ProductReviewsResult> {
  const res = await buyerFetch<{
    success: boolean;
    data: ProductReview[];
    meta?: {
      page: number;
      limit: number;
      total: number;
      aggregate: ProductReviewsResult['aggregate'];
    };
  }>(`/buyer/products/${productId}/reviews${buildQuery(params ?? {})}`);
  return {
    reviews: res.data,
    aggregate: res.meta?.aggregate ?? { ratingAvg: 0, ratingCount: 0 },
    page: res.meta?.page ?? 1,
    limit: res.meta?.limit ?? 20,
    total: res.meta?.total ?? res.data.length,
  };
}

/** Rejected with a 400 unless the buyer has a DELIVERED order containing the
 *  product, and with a 409 if they have already reviewed it. */
export async function createProductReview(
  productId: string,
  payload: CreateProductReviewPayload,
): Promise<ProductReview> {
  const res = await buyerFetch<ApiResponse<ProductReview>>(
    `/buyer/products/${productId}/reviews`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return res.data;
}

// ─── Wishlist ────────────────────────────────────────────────────────────────

export async function getWishlist(): Promise<WishlistItem[]> {
  const res = await buyerFetch<ApiResponse<WishlistItem[]>>('/buyer/wishlist');
  return res.data;
}

export async function addToWishlist(productId: string): Promise<void> {
  await buyerFetch<ApiResponse<unknown>>('/buyer/wishlist', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
}

/** Keyed by productId, not the wishlist row id — see the controller's
 *  `DELETE /buyer/wishlist/:productId`. */
export async function removeFromWishlist(productId: string): Promise<void> {
  await buyerFetch<ApiResponse<unknown>>(`/buyer/wishlist/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
}

// ─── Food: discovery ─────────────────────────────────────────────────────────

export async function listRestaurants(
  params: ListRestaurantsParams = {},
): Promise<RestaurantSummary[]> {
  const res = await buyerFetch<ApiResponse<RestaurantSummary[]>>(
    `/buyer/restaurants${buildQuery(params)}`,
  );
  return res.data;
}

export async function getRestaurant(slug: string): Promise<RestaurantDetail> {
  const res = await buyerFetch<ApiResponse<RestaurantDetail>>(`/buyer/restaurants/${slug}`);
  return res.data;
}

export async function getRestaurantMenu(slug: string): Promise<RestaurantMenu> {
  const res = await buyerFetch<ApiResponse<RestaurantMenu>>(`/buyer/restaurants/${slug}/menu`);
  return res.data;
}

export async function listCuisines(): Promise<Cuisine[]> {
  const res = await buyerFetch<ApiResponse<Cuisine[]>>('/buyer/cuisines');
  return res.data;
}

// ─── Food: cart ──────────────────────────────────────────────────────────────

export async function getFoodCart(): Promise<FoodCart | null> {
  const res = await buyerFetch<ApiResponse<FoodCart | null>>('/buyer/food-cart');
  return res.data;
}

/** Rejects with a `FOOD_CART_STORE_CONFLICT` BuyerApiError when the cart
 *  already holds items from a different restaurant — the food cart is
 *  single-restaurant by design. */
export async function addFoodCartItem(payload: AddFoodCartItemPayload): Promise<FoodCart> {
  const res = await buyerFetch<ApiResponse<FoodCart>>('/buyer/food-cart/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateFoodCartItem(
  itemId: string,
  quantity: number,
): Promise<FoodCart | null> {
  const res = await buyerFetch<ApiResponse<FoodCart | null>>(`/buyer/food-cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
  return res.data;
}

export async function removeFoodCartItem(itemId: string): Promise<FoodCart | null> {
  const res = await buyerFetch<ApiResponse<FoodCart | null>>(`/buyer/food-cart/items/${itemId}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function clearFoodCart(): Promise<void> {
  await buyerFetch<ApiResponse<FoodCart | null>>('/buyer/food-cart', { method: 'DELETE' });
}

export async function reorderFoodFromOrder(
  orderId: string,
): Promise<{ cart: FoodCart | null; added: number; skipped: number }> {
  const res = await buyerFetch<ApiResponse<{ cart: FoodCart | null; added: number; skipped: number }>>(
    `/buyer/food-cart/reorder/${orderId}`,
    { method: 'POST' },
  );
  return res.data;
}

// ─── Food: checkout ──────────────────────────────────────────────────────────

/** Food COD checkout — creates the order immediately. Same idempotency
 *  discipline as grocery checkout so a step-up retry can't double-order. */
export async function foodCheckoutCod(
  payload: InitiateFoodCheckoutPayload,
  idempotencyKey: string = uid(),
): Promise<FoodCodCheckoutResult> {
  const res = await buyerFetch<ApiResponse<FoodCodCheckoutResult>>('/buyer/food-checkout/cod', {
    method: 'POST',
    body: JSON.stringify(payload),
    idempotencyKey,
  });
  return res.data;
}
