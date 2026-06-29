"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyerDiscoverController = exports.BuyerSearchController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const cart_service_1 = require("../cart/cart.service");
const search_discovery_service_1 = require("./search-discovery.service");
const search_analytics_service_1 = require("./search-analytics.service");
const search_discovery_dto_1 = require("./dto/search-discovery.dto");
let BuyerSearchController = class BuyerSearchController {
    constructor(discovery, analytics, cartService) {
        this.discovery = discovery;
        this.analytics = analytics;
        this.cartService = cartService;
    }
    async search(dto) {
        const data = await this.discovery.unifiedSearch(dto);
        return { success: true, data };
    }
    async suggestions(dto) {
        const data = await this.discovery.suggestions(dto);
        return { success: true, data };
    }
    async trending(dto) {
        const data = await this.discovery.trending(dto);
        return { success: true, data };
    }
    trackAnonymousEvent(dto) {
        this.analytics.track({
            eventType: dto.eventType,
            query: dto.query,
            productId: dto.productId,
            storeId: dto.storeId,
            categoryId: dto.categoryId,
            sessionId: dto.sessionId,
        });
        return { success: true };
    }
    async trackBuyerEvent(user, dto) {
        const buyerProfileId = await this.cartService.getBuyerProfileId(user.id);
        this.analytics.track({
            eventType: dto.eventType,
            query: dto.query,
            productId: dto.productId,
            storeId: dto.storeId,
            categoryId: dto.categoryId,
            sessionId: dto.sessionId,
            buyerProfileId,
        });
        return { success: true };
    }
};
exports.BuyerSearchController = BuyerSearchController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Unified hyperlocal search (products, stores, categories, brands)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_discovery_dto_1.BuyerSearchDto]),
    __metadata("design:returntype", Promise)
], BuyerSearchController.prototype, "search", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('suggestions'),
    (0, swagger_1.ApiOperation)({ summary: 'Search autocomplete suggestions' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_discovery_dto_1.SearchSuggestionsDto]),
    __metadata("design:returntype", Promise)
], BuyerSearchController.prototype, "suggestions", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('trending'),
    (0, swagger_1.ApiOperation)({ summary: 'Trending searches (24h / 7d / 30d)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_discovery_dto_1.SearchTrendingDto]),
    __metadata("design:returntype", Promise)
], BuyerSearchController.prototype, "trending", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'Track anonymous search interaction events (session-based)' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_discovery_dto_1.TrackSearchEventDto]),
    __metadata("design:returntype", void 0)
], BuyerSearchController.prototype, "trackAnonymousEvent", null);
__decorate([
    (0, common_1.Post)('events/me'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, swagger_1.ApiOperation)({ summary: 'Track search events for the authenticated buyer' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, search_discovery_dto_1.TrackSearchEventDto]),
    __metadata("design:returntype", Promise)
], BuyerSearchController.prototype, "trackBuyerEvent", null);
exports.BuyerSearchController = BuyerSearchController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.BUYERS),
    (0, common_1.Controller)('buyer/search'),
    __metadata("design:paramtypes", [search_discovery_service_1.SearchDiscoveryService,
        search_analytics_service_1.SearchAnalyticsService,
        cart_service_1.CartService])
], BuyerSearchController);
let BuyerDiscoverController = class BuyerDiscoverController {
    constructor(discovery) {
        this.discovery = discovery;
    }
    async discoverStores(dto) {
        const data = await this.discovery.discoverStores(dto);
        return { success: true, data };
    }
    async discoverHome(dto) {
        const data = await this.discovery.discoverHome({
            lat: dto.lat,
            lng: dto.lng,
        });
        return { success: true, data };
    }
};
exports.BuyerDiscoverController = BuyerDiscoverController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('stores'),
    (0, swagger_1.ApiOperation)({ summary: 'Discover stores with filters (nearest, rated, fast, offers, new)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_discovery_dto_1.DiscoverStoresSearchDto]),
    __metadata("design:returntype", Promise)
], BuyerDiscoverController.prototype, "discoverStores", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('home'),
    (0, swagger_1.ApiOperation)({ summary: 'Homepage discovery sections (trending, nearby, deals, recommended)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_discovery_dto_1.DiscoverHomeDto]),
    __metadata("design:returntype", Promise)
], BuyerDiscoverController.prototype, "discoverHome", null);
exports.BuyerDiscoverController = BuyerDiscoverController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.BUYERS),
    (0, common_1.Controller)('buyer/discover'),
    __metadata("design:paramtypes", [search_discovery_service_1.SearchDiscoveryService])
], BuyerDiscoverController);
//# sourceMappingURL=buyer-search.controller.js.map