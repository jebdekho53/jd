import { ConfigService } from '@nestjs/config';
import { UploadImagePurpose } from './dto/upload-image.dto';
export declare class UploadService {
    private readonly configService;
    constructor(configService: ConfigService);
    uploadImage(dataUrl: string, purpose: UploadImagePurpose): Promise<{
        url: string;
    }>;
    private parseDataUrl;
    private validateDimensions;
}
