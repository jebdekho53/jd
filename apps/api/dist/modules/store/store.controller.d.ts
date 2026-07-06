import { Request } from 'express';
import { RequestUser } from '../../common/types';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ListStoresDto } from './dto/list-stores.dto';
import { UploadVerificationDocumentDto } from './dto/upload-verification-document.dto';
export declare class StoreController {
    private readonly storeService;
    constructor(storeService: StoreService);
    createStore(user: RequestUser, dto: CreateStoreDto, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
    listStores(user: RequestUser, query: ListStoresDto): Promise<{
        success: boolean;
        data: any[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getStore(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    updateStore(user: RequestUser, storeId: string, dto: UpdateStoreDto, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
    submitForReview(user: RequestUser, storeId: string, ip: string, req: Request): Promise<{
        success: boolean;
        data: any;
    }>;
    uploadVerificationDocument(user: RequestUser, storeId: string, dto: UploadVerificationDocumentDto, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
    submitDocumentsForReview(user: RequestUser, storeId: string, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
}
