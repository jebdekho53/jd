import { UploadService } from './upload.service';
import { UploadImageDto } from './dto/upload-image.dto';
export declare class UploadController {
    private readonly uploads;
    constructor(uploads: UploadService);
    uploadImage(dto: UploadImageDto): Promise<{
        success: boolean;
        data: {
            url: string;
        };
    }>;
}
