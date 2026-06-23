import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface AuditLogEntry {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist an audit log entry.
   * Audit log failures must NOT break business operations — fire and continue.
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata ?? Prisma.JsonNull,
        },
      });
    } catch (err) {
      this.logger.error(
        { err, action: entry.action, actorId: entry.actorId },
        'Failed to write audit log',
      );
    }
  }

  /**
   * Convenience: log multiple entries in one call (e.g. bulk admin action).
   */
  async logBatch(entries: AuditLogEntry[]): Promise<void> {
    try {
      await this.prisma.auditLog.createMany({
        data: entries.map((e) => ({
          actorId: e.actorId,
          action: e.action,
          resourceType: e.resourceType,
          resourceId: e.resourceId,
          ipAddress: e.ipAddress,
          userAgent: e.userAgent,
          metadata: e.metadata ?? Prisma.JsonNull,
        })),
        skipDuplicates: false,
      });
    } catch (err) {
      this.logger.error({ err }, 'Failed to write audit log batch');
    }
  }
}
