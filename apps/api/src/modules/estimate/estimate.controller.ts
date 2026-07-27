import { Body, Controller, Get, Header, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { EstimateService } from './estimate.service';
import {
  CreateEstimateDto,
  ListEstimatesQueryDto,
  UpdateEstimateDto,
  UpdateEstimateStatusDto,
} from './dto/estimate.dto';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
@Controller('merchant/estimates')
export class EstimateController {
  constructor(private readonly estimates: EstimateService) {}

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateEstimateDto) {
    return { success: true, data: await this.estimates.create(user.id, dto) };
  }

  @Get()
  async list(@CurrentUser() user: RequestUser, @Query() query: ListEstimatesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return { success: true, data: await this.estimates.list(user.id, page, limit, query.status) };
  }

  @Get(':id')
  async getById(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return { success: true, data: await this.estimates.getById(user.id, id) };
  }

  @Patch(':id')
  async update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateEstimateDto) {
    return { success: true, data: await this.estimates.update(user.id, id, dto) };
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateEstimateStatusDto,
  ) {
    return { success: true, data: await this.estimates.updateStatus(user.id, id, dto.status) };
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async pdf(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() res: Response) {
    const { buffer, estimateNumber } = await this.estimates.getEstimatePdf(user.id, id);
    res.setHeader('Content-Disposition', `attachment; filename="${estimateNumber}.pdf"`);
    res.send(buffer);
  }
}
