import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReviewStatus } from '@prisma/client';
import { ListStoreReviewsDto } from './store-review.dto';

async function validateListReviews(query: Record<string, unknown>) {
  const dto = plainToInstance(ListStoreReviewsDto, query);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
    stopAtFirstError: false,
  });
  return { dto, errors };
}

describe('ListStoreReviewsDto', () => {
  it('accepts admin review status filters', async () => {
    const { dto, errors } = await validateListReviews({
      status: ReviewStatus.REPORTED,
      limit: '50',
    });

    expect(errors).toHaveLength(0);
    expect(dto.status).toBe(ReviewStatus.REPORTED);
    expect(dto.limit).toBe(50);
  });

  it('rejects invalid review status filters', async () => {
    const { errors } = await validateListReviews({ status: 'FLAGGED' });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'status',
          constraints: expect.objectContaining({ isEnum: expect.any(String) }),
        }),
      ]),
    );
  });

  it('rejects stale search query key', async () => {
    const { errors } = await validateListReviews({ search: 'late' });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'search',
          constraints: expect.objectContaining({ whitelistValidation: expect.any(String) }),
        }),
      ]),
    );
  });
});
