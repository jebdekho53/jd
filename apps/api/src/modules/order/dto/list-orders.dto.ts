import { ApiProperty } from '@nestjs/swagger';
import { OmitType } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export class ListOrdersDto {
  @ApiProperty({ required: false, enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ required: false, enum: ['active', 'cancelled', 'completed'] })
  @IsOptional()
  @IsIn(['active', 'cancelled', 'completed'])
  statusGroup?: 'active' | 'cancelled' | 'completed';

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 20;
}

export class ListMerchantOrdersDto extends ListOrdersDto {
  @ApiProperty({ required: false, description: 'Filter by store ID' })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiProperty({
    required: false,
    enum: ['new', 'accepted', 'preparing', 'packing', 'ready_for_pickup', 'rider_assigned', 'delivered', 'cancelled'],
  })
  @IsOptional()
  @IsIn(['new', 'accepted', 'preparing', 'packing', 'ready_for_pickup', 'rider_assigned', 'delivered', 'cancelled'])
  merchantStatusGroup?: 'new' | 'accepted' | 'preparing' | 'packing' | 'ready_for_pickup' | 'rider_assigned' | 'delivered' | 'cancelled';

  @ApiProperty({
    required: false,
    enum: ['NEW', 'ACCEPTED', 'PREPARING', 'PACKING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  })
  @IsOptional()
  @IsIn(['NEW', 'ACCEPTED', 'PREPARING', 'PACKING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'])
  pipelineColumn?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  today?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  yesterday?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({ required: false, enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({ required: false, description: 'Search order #, customer, phone, product, SKU' })
  @IsOptional()
  @IsString()
  q?: string;
}

export class ListAdminOrdersDto extends OmitType(ListOrdersDto, ['statusGroup'] as const) {
  @ApiProperty({ required: false, description: 'Only orders created today (server local time)' })
  @IsOptional()
  @Type(() => Boolean)
  today?: boolean;

  @ApiProperty({
    required: false,
    enum: ['pending', 'preparing', 'ready_for_pickup', 'assigned', 'delivered', 'cancelled'],
  })
  @IsOptional()
  @IsIn(['pending', 'preparing', 'ready_for_pickup', 'assigned', 'delivered', 'cancelled'])
  statusGroup?: 'pending' | 'preparing' | 'ready_for_pickup' | 'assigned' | 'delivered' | 'cancelled';

  @ApiProperty({ required: false, description: 'Filter by store ID' })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiProperty({ required: false, description: 'Filter by merchant profile ID' })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiProperty({ required: false, description: 'Filter by rider profile ID' })
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiProperty({ required: false, description: 'Created on or after (ISO date)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ required: false, description: 'Created on or before (ISO date)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({ required: false, enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({ required: false, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] })
  @IsOptional()
  @IsIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
}
