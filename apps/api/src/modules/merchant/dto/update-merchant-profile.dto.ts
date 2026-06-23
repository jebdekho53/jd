import { PartialType } from '@nestjs/swagger';
import { CreateMerchantProfileDto } from './create-merchant-profile.dto';

export class UpdateMerchantProfileDto extends PartialType(CreateMerchantProfileDto) {}
