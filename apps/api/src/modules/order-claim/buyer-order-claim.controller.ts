import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types/index';
import { OrderClaimService } from './order-claim.service';
import { CreateOrderClaimDto } from './dto/order-claim.dto';

@ApiTags('buyer / order claims')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@Controller('buyer/orders')
export class BuyerOrderClaimController {
  constructor(private readonly claims: OrderClaimService) {}

  @Get(':orderId/claims/eligibility')
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Return / refund / replacement eligibility for an order' })
  async getEligibility(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
  ) {
    const data = await this.claims.getOrderEligibility(user.id, orderId);
    return { success: true, data };
  }

  @Post(':orderId/claims')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'Submit a return, refund, or replacement claim' })
  async createClaim(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body() dto: CreateOrderClaimDto,
  ) {
    const data = await this.claims.createBuyerClaim(user.id, orderId, dto);
    return { success: true, data };
  }

  @Get(':orderId/claims')
  @ApiParam({ name: 'orderId' })
  @ApiOperation({ summary: 'List claims for an order' })
  async listClaims(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
  ) {
    const data = await this.claims.listBuyerClaims(user.id, orderId);
    return { success: true, data };
  }
}
