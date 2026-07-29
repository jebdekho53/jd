import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LegalDocumentCode } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { LegalAcceptanceGuard } from '../legal/legal-acceptance.guard';
import { RequireLegalAcceptance } from '../legal/require-legal-acceptance.decorator';
import { FoodCheckoutService } from './food-checkout.service';
import { InitiateFoodCheckoutDto } from './dto/initiate-food-checkout.dto';

@ApiTags('food / checkout')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, LegalAcceptanceGuard)
@Roles('BUYER')
@Controller('buyer/food-checkout')
export class FoodCheckoutController {
  constructor(private readonly checkout: FoodCheckoutService) {}

  @Post()
  @RequireLegalAcceptance(LegalDocumentCode.BUYER_TERMS)
  @ApiOperation({ summary: 'Initiate food checkout (independent from grocery)' })
  async initiate(
    @CurrentUser() user: RequestUser,
    @Body() dto: InitiateFoodCheckoutDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const data = await this.checkout.initiateCheckout(user.id, dto, idempotencyKey);
    return { success: true, data };
  }

  @Post('cod')
  @RequireLegalAcceptance(LegalDocumentCode.BUYER_TERMS)
  @ApiOperation({ summary: 'Food COD checkout — creates order immediately' })
  async cod(
    @CurrentUser() user: RequestUser,
    @Body() dto: InitiateFoodCheckoutDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const data = await this.checkout.initiateCheckout(
      user.id,
      { ...dto, paymentMethod: 'COD' as InitiateFoodCheckoutDto['paymentMethod'] },
      idempotencyKey,
    );
    return { success: true, data };
  }

  @Get(':checkoutId')
  async status(@CurrentUser() user: RequestUser, @Param('checkoutId') checkoutId: string) {
    const data = await this.checkout.getCheckoutStatus(checkoutId, user.id);
    return { success: true, data };
  }
}
