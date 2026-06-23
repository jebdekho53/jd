import Image from 'next/image';
import { Leaf } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { BuyerProduct, BuyerProductWithStore } from '@/types/buyer';

type ProductItem = BuyerProduct | BuyerProductWithStore;

interface ProductCardProps {
  product: ProductItem;
  showStore?: boolean;
}

function getDisplayPrice(product: ProductItem): { price: number; mrp: number | null } {
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  if (defaultVariant) {
    return { price: defaultVariant.price, mrp: defaultVariant.mrp };
  }
  return { price: product.basePrice, mrp: product.mrp };
}

export function ProductCard({ product, showStore = false }: ProductCardProps) {
  const { price, mrp } = getDisplayPrice(product);
  const hasDiscount = mrp !== null && mrp > price;
  const store = 'store' in product ? product.store : null;

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square bg-muted">
        {product.imageUrls[0] ? (
          <Image
            src={product.imageUrls[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-muted-foreground/30">
            {product.name.charAt(0)}
          </div>
        )}
        {product.isVeg && (
          <Badge variant="success" className="absolute left-2 top-2 gap-1">
            <Leaf className="h-3 w-3" aria-hidden />
            Veg
          </Badge>
        )}
      </div>
      <CardContent className="p-3">
        {showStore && store && (
          <p className="mb-1 truncate text-xs text-muted-foreground">{store.name}</p>
        )}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</h3>
        {product.brand && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{product.brand}</p>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-semibold">{formatCurrency(price)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">{formatCurrency(mrp!)}</span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">per {product.unit}</p>
      </CardContent>
    </Card>
  );
}
