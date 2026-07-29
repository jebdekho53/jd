import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags as Tags } from '../../common/constants';
import { UploadService } from './upload.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
// Any authenticated user, no role required: a merchant/franchise applicant
// mid-onboarding has no role yet (granted only on approval — see
// AuthService.merchantEmailSignup and MerchantService.ensureMerchantRole),
// so a role allowlist here 403s exactly the people uploading their
// onboarding documents. Upload itself doesn't check ownership or attach
// the file to anything — that happens at whichever endpoint later saves
// the returned URL onto the caller's own record — so there's nothing a
// role check would actually be protecting here.
@UseGuards(JwtAuthGuard)
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
