import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { FoodPaymentService } from './food-payment.service';
import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from '../payment/razorpay.service';
import { FoodCheckoutService } from './food-checkout.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';
import { OrderCacheService } from '../order/order-cache.service';
import { PaymentMethod } from '@prisma/client';

describe('FoodPaymentService', () => {
  let service: FoodPaymentService;
  const prisma = {
    buyerProfile: { findUnique: jest.fn() },
    foodCheckout: { findFirst: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    order: { findUnique: jest.fn() },
  };
  const razorpay = {
    isConfigured: jest.fn().mockReturnValue(true),
    verifyPaymentSignature: jest.fn(),
    createOrder: jest.fn(),
    fetchOrderPayments: jest.fn(),
    keyId: 'key_test',
  };
  const foodCheckout = {
    createPaidOrderFromCheckout: jest.fn(),
  };
  const statusHistory = { transition: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodPaymentService,
        { provide: PrismaService, useValue: prisma },
        { provide: RazorpayService, useValue: razorpay },
        { provide: FoodCheckoutService, useValue: foodCheckout },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: DomainEventsService, useValue: { emit: jest.fn() } },
        { provide: OrderStatusHistoryService, useValue: statusHistory },
        { provide: EmailNotificationService, useValue: {
          sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
          sendMerchantNewOrder: jest.fn().mockResolvedValue(undefined),
        } },
        { provide: BuyerPushNotificationService, useValue: { notifyOrderPlaced: jest.fn().mockResolvedValue(undefined) } },
        { provide: OrderCacheService, useValue: { invalidateAll: jest.fn() } },
      ],
    }).compile();
    service = module.get(FoodPaymentService);
    jest.clearAllMocks();
  });

  it('rejects invalid Razorpay signature', async () => {
    prisma.buyerProfile.findUnique.mockResolvedValue({ id: 'bp1' });
    prisma.foodCheckout.findFirst.mockResolvedValue({
      id: 'fc1',
      status: 'PENDING',
      razorpayOrderId: 'rzp_order_1',
      cartSnapshot: { items: [] },
      buyerProfileId: 'bp1',
      storeId: 's1',
      totalAmount: 100,
      paymentMethod: PaymentMethod.RAZORPAY,
      orderId: null,
    });
    razorpay.verifyPaymentSignature.mockReturnValue(false);

    await expect(
      service.verifyPayment('user1', {
        foodCheckoutId: 'fc1',
        razorpayOrderId: 'rzp_order_1',
        razorpayPaymentId: 'pay_1',
        razorpaySignature: 'bad',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('finalizes verified payment idempotently via checkout service', async () => {
    prisma.buyerProfile.findUnique.mockResolvedValue({ id: 'bp1' });
    prisma.foodCheckout.findFirst.mockResolvedValue({
      id: 'fc1',
      status: 'PENDING',
      razorpayOrderId: 'rzp_order_1',
      cartSnapshot: { items: [{ menuItemId: 'm1' }] },
      buyerProfileId: 'bp1',
      storeId: 's1',
      totalAmount: 100,
      paymentMethod: PaymentMethod.RAZORPAY,
      orderId: null,
    });
    razorpay.verifyPaymentSignature.mockReturnValue(true);
    foodCheckout.createPaidOrderFromCheckout.mockResolvedValue({
      orderId: 'o1',
      orderNumber: 'JDF-1',
    });

    const result = await service.verifyPayment('user1', {
      foodCheckoutId: 'fc1',
      razorpayOrderId: 'rzp_order_1',
      razorpayPaymentId: 'pay_1',
      razorpaySignature: 'sig',
    });

    expect(result).toMatchObject({ success: true, orderId: 'o1' });
    expect(foodCheckout.createPaidOrderFromCheckout).toHaveBeenCalled();
    expect(statusHistory.transition).toHaveBeenCalled();
  });

  it('webhook finalize is no-op when checkout already completed', async () => {
    prisma.foodCheckout.findFirst.mockResolvedValue({
      id: 'fc1',
      status: 'COMPLETED',
      orderId: 'o1',
    });

    await service.finalizeFromWebhook('rzp_order_1', 'pay_1');
    expect(foodCheckout.createPaidOrderFromCheckout).not.toHaveBeenCalled();
  });
});
