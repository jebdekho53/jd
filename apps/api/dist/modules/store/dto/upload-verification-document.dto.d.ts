import { StoreDocumentType } from '@prisma/client';
export declare class UploadVerificationDocumentDto {
    documentType: StoreDocumentType;
    fileName: string;
    mimeType: string;
    fileUrl: string;
}
