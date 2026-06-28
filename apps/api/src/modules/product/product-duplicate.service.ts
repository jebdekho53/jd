import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface StoreProductIndex {
  bySku: Map<string, { id: string; name: string }>;
  byIdentity: Map<string, { id: string; name: string }>;
}

export interface DuplicateMatch {
  type: 'sku' | 'identity';
  existingProductId: string;
  existingProductName: string;
  message: string;
}

@Injectable()
export class ProductDuplicateService {
  constructor(private readonly prisma: PrismaService) {}

  async loadStoreProductIndex(storeId: string): Promise<StoreProductIndex> {
    const products = await this.prisma.product.findMany({
      where: { storeId, deletedAt: null },
      select: { id: true, name: true, brand: true, unit: true, sku: true },
    });

    const bySku = new Map<string, { id: string; name: string }>();
    const byIdentity = new Map<string, { id: string; name: string }>();

    for (const p of products) {
      if (p.sku) {
        bySku.set(p.sku.trim().toLowerCase(), { id: p.id, name: p.name });
      }
      byIdentity.set(this.identityKey(p.name, p.brand, p.unit), {
        id: p.id,
        name: p.name,
      });
    }

    return { bySku, byIdentity };
  }

  checkDuplicate(
    index: StoreProductIndex,
    input: { sku?: string; name: string; brand?: string; unit?: string },
  ): DuplicateMatch | null {
    if (input.sku?.trim()) {
      const hit = index.bySku.get(input.sku.trim().toLowerCase());
      if (hit) {
        return {
          type: 'sku',
          existingProductId: hit.id,
          existingProductName: hit.name,
          message: `Duplicate SKU "${input.sku}" — update existing product "${hit.name}" (${hit.id}) instead`,
        };
      }
    }

    const identityKey = this.identityKey(input.name, input.brand, input.unit);
    const identityHit = index.byIdentity.get(identityKey);
    if (identityHit) {
      return {
        type: 'identity',
        existingProductId: identityHit.id,
        existingProductName: identityHit.name,
        message: `Duplicate product (same name, brand, unit) — update existing product "${identityHit.name}" (${identityHit.id}) instead`,
      };
    }

    return null;
  }

  identityKey(name: string, brand?: string | null, unit?: string | null): string {
    return `${this.norm(name)}::${this.norm(brand ?? '')}::${this.norm(unit ?? 'piece')}`;
  }

  private norm(value: string): string {
    return value.trim().toLowerCase();
  }
}
