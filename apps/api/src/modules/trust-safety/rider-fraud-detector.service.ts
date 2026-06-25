import { Injectable } from '@nestjs/common';
import { FraudCaseCategory, FraudDecisionAction, TrustAlertType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FraudActionService } from './fraud-action.service';
import { FraudCaseService } from './fraud-case.service';
import { RiskEngineService } from './risk-engine.service';
import { TrustAlertService } from './trust-alert.service';

const MAX_SPEED_KMH = 120;

@Injectable()
export class RiderFraudDetectorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly risk: RiskEngineService,
    private readonly cases: FraudCaseService,
    private readonly actions: FraudActionService,
    private readonly alerts: TrustAlertService,
  ) {}

  async evaluateDeliveryCompletion(
    orderId: string,
    riderProfileId: string,
    lat?: number,
    lng?: number,
  ) {
    const rider = await this.prisma.riderProfile.findUnique({
      where: { id: riderProfileId },
      select: { userId: true },
    });
    if (!rider) return;

    if (lat != null && lng != null) {
      const lastGeo = await this.prisma.geoVerification.findFirst({
        where: { riderProfileId },
        orderBy: { createdAt: 'desc' },
      });
      if (lastGeo) {
        const speed = this.haversineSpeedKmh(
          lastGeo.latitude,
          lastGeo.longitude,
          lat,
          lng,
          (Date.now() - lastGeo.createdAt.getTime()) / 1000,
        );
        if (speed > MAX_SPEED_KMH) {
          await this.flagGpsSpoof(rider.userId, orderId, speed);
        }
      }

      await this.prisma.geoVerification.create({
        data: {
          userId: rider.userId,
          orderId,
          riderProfileId,
          latitude: lat,
          longitude: lng,
          passed: true,
        },
      });
    }

    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
      select: { pickedUpAt: true, deliveredAt: true, status: true },
    });
    if (delivery?.pickedUpAt && delivery.deliveredAt) {
      const minutes = (delivery.deliveredAt.getTime() - delivery.pickedUpAt.getTime()) / 60000;
      if (minutes < 2) {
        await this.risk.recordEvent({
          userId: rider.userId,
          eventType: 'DELIVERY_TIME_ANOMALY',
          severity: 'HIGH',
          idempotencyKey: `delivery-fast:${orderId}`,
          metadata: { minutes },
        });
      }
    }

    const cod = await this.prisma.codReconciliation.findFirst({ where: { orderId } });
    if (cod && cod.status === 'REJECTED') {
      await this.flagCodMismatch(rider.userId, orderId);
    }
  }

  private haversineSpeedKmh(lat1: number, lng1: number, lat2: number, lng2: number, seconds: number) {
    if (seconds <= 0) return 0;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (km / seconds) * 3600;
  }

  private async flagGpsSpoof(userId: string, orderId: string, speedKmh: number) {
    const key = `rider-gps:${orderId}`;
    await this.risk.recordEvent({
      userId,
      eventType: 'RIDER_GPS_SPOOF',
      severity: 'CRITICAL',
      idempotencyKey: key,
      metadata: { speedKmh, orderId },
    });
    const fraudCase = await this.cases.openCase({
      userId,
      category: FraudCaseCategory.RIDER_FRAUD,
      severity: 'CRITICAL',
      title: 'GPS spoofing detected',
      description: `Impossible speed ${speedKmh.toFixed(0)} km/h`,
      subjectType: 'order',
      subjectId: orderId,
      idempotencyKey: key,
    });
    await this.actions.apply(userId, FraudDecisionAction.RIDER_SUSPEND, 'GPS spoofing', undefined, `${key}:action`);
    await this.alerts.raise(
      TrustAlertType.RIDER_ANOMALY,
      'CRITICAL',
      'Rider GPS anomaly',
      fraudCase.description,
      { caseId: fraudCase.id },
    );
  }

  private async flagCodMismatch(userId: string, orderId: string) {
    const key = `rider-cod-mismatch:${orderId}`;
    await this.cases.openCase({
      userId,
      category: FraudCaseCategory.RIDER_FRAUD,
      severity: 'HIGH',
      title: 'COD collection mismatch',
      description: `COD reconciliation rejected for order ${orderId}`,
      subjectType: 'order',
      subjectId: orderId,
      idempotencyKey: key,
    });
  }
}
