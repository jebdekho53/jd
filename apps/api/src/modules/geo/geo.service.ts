import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { slugifyOperationalCity } from './geo.util';

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateOperationalCity(params: {
    name: string;
    state: string;
    latitude: number;
    longitude: number;
  }) {
    const trimmedName = params.name.trim();
    const trimmedState = params.state.trim();
    const baseSlug = slugifyOperationalCity(trimmedName, trimmedState);

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
    if (existing) return existing;

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

  async listZonesByCity(cityId: string) {
    const city = await this.prisma.city.findUnique({ where: { id: cityId } });
    if (!city) throw new NotFoundException(`City not found: ${cityId}`);

    return this.prisma.zone.findMany({
      where: { cityId, isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }
}
