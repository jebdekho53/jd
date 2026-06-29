import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import type { EmailTemplateCode } from './email.constants';
export interface SendEmailInput {
    to: string;
    subject: string;
    html: string;
    text: string;
    templateCode?: EmailTemplateCode;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType?: string;
    }>;
    metadata?: Record<string, unknown>;
}
export declare class EmailService implements OnModuleInit {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private transporter;
    private fromAddress;
    private readonly cfg;
    constructor(prisma: PrismaService, configService: ConfigService);
    onModuleInit(): void;
    send(input: SendEmailInput): Promise<{
        success: boolean;
        logId: string;
    }>;
}
