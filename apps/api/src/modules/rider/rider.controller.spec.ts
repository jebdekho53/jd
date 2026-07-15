import { RiderController } from './rider.controller';
import { PrismaService } from '../../database/prisma.service';
import { RequestUser } from '../../common/types';

const user: RequestUser = {
  id: 'user-1',
  phone: '+919876543210',
  email: 'rider@example.com',
  roles: ['RIDER'],
  permissions: ['deliveries:read'],
};

describe('RiderController', () => {
  const prisma = {
    riderProfile: {
      findUnique: jest.fn(),
    },
  };

  const controller = new RiderController(
    {} as never,
    {} as never,
    {} as never,
    prisma as unknown as PrismaService,
    {} as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns the real rider profile for /rider/me', async () => {
    prisma.riderProfile.findUnique.mockResolvedValue({
      id: 'rp-1',
      userId: 'user-1',
      name: 'Ramesh Kumar',
      vehicleType: 'MOTORCYCLE',
      vehicleNumber: 'UP14AB1234',
      licenseNumber: 'DL-1',
      kycStatus: 'APPROVED',
      status: 'ONLINE',
      ratingAvg: 4.7,
      ratingCount: 20,
      totalDeliveries: 42,
      currentLat: 28.61,
      currentLng: 77.2,
      lastLocationAt: new Date('2026-07-15T06:00:00.000Z'),
      createdAt: new Date('2026-07-01T06:00:00.000Z'),
      updatedAt: new Date('2026-07-15T06:00:00.000Z'),
    });

    const res = await controller.me(user);

    expect(prisma.riderProfile.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
    expect(res).toMatchObject({
      success: true,
      data: {
        user: { id: 'user-1', phone: '+919876543210', email: 'rider@example.com', roles: ['RIDER'] },
        isRider: true,
        profile: {
          id: 'rp-1',
          name: 'Ramesh Kumar',
          kycStatus: 'APPROVED',
          status: 'ONLINE',
          totalDeliveries: 42,
        },
      },
    });
  });

  it('returns isRider false when the profile is missing', async () => {
    prisma.riderProfile.findUnique.mockResolvedValue(null);

    const res = await controller.me({ ...user, roles: ['BUYER'] });

    expect(res.data.isRider).toBe(false);
    expect(res.data.profile).toBeNull();
  });
});
