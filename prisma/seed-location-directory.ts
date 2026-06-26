/**
 * Seeds Master Location Directory for Delhi NCR.
 * Run: pnpm db:seed:locations
 */
import { DeliveryRegion, PrismaClient } from '@prisma/client';
import {
  DIRECTORY_CITIES,
  DIRECTORY_DISTRICTS,
  DIRECTORY_STATES,
} from './data/location-directory/delhi-ncr';
import { aliasVariants, normalizeLocationText, slugify } from './data/location-directory/utils';

const prisma = new PrismaClient();

type IdMap = Map<string, string>;

async function seedStates(): Promise<IdMap> {
  const map = new Map<string, string>();
  for (const s of DIRECTORY_STATES) {
    if (!prisma.locationState) {
      throw new Error(
        'Prisma client is missing LocationState. Run: pnpm db:generate && pnpm db:migrate:prod',
      );
    }
    const row = await prisma.locationState.upsert({
      where: { code: s.code },
      update: { name: s.name, slug: slugify(s.name), isActive: true },
      create: {
        code: s.code,
        name: s.name,
        slug: slugify(s.name),
        countryCode: 'IN',
        isActive: true,
      },
    });
    map.set(s.code, row.id);
  }
  return map;
}

async function seedDistricts(stateIds: IdMap): Promise<IdMap> {
  const map = new Map<string, string>();
  for (const d of DIRECTORY_DISTRICTS) {
    const stateId = stateIds.get(d.stateCode);
    if (!stateId) continue;
    const row = await prisma.locationDistrict.upsert({
      where: { stateId_slug: { stateId, slug: d.slug } },
      update: { name: d.name, isActive: true },
      create: { stateId, name: d.name, slug: d.slug, isActive: true },
    });
    map.set(d.slug, row.id);
  }
  return map;
}

async function resolveOperationalCityId(slug?: string): Promise<string | null> {
  if (!slug) return null;
  const city = await prisma.city.findUnique({ where: { slug } });
  return city?.id ?? null;
}

async function seedCities(
  stateIds: IdMap,
  districtIds: IdMap,
): Promise<{ cityIds: IdMap; areaIds: IdMap; pincodeIds: IdMap }> {
  const cityIds = new Map<string, string>();
  const areaIds = new Map<string, string>();
  const pincodeIds = new Map<string, string>();

  for (const c of DIRECTORY_CITIES) {
    const stateId = stateIds.get(c.stateCode);
    const districtId = districtIds.get(c.districtSlug);
    if (!stateId || !districtId) {
      console.warn(`  Skip city ${c.name}: missing state/district`);
      continue;
    }

    const operationalCityId =
      c.operationalCitySlug != null
        ? await resolveOperationalCityId(c.operationalCitySlug)
        : await resolveOperationalCityId('delhi-ncr');

    const cityRow = await prisma.locationCity.upsert({
      where: { districtId_slug: { districtId, slug: c.slug } },
      update: {
        name: c.name,
        stateId,
        deliveryRegion: DeliveryRegion.DELHI_NCR,
        latitude: c.lat,
        longitude: c.lng,
        operationalCityId,
        isActive: true,
      },
      create: {
        stateId,
        districtId,
        name: c.name,
        slug: c.slug,
        deliveryRegion: DeliveryRegion.DELHI_NCR,
        latitude: c.lat,
        longitude: c.lng,
        operationalCityId,
        isActive: true,
      },
    });
    cityIds.set(c.slug, cityRow.id);

    for (const area of c.areas) {
      const areaSlug = area.slug ?? slugify(area.name);
      const areaKey = `${c.slug}:${areaSlug}`;
      const areaRow = await prisma.locationArea.upsert({
        where: { cityId_slug: { cityId: cityRow.id, slug: areaSlug } },
        update: {
          name: area.name,
          subArea: area.subArea,
          latitude: area.lat ?? c.lat,
          longitude: area.lng ?? c.lng,
          isActive: true,
        },
        create: {
          cityId: cityRow.id,
          name: area.name,
          slug: areaSlug,
          subArea: area.subArea,
          latitude: area.lat ?? c.lat,
          longitude: area.lng ?? c.lng,
          isActive: true,
        },
      });
      areaIds.set(areaKey, areaRow.id);

      for (const p of area.pincodes) {
        const pinKey = `${p.pincode}:${p.postOffice}`;
        const pinRow = await prisma.locationPincode.upsert({
          where: {
            pincode_postOffice: { pincode: p.pincode, postOffice: p.postOffice },
          },
          update: {
            stateId,
            districtId,
            cityId: cityRow.id,
            areaId: areaRow.id,
            subArea: p.subArea ?? area.subArea,
            latitude: p.lat,
            longitude: p.lng,
            deliveryRegion: DeliveryRegion.DELHI_NCR,
            isActive: true,
          },
          create: {
            pincode: p.pincode,
            postOffice: p.postOffice,
            stateId,
            districtId,
            cityId: cityRow.id,
            areaId: areaRow.id,
            subArea: p.subArea ?? area.subArea,
            latitude: p.lat,
            longitude: p.lng,
            deliveryRegion: DeliveryRegion.DELHI_NCR,
            isActive: true,
          },
        });
        pincodeIds.set(pinKey, pinRow.id);
      }
    }
  }

  return { cityIds, areaIds, pincodeIds };
}

