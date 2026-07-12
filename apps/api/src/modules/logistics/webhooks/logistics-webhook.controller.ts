import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { ShadowfaxWebhookService } from './shadowfax-webhook.service';
import { BorzoWebhookService } from './borzo-webhook.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class LogisticsWebhookController {
  constructor(
    private readonly shadowfaxWebhook: ShadowfaxWebhookService,
    private readonly borzoWebhook: BorzoWebhookService,
  ) {}

  @Post('shadowfax')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Shadowfax delivery status webhooks' })
  async handleShadowfax(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-shadowfax-signature') signature: string,
    @Headers('x-sfx-signature') altSignature: string,
    @Headers('authorization') authorization: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing request body');
    }
    await this.shadowfaxWebhook.handlePayload(rawBody, signature ?? altSignature, authorization);
    return { success: true };
  }

  @Post('borzo')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Borzo order & delivery status callbacks' })
  async handleBorzo(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-dv-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing request body');
    }
    await this.borzoWebhook.handlePayload(rawBody, signature);
    return { success: true };
  }
}
