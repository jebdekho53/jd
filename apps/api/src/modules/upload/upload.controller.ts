import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { UploadService } from './upload.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
// FRANCHISE partners upload KYC documents (PAN, cheque, signed agreement), so they
// need the upload surface too — without this they could not complete onboarding.
@Roles('BUYER', 'MERCHANT', 'FRANCHISE', 'ADMIN', 'SUPER_ADMIN')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploads: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload a cropped product, store, or category image' })
  async uploadImage(@Body() dto: UploadImageDto) {
    const data = await this.uploads.uploadImage(dto.dataUrl, dto.purpose);
    return { success: true, data };
  }

  @Post('document')
  @ApiOperation({ summary: 'Upload a KYC document (PDF or image)' })
  async uploadDocument(@Body() dto: UploadDocumentDto) {
    const data = await this.uploads.uploadDocument(dto.dataUrl, dto.purpose);
    return { success: true, data };
  }
}
