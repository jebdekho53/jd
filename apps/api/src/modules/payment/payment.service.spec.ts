import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutStatus, PaymentStatus } from '@prisma/client';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from './razorpay.service';
import { ReservationService } from '../checkout/reservation.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';

const CHECKOUT_ID = 'chk1';
const ORDER_ID = 'ord1';
const PAYMENT_ID = 'pay1';
const RZP_ORDER_ID = 'order_rzp1';
const RZP_PAYMENT_ID = 'pay_rzp1';
const USER_ID = 'user1';
const BUYER_PROFILE_ID = 'bp1';

const mockPrisma = {
  $transaction: jest.fn(),
  buyerProfile: { findUnique: jest.fn() },
  checkout: {
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
  },
  payment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  order: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  orderStatusHistory: { create: jest.fn() },
};

const mockRazorpay = {
  keyId: 'rzp_test_xxx',
  createOrder: jest.fn(),
  verifyPaymentSignature: jest.fn(),
};

const mockReservation = {
  linkReservationsToOrder: jest.fn(),
  fulfillOnDelivery: jest.fn(),
  releaseReservations: jest.fn(),
};

const mockAudit = { log: jest.fn() };
const mockDomainEvents = { emit: jest.fn() };

const buildCheckout = (overrides = {}) => ({
  id: CHECKOUT_ID,
  buyerProfileId: BUYER_PROFILE_ID,
  storeId: 'store1',
  status: CheckoutStatus.RESERVED,
  totalAmount: 220,
  orderId: ORDER_ID,
  expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  order: {
    id: ORDER_ID,
    orderNumber: 'JD-20260622-ABC',
    status: 'PAYMENT_PENDING',
    paymentStatus: PaymentStatus.PENDING,
    payment: null,
  },
  ...overrides,
});

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RazorpayService, useValue: mockRazorpay },
        { provide: ReservationService, useValue: mockReservation },
        { provide: AuditService, useValue: mockAudit },
        { provide: DomainEventsService, useValue: mockDomainEvents },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    jest.clearAllMocks();
  });

  describe('createRazorpayOrder', () => {
    beforeEach(() => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue({ id: BUYER_PROFILE_ID });
      mockPrisma.checkout.findFirst.mockResolvedValue(buildCheckout());
      mockRazorpay.createOrder.mockResolvedValue({
        id: RZP_ORDER_ID,
        amount: 22000,
        currency: 'INR',
      });
      mockPrisma.payment.upsert.mockResolvedValue({});
      mockAudit.log.mockResolvedValue(undefined);
    });

    it('creates a Razorpay order and returns razorpay config', async () => {
      const dto = { checkoutId: CHECKOUT_ID };
      const result = await service.createRazorpayOrder(USER_ID, dto);

      expect(mockRazorpay.createOrder).toHaveBeenCalledWith(220, expect.any(String));
      expect(result).toMatchObject({
        checkoutId: CHECKOUT_ID,
        razorpay: expect.objectContaining({ orderId: RZP_ORDER_ID }),
      });
    });

    it('throws BadRequestException if checkout not in RESERVED status', async () => {
      mockPrisma.checkout.findFirst.mockResolvedValue(
        buildCheckout({ status: CheckoutStatus.COMPLETED }),
      );
      await expect(service.createRazorpayOrder(USER_ID, { checkoutId: CHECKOUT_ID })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException if checkout is expired', async () => {
      mockPrisma.checkout.findFirst.mockResolvedValue(
        buildCheckout({ expiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(service.createRazorpayOrder(USER_ID, { checkoutId: CHECKOUT_ID })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('returns existing Razorpay order idempotently', async () => {
      mockPrisma.checkout.findFirst.mockResolvedValue(
        buildCheckout({
          order: {
            id: ORDER_ID,
            orderNumber: 'JD-20260622-ABC',
            status: 'PAYMENT_PENDING',
            paymentStatus: PaymentStatus.PENDING,
            payment: { razorpayOrderId: RZP_ORDER_ID, amount: 220 },
          },
        }),
      );

      const result = await service.createRazorpayOrder(USER_ID, { checkoutId: CHECKOUT_ID });
      expect(result.razorpay.orderId).toBe(RZP_ORDER_ID);
      expect(mockRazorpay.createOrder).not.toHaveBeenCalled();
    });
  });

  describe('verifyPayment', () => {
    const validDto = {
      checkoutId: CHECKOUT_ID,
      razorpayOrderId: RZP_ORDER_ID,
      razorpayPaymentId: RZP_PAYMENT_ID,
      razorpaySignature: 'valid_sig',
    };

    beforeEach(() => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue({ id: BUYER_PROFILE_ID });
      mockRazorpay.verifyPaymentSignature.mockReturnValue(true);
      mockPrisma.checkout.findFirst.mockResolvedValue(
        buildCheckout({ order: { id: ORDER_ID, orderNumber: 'JD-XY', status: 'PAYMENT_PENDING', paymentStatus: 'PENDING', payment: null } }),
      );
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: PAYMENT_ID,
        orderId: ORDER_ID,
        status: PaymentStatus.PENDING,
      });
      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        if (typeof cb === 'function') return cb(mockPrisma);
        return Promise.all(cb);
      });
      mockPrisma.checkout.update.mockResolvedValue({});
      mockReservation.linkReservationsToOrder.mockResolvedValue(undefined);
      mockAudit.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue(undefined);
    });

    it('throws UnauthorizedException on invalid signature', async () => {
      mockRazorpay.verifyPaymentSignature.mockReturnValue(false);
      await expect(service.verifyPayment(USER_ID, validDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns idempotent response when payment is already PAID', async () => {
      mockPrisma.checkout.findFirst.mockResolvedValue(
        buildCheckout({ status: CheckoutStatus.COMPLETED }),
      );
      const result = await service.verifyPayment(USER_ID, validDto);
      expect(result).toMatchObject({ success: true, message: 'Payment already verified' });
    });

    it('throws NotFoundException when order is missing', async () => {
      mockPrisma.checkout.findFirst.mockResolvedValue(
        buildCheckout({ order: null }),
      );
      await expect(service.verifyPayment(USER_ID, validDto)).rejects.toThrow(NotFoundException);
    });
  });
});
