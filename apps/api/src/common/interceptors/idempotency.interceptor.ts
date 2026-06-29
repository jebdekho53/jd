import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from, of } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';
import { Request, Response } from 'express';

/** 24-hour idempotency window — matches standard industry practice. */
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Idempotency interceptor.
 *
 * Attach with `@UseInterceptors(IdempotencyInterceptor)` on any mutating
 * endpoint that requires duplicate-request protection.
 *
 * Protocol:
 *   - Client sends `Idempotency-Key: <uuid>` header.
 *   - If the key has a completed record → return the cached response verbatim.
 *   - If the key is "processing" (concurrent duplicate) → return 409.
 *   - Otherwise → execute handler, persist response.
 *   - If no header is present → pass through (idempotency is opt-in).
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: { id: string } }>();
    const idempKey = req.headers['idempotency-key'] as string | undefined;

    if (!idempKey) return next.handle();
    if (!req.user?.id) return next.handle();

    return from(this.resolveIdempotency(req, idempKey, next)).pipe(
      mergeMap((obs) => obs),
    );
  }

  private async resolveIdempotency(
    req: Request & { user?: { id: string } },
    idempKey: string,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const userId = req.user!.id;
    const endpoint = `${req.method}:${req.path}`;

    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { key: idempKey },
    });

    if (existing) {
      if (existing.userId !== userId) {
        throw new ConflictException(
          'Idempotency-Key was already used by another account',
        );
      }

      if (existing.processing) {
        // Concurrent duplicate in-flight → reject
        this.logger.warn(`Idempotency concurrent conflict: ${idempKey}`);
        throw Object.assign(new Error('Request is already being processed'), {
          status: 409,
          message: 'A request with this Idempotency-Key is already being processed.',
        });
      }

      this.logger.debug(`Idempotency cache hit: ${idempKey}`);
      return of(existing.responseBody);
    }

    // Reserve the key as "processing"
    await this.prisma.idempotencyKey.create({
      data: {
        key: idempKey,
        userId,
        endpoint,
        responseCode: 0,
        responseBody: {},
        processing: true,
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
      },
    });

    // Execute handler and persist response
    return next.handle().pipe(
      tap({
        next: async (response: unknown) => {
          try {
            await this.prisma.idempotencyKey.update({
              where: { key: idempKey },
              data: {
                responseCode: 200,
                responseBody: response as object,
                processing: false,
              },
            });
          } catch (e) {
            this.logger.error(`Idempotency persist error: ${(e as Error).message}`);
          }
        },
        error: async () => {
          // On error: release the key so client can retry
          try {
            await this.prisma.idempotencyKey.delete({ where: { key: idempKey } });
          } catch (_) { /* ignore */ }
        },
      }),
    );
  }
}
