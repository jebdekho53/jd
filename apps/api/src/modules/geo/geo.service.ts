import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

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
