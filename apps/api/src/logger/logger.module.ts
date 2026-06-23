import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('LOG_LEVEL', 'debug'),
          ...(config.get<string>('NODE_ENV') !== 'production' && {
            transport: {
              target: 'pino-pretty',
              options: {
                singleLine: true,
                colorize: true,
                translateTime: 'SYS:HH:MM:ss',
                ignore: 'pid,hostname',
              },
            },
          }),
          // Redact sensitive fields from logs
          redact: {
            paths: [
              'req.headers.authorization',
              'req.body.code',
              'req.body.password',
              'req.body.refreshToken',
            ],
            remove: true,
          },
          serializers: {
            req: (req: { id: string; method: string; url: string; query: Record<string, unknown> }) => ({
              id: req.id,
              method: req.method,
              url: req.url,
              query: req.query,
            }),
            res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
          },
          customLogLevel: (_req: unknown, res: { statusCode: number }, err: unknown) => {
            if (err || (res && res.statusCode >= 500)) return 'error';
            if (res && res.statusCode >= 400) return 'warn';
            return 'info';
          },
        },
      }),
    }),
  ],
})
export class LoggerModule {}
