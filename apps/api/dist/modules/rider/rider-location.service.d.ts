import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { DeliveryTrackingService } from '../delivery-tracking/delivery-tracking.service';
import { UpdateRiderLocationDto } from './dto/update-rider-location.dto';
export interface CachedLocation {
    riderProfileId: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    recordedAt: string;
}
export declare class RiderLocationService {
    private readonly prisma;
    private readonly redis;
    private readonly events;
    private readonly tracking;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, events: EventEmitter2, tracking: DeliveryTrackingService);
    private cacheKey;
    updateLocation(riderProfileId: string, dto: UpdateRiderLocationDto): Promise<void>;
    getLatestLocation(riderProfileId: string): Promise<CachedLocation | null>;
    pruneOldLocations(): Promise<void>;
}
