import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryRegion, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

function normalizeQuery(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export interface LocationSearchResult {
  id: string;
  label: string;
  slug: string;
  type: 'pincode' | 'area' | 'city' | 'alias';
  pincode?: string;
  postOffice?: string;
  city: string;
  citySlug: string;
  area?: string;
  areaSlug?: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  deliveryRegion: DeliveryRegion;
  locationPincodeId?: string;
  locationAreaId?: string;
  locationCityId?: string;
}

const PINCODE_INCLUDE = {
  state: { select: { id: true, name: true, code: true } },
  district: { select: { id: true, name: true, slug: true } },
  city: { select: { id: true, name: true, slug: true } },
  area: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.LocationPincodeInclude;

export interface ResolvedPincodeLocation {
  inMasterDirectory: boolean;
  pincode: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  locality?: string;
  locationPincodeId?: string;
  locationAreaId?: string;
  locationCityId?: string;
  operationalCityId?: string;
}

@Injectable()
export class LocationDirectoryService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: {
    q: string;
    cityId?: string;
    districtId?: string;
    pincode?: string;
    limit?: number;
  }): Promise<LocationSearchResult[]> {
    const q = params.q?.trim() ?? '';
    const limit = Math.min(params.limit ?? 20, 50);
    if (q.length < 2 && !params.pincode) {
      return [];
    }

    const normalized = normalizeQuery(q);
    const results: LocationSearchResult[] = [];
    const seen = new Set<string>();

    const push = (row: LocationSearchResult) => {
      const key = `${row.type}:${row.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      results.push(row);
    };

    if (/^\d{6}$/.test(q) || params.pincode) {
      const pin = params.pincode ?? q;
      const pincodes = await this.prisma.locationPincode.findMany({
        where: {
          pincode: { startsWith: pin },
          isActive: true,
          ...(params.cityId && { cityId: params.cityId }),
          ...(params.districtId && { districtId: params.districtId }),
        },
        include: PINCODE_INCLUDE,
        take: limit,
      });
      for (const p of pincodes) {
        push(this.serializePincode(p));
      }
    }

    if (normalized.length >= 2) {
      const aliases = await this.prisma.locationAlias.findMany({
        where: {
          isActive: true,
          normalized: { contains: normalized },
          ...(params.cityId && { cityId: params.cityId }),
          ...(params.districtId && { districtId: params.districtId }),
        },
        include: {
          pincode: { include: PINCODE_INCLUDE },
          area: {
            include: {
              city: {
                include: {
                  state: true,
                  district: true,
                },
              },
              pincodes: { where: { isActive: true }, take: 1, include: PINCODE_INCLUDE },
            },
          },
          city: { include: { state: true, district: true, pincodes: { where: { isActive: true }, take: 1, include: PINCODE_INCLUDE } } },
        },
        take: limit,
      });

      for (const a of aliases) {
        if (a.pincode) {
          push({ ...this.serializePincode(a.pincode), type: 'alias', label: a.alias, slug: a.slug });
        } else if (a.area) {
          const pin = a.area.pincodes[0];
          if (pin) {
            push({
              ...this.serializePincode(pin),
              type: 'alias',
              label: a.alias,
              slug: a.slug,
            });
          }
        } else if (a.city) {
          const pin = a.city.pincodes[0];
          if (pin) {
            push({
              ...this.serializePincode(pin),
              type: 'alias',
              label: a.alias,
              slug: a.slug,
            });
          }
        }
      }

      const areas = await this.prisma.locationArea.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: 'insensitive' },
          ...(params.cityId && { cityId: params.cityId }),
        },
        include: {
          city: { include: { state: true, district: true } },
          pincodes: { where: { isActive: true }, take: 1, include: PINCODE_INCLUDE },
        },
        take: limit,
      });
      for (const area of areas) {
        const pin = area.pincodes[0];
        if (!pin) continue;
        push({
          ...this.serializePincode(pin),
          type: 'area',
          label: `${area.name}, ${area.city.name}`,
          slug: area.slug,
        });
      }

      const postOffices = await this.prisma.locationPincode.findMany({
        where: {
          isActive: true,
          OR: [
            { postOffice: { contains: q, mode: 'insensitive' } },
            { city: { name: { contains: q, mode: 'insensitive' } } },
          ],
          ...(params.cityId && { cityId: params.cityId }),
          ...(params.districtId && { districtId: params.districtId }),
        },
        include: PINCODE_INCLUDE,
        take: limit,
      });
      for (const pin of postOffices) {
        push(this.serializePincode(pin));
      }
    }

    return results.slice(0, limit);
  }

  /** Resolve pincode against master directory without throwing for unknown pincodes. */
  async tryResolvePincode(params: {
    pincode: string;
    locationCityId?: string;
    locationAreaId?: string;
  }): Promise<ResolvedPincodeLocation> {
    if (!/^\d{6}$/.test(params.pincode)) {
      throw new BadRequestException('Invalid pincode format');
    }

    const rows = await this.prisma.locationPincode.findMany({
      where: { pincode: params.pincode, isActive: true },
      include: PINCODE_INCLUDE,
    });

    if (!rows.length) {
      return {
        inMasterDirectory: false,
        pincode: params.pincode,
        latitude: 0,
        longitude: 0,
        city: '',
        state: '',
      };
    }

    if (params.locationCityId && !rows.some((r) => r.cityId === params.locationCityId)) {
      throw new BadRequestException('Pincode does not belong to selected city');
    }
    if (params.locationAreaId && !rows.some((r) => r.areaId === params.locationAreaId)) {
      throw new BadRequestException('Pincode does not belong to selected area');
    }

    const row = rows[0];
    const serialized = this.serializePincode(row);
    const locationCity = await this.prisma.locationCity.findUnique({
      where: { id: row.cityId },
      select: { operationalCityId: true },
    });

    return {
      inMasterDirectory: true,
      pincode: row.pincode,
      latitude: row.latitude,
      longitude: row.longitude,
      city: serialized.city,
      state: serialized.state,
      locality: serialized.area ?? serialized.postOffice ?? serialized.city,
      locationPincodeId: row.id,
      locationAreaId: row.areaId ?? undefined,
      locationCityId: row.cityId,
      operationalCityId: locationCity?.operationalCityId ?? undefined,
    };
  }

  async getByPincode(pincode: string) {
    if (!/^\d{6}$/.test(pincode)) {
      throw new BadRequestException('Invalid pincode format');
    }
    const rows = await this.prisma.locationPincode.findMany({
      where: { pincode, isActive: true },
      include: PINCODE_INCLUDE,
      orderBy: { postOffice: 'asc' },
    });
    if (!rows.length) throw new NotFoundException(`Pincode ${pincode} not found in directory`);
    return rows.map((p) => this.serializePincode(p));
  }

  async getBySlug(slug: string) {
    const alias = await this.prisma.locationAlias.findFirst({
      where: { slug, isActive: true },
      include: {
        pincode: { include: PINCODE_INCLUDE },
        area: {
          include: {
            city: { include: { state: true, district: true } },
            pincodes: { where: { isActive: true }, take: 1, include: PINCODE_INCLUDE },
          },
        },
        city: {
          include: {
            state: true,
            district: true,
            pincodes: { where: { isActive: true }, take: 1, include: PINCODE_INCLUDE },
          },
        },
      },
    });
    if (alias?.pincode) return this.serializePincode(alias.pincode);
    if (alias?.area?.pincodes[0]) return this.serializePincode(alias.area.pincodes[0]);

    const city = await this.prisma.locationCity.findFirst({
      where: { slug, isActive: true },
      include: {
        state: true,
        district: true,
        pincodes: { where: { isActive: true }, take: 1, include: PINCODE_INCLUDE },
      },
    });
    if (city?.pincodes[0]) return this.serializePincode(city.pincodes[0]);

    const area = await this.prisma.locationArea.findFirst({
      where: { slug, isActive: true },
      include: {
        city: { include: { state: true, district: true } },
        pincodes: { where: { isActive: true }, take: 1, include: PINCODE_INCLUDE },
      },
    });
    if (area?.pincodes[0]) return this.serializePincode(area.pincodes[0]);

    throw new NotFoundException(`Location slug not found: ${slug}`);
  }

  async validatePincode(params: {
    pincode: string;
    locationCityId?: string;
    locationAreaId?: string;
  }) {
    if (!/^\d{6}$/.test(params.pincode)) {
      throw new BadRequestException('Invalid pincode format');
    }
    const rows = await this.prisma.locationPincode.findMany({
      where: { pincode: params.pincode, isActive: true },
      include: PINCODE_INCLUDE,
    });
    if (!rows.length) {
      throw new BadRequestException(`Pincode ${params.pincode} is not serviceable`);
    }
    if (params.locationCityId && !rows.some((r) => r.cityId === params.locationCityId)) {
      throw new BadRequestException('Pincode does not belong to selected city');
    }
    if (params.locationAreaId && !rows.some((r) => r.areaId === params.locationAreaId)) {
      throw new BadRequestException('Pincode does not belong to selected area');
    }
    return this.serializePincode(rows[0]);
  }

  async listFilters() {
    const [states, districts, cities] = await Promise.all([
      this.prisma.locationState.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true, slug: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.locationDistrict.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, stateId: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.locationCity.findMany({
        where: { isActive: true, deliveryRegion: DeliveryRegion.DELHI_NCR },
        select: { id: true, name: true, slug: true, districtId: true, stateId: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    return { states, districts, cities };
  }

  async adminList(params: {
    q?: string;
    cityId?: string;
    districtId?: string;
    pincode?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 50, 200);
    const skip = (page - 1) * limit;

    const where: Prisma.LocationPincodeWhereInput = {
      ...(params.cityId && { cityId: params.cityId }),
      ...(params.districtId && { districtId: params.districtId }),
      ...(params.pincode && { pincode: { startsWith: params.pincode } }),
      ...(params.q && {
        OR: [
          { pincode: { contains: params.q } },
          { postOffice: { contains: params.q, mode: 'insensitive' } },
          { city: { name: { contains: params.q, mode: 'insensitive' } } },
          { area: { name: { contains: params.q, mode: 'insensitive' } } },
        ],
      }),
    };

    const [total, rows] = await Promise.all([
      this.prisma.locationPincode.count({ where }),
      this.prisma.locationPincode.findMany({
        where,
        include: PINCODE_INCLUDE,
        orderBy: [{ pincode: 'asc' }, { postOffice: 'asc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      items: rows.map((p) => ({
        ...this.serializePincode(p),
        isActive: p.isActive,
      })),
    };
  }

  async adminStats() {
    const [
      states,
      districts,
      cities,
      areas,
      pincodes,
      aliases,
      activePincodes,
      citiesByRegion,
    ] = await Promise.all([
      this.prisma.locationState.count(),
      this.prisma.locationDistrict.count(),
      this.prisma.locationCity.count(),
      this.prisma.locationArea.count(),
      this.prisma.locationPincode.count(),
      this.prisma.locationAlias.count(),
      this.prisma.locationPincode.count({ where: { isActive: true } }),
      this.prisma.locationCity.groupBy({
        by: ['deliveryRegion'],
        _count: { _all: true },
        where: { isActive: true },
      }),
    ]);

    const cityBreakdown = await this.prisma.locationCity.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { areas: true, pincodes: true } },
      },
      orderBy: { name: 'asc' },
    });

    return {
      totals: { states, districts, cities, areas, pincodes, aliases, activePincodes },
      regions: citiesByRegion,
      cityBreakdown,
    };
  }

  async setPincodeActive(id: string, isActive: boolean) {
    const row = await this.prisma.locationPincode.update({
      where: { id },
      data: { isActive },
      include: PINCODE_INCLUDE,
    });
    return this.serializePincode(row);
  }

  async exportCsv(): Promise<string> {
    const rows = await this.prisma.locationPincode.findMany({
      include: PINCODE_INCLUDE,
      orderBy: [{ pincode: 'asc' }, { postOffice: 'asc' }],
    });
    const header =
      'pincode,post_office,state,district,city,area,sub_area,latitude,longitude,delivery_region,is_active';
    const lines = rows.map((p) =>
      [
        p.pincode,
        csvEscape(p.postOffice ?? ''),
        csvEscape(p.state.name),
        csvEscape(p.district.name),
        csvEscape(p.city.name),
        csvEscape(p.area?.name ?? ''),
        csvEscape(p.subArea ?? ''),
        p.latitude,
        p.longitude,
        p.deliveryRegion,
        p.isActive,
      ].join(','),
    );
    return [header, ...lines].join('\n');
  }

  async importCsv(csv: string) {
    const lines = csv.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new BadRequestException('CSV must include header and rows');
    const header = lines[0].split(',').map((h) => h.trim());
    const idx = (name: string) => header.indexOf(name);
    let imported = 0;
    for (const line of lines.slice(1)) {
      const cols = parseCsvLine(line);
      const pincode = cols[idx('pincode')];
      const postOffice = cols[idx('post_office')];
      if (!pincode || !postOffice) continue;
      const cityName = cols[idx('city')];
      const city = await this.prisma.locationCity.findFirst({
        where: { name: { equals: cityName, mode: 'insensitive' } },
      });
      if (!city) continue;
      const areaName = cols[idx('area')];
      let areaId: string | undefined;
      if (areaName) {
        const area = await this.prisma.locationArea.findFirst({
          where: { cityId: city.id, name: { equals: areaName, mode: 'insensitive' } },
        });
        areaId = area?.id;
      }
      await this.prisma.locationPincode.upsert({
        where: { pincode_postOffice: { pincode, postOffice } },
        update: {
          latitude: Number(cols[idx('latitude')]),
          longitude: Number(cols[idx('longitude')]),
          isActive: cols[idx('is_active')] !== 'false',
          areaId,
        },
        create: {
          pincode,
          postOffice,
          stateId: city.stateId,
          districtId: city.districtId,
          cityId: city.id,
          areaId,
          subArea: cols[idx('sub_area')] || undefined,
          latitude: Number(cols[idx('latitude')]),
          longitude: Number(cols[idx('longitude')]),
          deliveryRegion: DeliveryRegion.DELHI_NCR,
          isActive: cols[idx('is_active')] !== 'false',
        },
      });
      imported += 1;
    }
    return { imported };
  }

  private serializePincode(
    p: Prisma.LocationPincodeGetPayload<{ include: typeof PINCODE_INCLUDE }>,
  ): LocationSearchResult {
    const label = p.area
      ? `${p.area.name}, ${p.city.name} — ${p.pincode}`
      : `${p.postOffice ?? p.city.name} — ${p.pincode}`;
    return {
      id: p.id,
      label,
      slug: p.area?.slug ?? p.city.slug,
      type: 'pincode',
      pincode: p.pincode,
      postOffice: p.postOffice ?? undefined,
      city: p.city.name,
      citySlug: p.city.slug,
      area: p.area?.name,
      areaSlug: p.area?.slug,
      district: p.district.name,
      state: p.state.name,
      latitude: p.latitude,
      longitude: p.longitude,
      deliveryRegion: p.deliveryRegion,
      locationPincodeId: p.id,
      locationAreaId: p.areaId ?? undefined,
      locationCityId: p.cityId,
    };
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
