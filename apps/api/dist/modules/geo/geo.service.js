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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const geo_util_1 = require("./geo.util");
let GeoService = class GeoService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOrCreateOperationalCity(params) {
        const trimmedName = params.name.trim();
        const trimmedState = params.state.trim();
        const baseSlug = (0, geo_util_1.slugifyOperationalCity)(trimmedName, trimmedState);
        const existing = await this.prisma.city.findFirst({
            where: {
                OR: [
                    { slug: baseSlug },
                    {
                        name: { equals: trimmedName, mode: 'insensitive' },
                        state: { equals: trimmedState, mode: 'insensitive' },
                    },
                ],
            },
        });
        if (existing)
            return existing;
        let slug = baseSlug;
        let suffix = 2;
        while (await this.prisma.city.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${suffix}`;
            suffix += 1;
        }
        return this.prisma.city.create({
            data: {
                name: trimmedName,
                slug,
                state: trimmedState,
                country: 'IN',
                latitude: params.latitude,
                longitude: params.longitude,
                isActive: true,
                timezone: 'Asia/Kolkata',
            },
        });
    }
    async listCities() {
        return this.prisma.city.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                state: true,
                country: true,
            },
            orderBy: { name: 'asc' },
        });
    }
    async listZonesByCity(cityId) {
        const city = await this.prisma.city.findUnique({ where: { id: cityId } });
        if (!city)
            throw new common_1.NotFoundException(`City not found: ${cityId}`);
        return this.prisma.zone.findMany({
            where: { cityId, isActive: true },
            select: { id: true, name: true, slug: true },
            orderBy: { name: 'asc' },
        });
    }
};
exports.GeoService = GeoService;
exports.GeoService = GeoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GeoService);
//# sourceMappingURL=geo.service.js.map