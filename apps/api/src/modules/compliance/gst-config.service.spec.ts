import { GstConfigService } from './gst-config.service';

describe('GstConfigService', () => {
  it('searches HSN parent prefixes for full 8 digit codes', async () => {
    const prisma = {
      hSNCode: { findMany: jest.fn() },
    };
    const service = new GstConfigService(prisma as any);

    await service.listHsnCodes('04011000');

    expect(prisma.hSNCode.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { code: { in: ['04011000', '040110', '0401'] } },
          ]),
        }),
      }),
    );
  });
});
