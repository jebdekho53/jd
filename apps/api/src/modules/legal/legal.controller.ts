import { Body, Controller, Get, Headers, Ip, Param, ParseEnumPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LegalDocumentCode } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { LegalService } from './legal.service';
import { AcceptLegalDocumentDto } from './dto/accept-legal-document.dto';
import { LegalPortal, REQUIRED_DOCUMENTS } from './legal-documents.registry';

@ApiTags('legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legal: LegalService) {}

  /**
   * Public: every portal renders its agreement from here, and the buyer's
   * /terms page is served from the same words a customer ticks.
   */
  @Public()
  @Get('documents/:code')
  @ApiOperation({ summary: 'Fetch the current version of a legal document' })
  getDocument(@Param('code', new ParseEnumPipe(LegalDocumentCode)) code: LegalDocumentCode) {
    return { success: true, data: this.legal.getDocument(code) };
  }

  @Get('pending')
  @ApiOperation({
    summary: 'Documents the signed-in user must accept for a portal',
    description: 'Empty array means the user is clear to transact.',
  })
  async pending(@CurrentUser() user: RequestUser, @Query('portal') portal: string) {
    const key = (portal ?? 'buyer') as LegalPortal;
    const valid = key in REQUIRED_DOCUMENTS ? key : ('buyer' as LegalPortal);
    return { success: true, data: await this.legal.pendingFor(user.id, valid) };
  }

  @Post('accept')
  @ApiOperation({ summary: 'Record acceptance of a legal document version' })
  async accept(
    @CurrentUser() user: RequestUser,
    @Body() dto: AcceptLegalDocumentDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const data = await this.legal.accept(user.id, dto.code, dto.version, { ip, userAgent });
    return { success: true, data };
  }

  @Get('acceptances')
  @ApiOperation({ summary: 'The signed-in user\'s own acceptance history' })
  async history(@CurrentUser() user: RequestUser) {
    return { success: true, data: await this.legal.historyFor(user.id) };
  }
}
