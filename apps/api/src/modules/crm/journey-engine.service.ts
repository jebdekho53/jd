import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CustomerJourneyStatus,
  JourneyExecutionStatus,
  NotificationChannel,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationOrchestratorService } from './notification-orchestrator.service';

@Injectable()
export class JourneyEngineService {
  private readonly logger = new Logger(JourneyEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationOrchestratorService,
  ) {}

  async listJourneys() {
    return this.prisma.campaignJourney.findMany({
      where: { isActive: true },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async enrollUser(journeyCode: string, userId: string) {
    const journey = await this.prisma.campaignJourney.findUnique({
      where: { code: journeyCode },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    if (!journey || !journey.steps.length) return null;

    const enrollment = await this.prisma.customerJourney.upsert({
      where: { journeyId_userId: { journeyId: journey.id, userId } },
      create: { journeyId: journey.id, userId, status: CustomerJourneyStatus.IN_PROGRESS },
      update: { status: CustomerJourneyStatus.IN_PROGRESS, exitedAt: null },
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

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processScheduledSteps() {
    const due = await this.prisma.journeyExecution.findMany({
      where: {
        status: JourneyExecutionStatus.SCHEDULED,
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
          data: { status: JourneyExecutionStatus.SENT, executedAt: new Date() },
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
        } else {
          await this.prisma.customerJourney.updateMany({
            where: { journeyId: exec.journeyId, userId: exec.userId },
            data: { status: CustomerJourneyStatus.COMPLETED, completedAt: new Date() },
          });
        }
      } catch (err) {
        this.logger.error({ err, execId: exec.id }, 'Journey step failed');
        await this.prisma.journeyExecution.update({
          where: { id: exec.id },
          data: {
            status: JourneyExecutionStatus.FAILED,
            errorMessage: err instanceof Error ? err.message : 'Unknown error',
          },
        });
      }
    }
  }
}
