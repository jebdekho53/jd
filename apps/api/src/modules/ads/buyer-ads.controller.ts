import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { AdServingService } from './ad-serving.service';

class AdClickDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  campaignId!: string;
}

@ApiTags(Tags.BUYERS)
@Controller('buyer/ads')
export class BuyerAdsController {
  constructor(private readonly adServing: AdServingService) {}

  @Public()
  @Get('sponsored')
  @ApiOperation({ summary: 'Sponsored products for the home rail (records HOME impressions)' })
  async sponsored() {
    const products = await this.adServing.serveHomeSponsoredProducts(6);
    return { success: true, data: { products } };
  }

  @Public()
  @Post('click')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a click on a sponsored (paid) placement' })
  async click(@Body() dto: AdClickDto) {
    await this.adServing.recordClick(dto.campaignId);
    return { success: true };
  }
}
