import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer';
import { EmailDeliveryStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { getConfig } from '../../config/configuration';
import type { EmailTemplateCode } from './email.constants';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  templateCode?: EmailTemplateCode;
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private fromAddress = 'JebDekho <support@jebdekho.com>';
  private readonly cfg: ReturnType<typeof getConfig>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.cfg = getConfig(configService);
  }

  onModuleInit(): void {
    const { smtp } = this.cfg;
    this.fromAddress = smtp.from;

    if (!smtp.enabled) {
      if (this.cfg.nodeEnv === 'production') {
        throw new Error('SMTP credentials are required in production (SMTP_HOST, SMTP_USER, SMTP_PASS)');
      }
      this.logger.warn('SMTP not configured — emails will be logged only (development mode)');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    this.logger.log({ host: smtp.host, port: smtp.port, secure: smtp.secure }, 'SMTP transport ready');
  }

  async send(input: SendEmailInput): Promise<{ success: boolean; logId: string }> {
    const log = await this.prisma.emailLog.create({
      data: {
        recipient: input.to,
        subject: input.subject,
        templateCode: input.templateCode,
        status: EmailDeliveryStatus.PENDING,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    if (!this.transporter) {
      this.logger.log(
        { to: input.to, subject: input.subject, template: input.templateCode },
        'Email skipped (SMTP not configured)',
      );
      await this.prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: EmailDeliveryStatus.FAILED,
          providerResponse: 'SMTP not configured',
        },
      });
      return { success: false, logId: log.id };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments: input.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType ?? 'application/pdf',
        })),
      });

      await this.prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: EmailDeliveryStatus.SENT,
          sentAt: new Date(),
          providerResponse: JSON.stringify({
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected,
          }),
        },
      });

      return { success: true, logId: log.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error({ err, to: input.to, subject: input.subject }, 'Email send failed');

      await this.prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: EmailDeliveryStatus.FAILED,
          providerResponse: message,
        },
      });

      return { success: false, logId: log.id };
    }
  }
}
