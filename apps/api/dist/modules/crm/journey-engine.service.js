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
var JourneyEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JourneyEngineService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const notification_orchestrator_service_1 = require("./notification-orchestrator.service");
let JourneyEngineService = JourneyEngineService_1 = class JourneyEngineService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.logger = new common_1.Logger(JourneyEngineService_1.name);
    }
    async listJourneys() {
        return this.prisma.campaignJourney.findMany({
            where: { isActive: true },
            include: { steps: { orderBy: { stepOrder: 'asc' } } },
            orderBy: { name: 'asc' },
        });
    }
    async enrollUser(journeyCode, userId) {
        const journey = await this.prisma.campaignJourney.findUnique({
            where: { code: journeyCode },
            include: { steps: { orderBy: { stepOrder: 'asc' } } },
        });
        if (!journey || !journey.steps.length)
            return null;
        const enrollment = await this.prisma.customerJourney.upsert({
            where: { journeyId_userId: { journeyId: journey.id, userId } },
            create: { journeyId: journey.id, userId, status: client_1.CustomerJourneyStatus.IN_PROGRESS },
            update: { status: client_1.CustomerJourneyStatus.IN_PROGRESS, exitedAt: null },
        });
        const firstStep = journey.steps[0];
        const scheduledAt = new Date(Date.now() + firstStep.delayMinutes * 60 * 1000);
        await this.prisma.journeyExecution.create({
            data: {
                journeyId: journey.id,
                stepId: firstStep.id,
                userId,
                scheduledAt,
            },
        });
        return enrollment;
    }
    async processScheduledSteps() {
        const due = await this.prisma.journeyExecution.findMany({
            where: {
                status: client_1.JourneyExecutionStatus.SCHEDULED,
                scheduledAt: { lte: new Date() },
            },
            take: 50,
            include: { step: true, journey: { include: { steps: { orderBy: { stepOrder: 'asc' } } } } },
        });
        for (const exec of due) {
            try {
                if (exec.step.templateCode) {
                    await this.notifications.send({
                        userId: exec.userId,
                        channel: exec.step.channel,
                        templateCode: exec.step.templateCode,
                    });
                }
                await this.prisma.journeyExecution.update({
                    where: { id: exec.id },
                    data: { status: client_1.JourneyExecutionStatus.SENT, executedAt: new Date() },
                });
                const nextStep = exec.journey.steps.find((s) => s.stepOrder === exec.step.stepOrder + 1);
                if (nextStep) {
                    await this.prisma.journeyExecution.create({
                        data: {
                            journeyId: exec.journeyId,
                            stepId: nextStep.id,
                            userId: exec.userId,
                            scheduledAt: new Date(Date.now() + nextStep.delayMinutes * 60 * 1000),
                        },
                    });
                    await this.prisma.customerJourney.updateMany({
                        where: { journeyId: exec.journeyId, userId: exec.userId },
                        data: { currentStep: nextStep.stepOrder },
                    });
                }
                else {
                    await this.prisma.customerJourney.updateMany({
                        where: { journeyId: exec.journeyId, userId: exec.userId },
                        data: { status: client_1.CustomerJourneyStatus.COMPLETED, completedAt: new Date() },
                    });
                }
            }
            catch (err) {
                this.logger.error({ err, execId: exec.id }, 'Journey step failed');
                await this.prisma.journeyExecution.update({
                    where: { id: exec.id },
                    data: {
                        status: client_1.JourneyExecutionStatus.FAILED,
                        errorMessage: err instanceof Error ? err.message : 'Unknown error',
                    },
                });
            }
        }
    }
};
exports.JourneyEngineService = JourneyEngineService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JourneyEngineService.prototype, "processScheduledSteps", null);
exports.JourneyEngineService = JourneyEngineService = JourneyEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_orchestrator_service_1.NotificationOrchestratorService])
], JourneyEngineService);
//# sourceMappingURL=journey-engine.service.js.map