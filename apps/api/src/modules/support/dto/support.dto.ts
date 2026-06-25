import { IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SupportActorType, SupportMessageVisibility, SupportPriority, SupportTicketStatus } from '@prisma/client';

export class ListTicketsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CreateTicketDto {
  @IsString()
  categoryCode: string;

  @IsString()
  @MinLength(3)
  subject: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsOptional()
  @IsEnum(SupportPriority)
  priority?: SupportPriority;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  walletTransactionId?: string;

  @IsOptional()
  @IsString()
  gstInvoiceId?: string;
}

export class ReplyTicketDto {
  @IsString()
  @MinLength(1)
  body: string;

  @IsOptional()
  @IsEnum(SupportMessageVisibility)
  visibility?: SupportMessageVisibility;
}

export class FeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ResolveTicketDto {
  @IsString()
  summary: string;

  @IsOptional()
  refundApproved?: boolean;
}

export class AdminListTicketsDto extends ListTicketsQueryDto {
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @IsOptional()
  @IsEnum(SupportPriority)
  priority?: SupportPriority;

  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  refundOnly?: boolean;

  @IsOptional()
  @IsEnum(SupportActorType)
  actorType?: SupportActorType;
}

export class KnowledgeSearchDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(SupportActorType)
  audience?: SupportActorType;
}
