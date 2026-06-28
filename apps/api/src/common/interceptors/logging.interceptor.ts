import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { AuthenticatedRequest } from '../types';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & AuthenticatedRequest>();
    const { method, url } = request;
    const userId = request.user?.id ?? 'anonymous';
    const requestId = request.headers['x-request-id'] ?? '-';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.debug(
          `${method} ${url} [req:${requestId}] [user:${userId}] ${ms}ms`,
        );
      }),
    );
  }
}
