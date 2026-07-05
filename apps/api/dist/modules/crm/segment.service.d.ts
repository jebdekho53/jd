import { SegmentKind } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class SegmentService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    listSegments(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        code: string;
        kind: import("@prisma/client").$Enums.SegmentKind;
        isActive: boolean;
        rules: import("@prisma/client/runtime/library").JsonValue;
        isDynamic: boolean;
        memberCount: number;
        lastRefreshedAt: Date | null;
    }[]>;
    getSegmentMembers(segmentId: string, page?: number, limit?: number): Promise<{
        items: ({
            user: {
                id: string;
                email: string | null;
                phone: string;
            };
        } & {
            userId: string;
            segmentId: string;
            addedAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    refreshAllSegments(): Promise<void>;
    refreshSegment(segmentId: string, kind: SegmentKind): Promise<number>;
    private resolveUserIds;
}
