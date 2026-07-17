import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LegalDocumentCode } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { LegalDocument } from './legal-document.types';
import {
  LegalPortal,
  REQUIRED_DOCUMENTS,
  currentVersion,
  getLegalDocument,
} from './legal-documents.registry';
import { assertLegalEntityComplete } from './legal-entity';

export interface AcceptanceContext {
  ip?: string;
  userAgent?: string;
}

export interface PendingDocument {
  code: LegalDocumentCode;
  title: string;
  version: string;
  summary: string;
  /** True when the party accepted an older version and must accept again. */
  isReacceptance: boolean;
}

@Injectable()
export class LegalService {
  private readonly logger = new Logger(LegalService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * A document as served to a portal.
   *
   * Refuses to serve while the company's statutory details are still
   * placeholders — a document quoting a fake CIN or an unnamed grievance officer
   * is a false disclosure, and asking someone to accept it is worse than showing
   * them nothing.
   */
  getDocument(code: LegalDocumentCode): LegalDocument {
    assertLegalEntityComplete();
    const doc = getLegalDocument(code);
    if (!doc) throw new NotFoundException(`No legal document for code ${code}`);
    return doc;
  }

  /**
   * Record acceptance. Append-only: a re-acceptance adds a row, so the original
   * acceptance and its date survive as evidence.
   *
   * The version is validated against the registry rather than trusted from the
   * client, so a tampered request cannot record acceptance of a version that was
   * never served.
   */
  async accept(
    userId: string,
    code: LegalDocumentCode,
    version: string,
    ctx: AcceptanceContext = {},
  ): Promise<{ code: LegalDocumentCode; version: string; acceptedAt: Date }> {
    const doc = this.getDocument(code);

    if (version !== doc.version) {
      throw new BadRequestException(
        `This document has been updated. Please reload and review version ${doc.version}.`,
      );
    }

    const existing = await this.prisma.legalAcceptance.findFirst({
      where: { userId, code, version },
      select: { id: true, acceptedAt: true },
    });
    if (existing) {
      // Already on record — accepting twice is not an error, and must not
      // overwrite the original timestamp.
      return { code, version, acceptedAt: existing.acceptedAt };
    }

    const row = await this.prisma.legalAcceptance.create({
      data: {
        userId,
        code,
        version,
        ipAddress: ctx.ip ?? null,
        userAgent: ctx.userAgent?.slice(0, 512) ?? null,
      },
      select: { acceptedAt: true },
    });

    this.logger.log({ userId, code, version }, 'Legal document accepted');
    return { code, version, acceptedAt: row.acceptedAt };
  }

  /** Documents this user still owes for a portal — empty means they are clear. */
  async pendingFor(userId: string, portal: LegalPortal): Promise<PendingDocument[]> {
    const codes = REQUIRED_DOCUMENTS[portal];
    if (!codes?.length) return [];

    const accepted = await this.prisma.legalAcceptance.findMany({
      where: { userId, code: { in: [...codes] } },
      select: { code: true, version: true },
    });

    const pending: PendingDocument[] = [];
    for (const code of codes) {
      const doc = getLegalDocument(code);
      if (!doc) continue;
      const forCode = accepted.filter((a) => a.code === code);
      if (forCode.some((a) => a.version === doc.version)) continue;
      pending.push({
        code,
        title: doc.title,
        version: doc.version,
        summary: doc.summary,
        isReacceptance: forCode.length > 0,
      });
    }
    return pending;
  }

  async hasAccepted(userId: string, code: LegalDocumentCode): Promise<boolean> {
    const version = currentVersion(code);
    if (!version) return false;
    const row = await this.prisma.legalAcceptance.findFirst({
      where: { userId, code, version },
      select: { id: true },
    });
    return Boolean(row);
  }

  /** Full acceptance history for a user — for audit and dispute resolution. */
  async historyFor(userId: string) {
    return this.prisma.legalAcceptance.findMany({
      where: { userId },
      orderBy: { acceptedAt: 'desc' },
      select: { code: true, version: true, acceptedAt: true, ipAddress: true },
    });
  }
}
