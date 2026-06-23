import { PartialType } from '@nestjs/swagger';
import { CreateStoreDto } from './create-store.dto';

/**
 * All fields optional. For DRAFT/REJECTED stores: all fields editable.
 * For APPROVED stores: only description, phone, email, minOrderAmount,
 * deliveryFee, avgPrepTimeMins, hours, zoneIds, serviceAreaIds are accepted
 * (enforced in StoreService.updateStore).
 */
export class UpdateStoreDto extends PartialType(CreateStoreDto) {}