async function seedAliases(
  stateIds: IdMap,
  districtIds: IdMap,
  cityIds: IdMap,
  areaIds: IdMap,
  pincodeIds: IdMap,
): Promise<void> {
  const aliasRows: {
    alias: string;
    slug: string;
    normalized: string;
    stateId?: string;
    districtId?: string;
    cityId?: string;
    areaId?: string;
    pincodeId?: string;
  }[] = [];

  const seen = new Set<string>();

  const pushAlias = (params: {
    label: string;
    stateCode?: string;
    districtSlug?: string;
    citySlug?: string;
    areaKey?: string;
    pinKey?: string;
  }) => {
    for (const variant of aliasVariants(params.label)) {
      const slug = slugify(variant);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      aliasRows.push({
        alias: variant,
        slug,
        normalized: normalizeLocationText(variant),
        stateId: params.stateCode ? stateIds.get(params.stateCode) : undefined,
        districtId: params.districtSlug ? districtIds.get(params.districtSlug) : undefined,
        cityId: params.citySlug ? cityIds.get(params.citySlug) : undefined,
        areaId: params.areaKey ? areaIds.get(params.areaKey) : undefined,
        pincodeId: params.pinKey ? pincodeIds.get(params.pinKey) : undefined,
      });
    }
  };

  for (const s of DIRECTORY_STATES) {
    pushAlias({ label: s.name, stateCode: s.code });
  }
  for (const d of DIRECTORY_DISTRICTS) {
    pushAlias({ label: d.name, stateCode: d.stateCode, districtSlug: d.slug });
  }
  for (const c of DIRECTORY_CITIES) {
    pushAlias({ label: c.name, stateCode: c.stateCode, districtSlug: c.districtSlug, citySlug: c.slug });
    if (c.aliases) {
      for (const a of c.aliases) {
        pushAlias({ label: a, stateCode: c.stateCode, districtSlug: c.districtSlug, citySlug: c.slug });
      }
    }
    for (const area of c.areas) {
      const areaSlug = area.slug ?? slugify(area.name);
      const areaKey = `${c.slug}:${areaSlug}`;
      pushAlias({
        label: area.name,
        stateCode: c.stateCode,
        districtSlug: c.districtSlug,
        citySlug: c.slug,
        areaKey,
      });
      if (area.aliases) {
        for (const a of area.aliases) {
          pushAlias({
            label: a,
            stateCode: c.stateCode,
            districtSlug: c.districtSlug,
            citySlug: c.slug,
            areaKey,
          });
        }
      }
      for (const p of area.pincodes) {
        const pinKey = `${p.pincode}:${p.postOffice}`;
        pushAlias({
          label: p.postOffice,
          stateCode: c.stateCode,
          districtSlug: c.districtSlug,
          citySlug: c.slug,
          areaKey,
          pinKey,
        });
        pushAlias({
          label: p.pincode,
          stateCode: c.stateCode,
          districtSlug: c.districtSlug,
          citySlug: c.slug,
          areaKey,
          pinKey,
        });
      }
    }
  }

  for (const row of aliasRows) {
    await prisma.locationAlias.upsert({
      where: { slug: row.slug },
      update: {
        alias: row.alias,
        normalized: row.normalized,
        stateId: row.stateId,
        districtId: row.districtId,
        cityId: row.cityId,
        areaId: row.areaId,
        pincodeId: row.pincodeId,
        isActive: true,
      },
      create: {
        alias: row.alias,
        slug: row.slug,
        normalized: row.normalized,
        stateId: row.stateId,
        districtId: row.districtId,
        cityId: row.cityId,
        areaId: row.areaId,
        pincodeId: row.pincodeId,
        isActive: true,
      },
    });
  }
}

export async function seedLocationDirectory(): Promise<void> {
  console.log('  Seeding Master Location Directory (Delhi NCR)...');
  const stateIds = await seedStates();
  const districtIds = await seedDistricts(stateIds);
  const { cityIds, areaIds, pincodeIds } = await seedCities(stateIds, districtIds);
  await seedAliases(stateIds, districtIds, cityIds, areaIds, pincodeIds);

  const [states, districts, cities, areas, pincodes, aliases] = await Promise.all([
    prisma.locationState.count(),
    prisma.locationDistrict.count(),
    prisma.locationCity.count(),
    prisma.locationArea.count(),
    prisma.locationPincode.count(),
    prisma.locationAlias.count(),
  ]);

  console.log(
    `  MLD seeded: ${states} states, ${districts} districts, ${cities} cities, ${areas} areas, ${pincodes} pincodes, ${aliases} aliases`,
  );

  await linkServiceAreasToMld();
}

async function linkServiceAreasToMld(): Promise<void> {
  const serviceAreas = await prisma.serviceArea.findMany({
    where: { locationAreaId: null },
    select: { id: true, slug: true, name: true, pincode: true },
  });

  let linked = 0;
  for (const sa of serviceAreas) {
    let area = await prisma.locationArea.findFirst({
      where: { slug: sa.slug, isActive: true },
    });

    if (!area && sa.pincode) {
      const pin = await prisma.locationPincode.findFirst({
        where: { pincode: sa.pincode, isActive: true },
        select: { areaId: true },
      });
      if (pin?.areaId) {
        area = await prisma.locationArea.findFirst({ where: { id: pin.areaId } });
      }
    }

    if (!area) {
      area = await prisma.locationArea.findFirst({
        where: { name: { equals: sa.name, mode: 'insensitive' }, isActive: true },
      });
    }

    if (!area) continue;

    await prisma.serviceArea.update({
      where: { id: sa.id },
      data: { locationAreaId: area.id },
    });
    linked++;
  }

  console.log(`  Linked ${linked} service areas to master location areas`);
}

async function main(): Promise<void> {
  await seedLocationDirectory();
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
