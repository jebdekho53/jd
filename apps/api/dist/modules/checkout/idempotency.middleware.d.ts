import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../database/prisma.service';
export declare class IdempotencyMiddleware implements NestMiddleware {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
}
