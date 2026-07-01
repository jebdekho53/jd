import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductDto } from './update-product.dto';
import { ConfirmAiProductDto } from './product-ai.dto';

describe('product HSN DTO validation', () => {
  it('rejects product create without hsnCodeId', async () => {
    const dto = plainToInstance(CreateProductDto, {
      name: 'Amul Milk',
      imageUrls: ['https://cdn.example.com/milk.jpg'],
      basePrice: 49,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'hsnCodeId')).toBe(true);
  });

  it('rejects product update when hsnCodeId is explicitly empty', async () => {
    const dto = plainToInstance(UpdateProductDto, {
      hsnCodeId: '',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'hsnCodeId')).toBe(true);
  });

  it('rejects product update when hsnCodeId is explicitly null', async () => {
    const dto = plainToInstance(UpdateProductDto, {
      hsnCodeId: null,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'hsnCodeId')).toBe(true);
  });

  it('rejects AI product confirmation without hsnCodeId', async () => {
    const dto = plainToInstance(ConfirmAiProductDto, {
      name: 'AI Product',
      basePrice: 49,
      publish: false,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'hsnCodeId')).toBe(true);
  });
});
