import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { ListMerchantOrdersDto } from './list-orders.dto';

async function validateMerchantOrdersQuery(query: Record<string, unknown>) {
  const dto = plainToInstance(ListMerchantOrdersDto, query);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
    stopAtFirstError: false,
  });

  return { dto, errors };
}

describe('ListMerchantOrdersDto', () => {
  it('accepts a cuid storeId', async () => {
    const { dto, errors } = await validateMerchantOrdersQuery({
      storeId: 'cmqtxuo1k0038l2ha01qry4qj',
      limit: '100',
    });

    expect(errors).toHaveLength(0);
    expect(dto.storeId).toBe('cmqtxuo1k0038l2ha01qry4qj');
  });

  it('accepts merchant order limits used by the web app', async () => {
    const { dto, errors } = await validateMerchantOrdersQuery({ limit: '100' });

    expect(errors).toHaveLength(0);
    expect(dto.limit).toBe(100);
  });

  it('accepts the live orders limit used by the web app', async () => {
    const { dto, errors } = await validateMerchantOrdersQuery({ limit: '200' });

    expect(errors).toHaveLength(0);
    expect(dto.limit).toBe(200);
  });

  it('rejects limits above the merchant order cap', async () => {
    const { errors } = await validateMerchantOrdersQuery({ limit: '201' });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'limit',
          constraints: expect.objectContaining({ max: expect.any(String) }),
        }),
      ]),
    );
  });

  it('rejects invalid status values', async () => {
    const { errors } = await validateMerchantOrdersQuery({ status: 'NOT_REAL' });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'status',
          constraints: expect.objectContaining({ isEnum: expect.any(String) }),
        }),
      ]),
    );
  });

  it('rejects invalid merchant status groups', async () => {
    const { errors } = await validateMerchantOrdersQuery({ merchantStatusGroup: 'stale_group' });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'merchantStatusGroup',
          constraints: expect.objectContaining({ isIn: expect.any(String) }),
        }),
      ]),
    );
  });

  it('accepts the active merchant status group used by live orders', async () => {
    const { dto, errors } = await validateMerchantOrdersQuery({
      merchantStatusGroup: 'active',
      limit: '200',
    });

    expect(errors).toHaveLength(0);
    expect(dto.merchantStatusGroup).toBe('active');
    expect(dto.limit).toBe(200);
  });

  it('rejects invalid storeId formats', async () => {
    const { errors } = await validateMerchantOrdersQuery({ storeId: 'not-a-cuid', limit: '100' });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'storeId',
          constraints: expect.objectContaining({ matches: expect.any(String) }),
        }),
      ]),
    );
  });

  it('accepts requests without storeId', async () => {
    const { dto, errors } = await validateMerchantOrdersQuery({
      status: OrderStatus.PREPARING,
      limit: '100',
    });

    expect(errors).toHaveLength(0);
    expect(dto.storeId).toBeUndefined();
  });
});
