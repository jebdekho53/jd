import {
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../database/prisma.service';

/** Idempotency keys expire after 24 hours. */
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Idempotency middleware for mutating endpoints (checkout, payment creation).
 *
 * Flow:
 *   1. If no `Idempotency-Key` header → pass through (key not required on non-listed routes).
 *   2. If key exists + not processing → return cached response immediately.
 *   3. If key exists + processing     → 409 (concurrent duplicate request).
 *   4. If key missing from DB          → mark as processing, proceed, capture response.
 *
 * Guarded endpoints must send `Idempotency-Key: <uuid>` header.
 */
@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IdempotencyMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    if (!idempotencyKey) {
      next();
      return;
    }

    const userId = (req as any).user?.id as string | undefined;
    const endpoint = `${req.method}:${req.path}`;

    // ── Look up existing record ────────────────────────────────────────────
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existing) {
      // Replay attack protection: key must belong to the same user
      if (existing.userId && userId && existing.userId !== userId) {
        res.status(403).json({
          success: false,
          error: { code: 'IDEMPOTENCY_KEY_MISMATCH', message: 'Idempotency key belongs to a different user' },
        });
        return;
      }

      if (existing.processing) {
        // Concurrent duplicate — another request with the same key is in flight
        res.status(409).json({
          success: false,
          error: {
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'A request with this idempotency key is currently being processed',
          },
        });
        return;
      }

      // Return the cached response (same status + body as original)
      this.logger.debug(`Idempotency cache hit: ${idempotencyKey}`);
      res.status(existing.responseCode).json(existing.responseBody);
      return;
    }

    // ── Mark as processing ─────────────────────────────────────────────────
    try {
      await this.prisma.idempotencyKey.create({
        data: {
          key: idempotencyKey,
          userId: userId ?? '',
          endpoint,
          responseCode: 0,       // placeholder — updated after response
          responseBody: {},      // placeholder
          processing: true,
          expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
        },
      });
    } catch {
      // Unique constraint violation → concurrent race; treat as conflict
      res.status(409).json({
        success: false,
        error: {
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'A request with this idempotency key is currently being processed',
        },
      });
      return;
    }

    // ── Intercept the response to persist it ──────────────────────────────
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    let capturedStatus = 200;
    res.status = (code: number) => {
      capturedStatus = code;
      return originalStatus(code);
    };

    res.json = (body: unknown) => {
      // Persist the response after it is sent (fire-and-forget)
      this.prisma.idempotencyKey
        .update({
          where: { key: idempotencyKey },
          data: {
            responseCode: capturedStatus,
            responseBody: body as any,
            processing: false,
          },
        })
        .catch((err: Error) =>
          this.logger.warn(`Failed to persist idempotency response: ${err.message}`),
        );

      return originalJson(body);
    };

    next();
  }
}
