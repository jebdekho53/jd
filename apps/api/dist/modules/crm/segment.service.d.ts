import { SegmentKind } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class SegmentService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    listSegments(): Promise<any>;
    getSegmentMembers(segmentId: string, page?: number, limit?: number): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    refreshAllSegments(): Promise<void>;
    refreshSegment(segmentId: string, kind: SegmentKind): Promise<number>;
    private resolveUserIds;
}
