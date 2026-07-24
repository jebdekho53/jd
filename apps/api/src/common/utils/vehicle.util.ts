import { VehicleType } from '@prisma/client';

/** Bicycle and on-foot partners legally need no driving licence in India;
 *  every motorised vehicle (motorcycle, scooter, car) does. */
const NO_LICENSE_REQUIRED = new Set<VehicleType>([VehicleType.BICYCLE, VehicleType.WALK]);

export function requiresDrivingLicense(vehicleType: VehicleType): boolean {
  return !NO_LICENSE_REQUIRED.has(vehicleType);
}
