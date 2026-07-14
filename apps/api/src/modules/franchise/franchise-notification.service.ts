import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { FRANCHISE_EVENTS, FranchiseStoreEvent } from './franchise.events';

/**
 * Tells the partner what is happening to their business.
 *
 * Until now a franchisee was told nothing at all: not when a merchant signed up
 * through their link, not when that store went live, not when they were paid. They
 * had to go and look.
 *
 * Every method is best-effort — a notification failure must never roll back the
 * thing it is reporting. Losing an email is annoying; failing a payout because the
 * email bounced is not acceptable.
 */
@Injectable()
export class FranchiseNotificationService {
  private readonly logger = new Logger(FranchiseNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  /** A recruited store was approved and is now attributed to the partner. */
  @OnEvent(FRANCHISE_EVENTS.STORE_LINKED)
  async storeApproved(event: FranchiseStoreEvent): Promise<void> {
    await this.notify(event.franchiseId, {
      type: NotificationType.REFERRAL,
      title: `${event.storeName} is live`,
      body: `${event.storeName} has been approved and is now linked to you. You earn a share of the platform commission on every order they take.`,
    });
  }

  /**
   * A store the partner recruited landed in someone else's exclusive pincode, so
   * the attribution is parked. Say so — otherwise they simply never get paid for it
   * and have no idea why.
   */
  @OnEvent(FRANCHISE_EVENTS.STORE_DISPUTED)
  async storeAttributionDisputed(event: FranchiseStoreEvent): Promise<void> {
    const reason = event.reason ?? 'it falls inside another partner’s exclusive territory';
    await this.notify(event.franchiseId, {
      type: NotificationType.REFERRAL,
      title: `${event.storeName} is under review`,
      body: `We can't credit ${event.storeName} to you yet: ${reason}. Our team is reviewing it.`,
    });
  }

  /** Money actually reached their bank. */
  async payoutCompleted(
    franchiseId: string,
    netAmount: number,
    accountLast4?: string,
  ): Promise<void> {
    const to = accountLast4 ? ` to your account ending ${accountLast4}` : '';
    await this.notify(franchiseId, {
      type: NotificationType.FINANCE,
      title: `₹${netAmount.toFixed(2)} paid out`,
      body: `We've sent ₹${netAmount.toFixed(2)}${to}. The breakdown, including TDS and GST, is on your Earnings page.`,
    });
  }

  /** A payout failed. They are still owed the money — say that plainly. */
  async payoutFailed(franchiseId: string, netAmount: number, reason: string): Promise<void> {
    await this.notify(franchiseId, {
      type: NotificationType.FINANCE,
      title: 'Your payout could not be sent',
      body: `We couldn't send ₹${netAmount.toFixed(2)}: ${reason}. You are still owed this — we'll retry.`,
    });
  }

  /** A KYC document was verified or rejected. */
  async documentReviewed(
    franchiseId: string,
    documentLabel: string,
    verified: boolean,
    reason?: string | null,
  ): Promise<void> {
    await this.notify(franchiseId, {
      type: NotificationType.COMPLIANCE,
      title: verified ? `${documentLabel} verified` : `${documentLabel} needs another look`,
      body: verified
        ? `Your ${documentLabel} has been verified.`
        : `Your ${documentLabel} was rejected: ${reason ?? 'please upload a clearer copy'}. Payouts stay on hold until it's verified.`,
    });
  }

  /** Everything is verified — they can now be paid. */
  async onboardingComplete(franchiseId: string): Promise<void> {
    await this.notify(franchiseId, {
      type: NotificationType.COMPLIANCE,
      title: 'You are ready to be paid',
      body: 'Your agreement, PAN and bank account are all verified. Future settlements will be paid out to your bank.',
    });
  }

  // ---------------------------------------------------------------------------

  /**
   * In-app feed entry plus an email. Swallows its own errors on purpose: the caller
   * is doing something that matters (linking a store, sending money) and must not
   * fail because we couldn't tell someone about it.
   */
  private async notify(
    franchiseId: string,
    msg: { type: NotificationType; title: string; body: string },
  ): Promise<void> {
    try {
      const fp = await this.prisma.franchisePartner.findUnique({
        where: { id: franchiseId },
        select: { userId: true, user: { select: { email: true } } },
      });
      if (!fp) return;

      await this.prisma.notification.create({
        data: {
          userId: fp.userId,
          type: msg.type,
          title: msg.title,
          body: msg.body,
          data: { franchiseId },
        },
      });

      if (fp.user.email) {
        await this.email.send({
          to: fp.user.email,
          subject: msg.title,
          text: msg.body,
          html: `<p>${escapeHtml(msg.body)}</p>`,
          metadata: { franchiseId, kind: msg.type },
        });
      }
    } catch (err) {
      this.logger.error(
        { franchiseId, title: msg.title, err: err instanceof Error ? err.message : String(err) },
        'Franchise notification failed',
      );
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
