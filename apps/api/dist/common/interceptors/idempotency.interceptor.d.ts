import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';
export declare class IdempotencyInterceptor implements NestInterceptor {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private resolveIdempotency;
}
