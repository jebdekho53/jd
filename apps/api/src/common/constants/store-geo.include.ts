import { Prisma } from '@prisma/client';

/** Shared Prisma include for store geo + pincode delivery coverage. */
export const STORE_GEO_INCLUDE = {
  city: { select: { id: true, name: true, slug: true } },
  storeServiceAreas: {
    include: {
      serviceArea: {
        select: {
          id: true,
          name: true,
          pincode: true,
          centerLat: true,
          centerLng: true,
          radiusKm: true,
        },
      },
    },
  },
  deliveryAreas: {
    where: { isActive: true },
    select: {
      pincode: true,
      isActive: true,
      deliveryFee: true,
      minimumOrder: true,
      estimatedMinutes: true,
      priority: true,
    },
  },
} satisfies Prisma.StoreInclude;
