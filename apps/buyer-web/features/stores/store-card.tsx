import Link from 'next/link';
import Image from 'next/image';
import { Clock, MapPin, Star, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDistance } from '@/lib/utils';
import type { StoreCard } from '@/types/buyer';

interface StoreCardProps {
  store: StoreCard;
}

export function StoreCardItem({ store }: StoreCardProps) {
  return (
    <Link href={`/stores/${store.slug}`} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
      <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="relative h-32 bg-muted">
          {store.bannerUrl ? (
            <Image
              src={store.bannerUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-3xl font-bold text-primary/30">
              {store.name.charAt(0)}
            </div>
          )}
          <Badge
            variant={store.isOpen ? 'success' : 'warning'}
            className="absolute right-3 top-3"
          >
            {store.isOpen ? 'Open' : 'Closed'}
          </Badge>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold group-hover:text-primary">{store.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{store.address.line1}</span>
              </p>
            </div>
            {store.logoUrl && (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-background">
                <Image src={store.logoUrl} alt="" fill className="object-cover" sizes="40px" />
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
              {store.ratingAvg.toFixed(1)} ({store.ratingCount})
            </span>
            <span>{formatDistance(store.distanceKm)}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden />
              {store.avgPrepTimeMins} min
            </span>
            <span className="inline-flex items-center gap-1">
              <Truck className="h-3 w-3" aria-hidden />
              {store.deliveryFee === 0 ? 'Free delivery' : formatCurrency(store.deliveryFee)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
