"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const configuration_1 = require("../../config/configuration");
let EmailService = EmailService_1 = class EmailService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(EmailService_1.name);
        this.transporter = null;
        this.fromAddress = 'JebDekho <support@jebdekho.com>';
        this.cfg = (0, configuration_1.getConfig)(configService);
    }
    onModuleInit() {
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
    async send(input) {
        const log = await this.prisma.emailLog.create({
            data: {
                recipient: input.to,
                subject: input.subject,
                templateCode: input.templateCode,
                status: client_1.EmailDeliveryStatus.PENDING,
                metadata: input.metadata,
            },
        });
        if (!this.transporter) {
            this.logger.log({ to: input.to, subject: input.subject, template: input.templateCode }, 'Email skipped (SMTP not configured)');
            await this.prisma.emailLog.update({
                where: { id: log.id },
                data: {
                    status: client_1.EmailDeliveryStatus.FAILED,
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
                    status: client_1.EmailDeliveryStatus.SENT,
                    sentAt: new Date(),
                    providerResponse: JSON.stringify({
                        messageId: info.messageId,
                        accepted: info.accepted,
                        rejected: info.rejected,
                    }),
                },
            });
            return { success: true, logId: log.id };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error({ err, to: input.to, subject: input.subject }, 'Email send failed');
            await this.prisma.emailLog.update({
                where: { id: log.id },
                data: {
                    status: client_1.EmailDeliveryStatus.FAILED,
                    providerResponse: message,
                },
            });
            return { success: false, logId: log.id };
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], EmailService);
//# sourceMappingURL=email.service.js.map