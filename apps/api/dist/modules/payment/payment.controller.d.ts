import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { RequestUser } from '../../common/types';
import { PaymentService } from './payment.service';
import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { SyncRazorpayPaymentDto } from './dto/sync-razorpay-payment.dto';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    createRazorpayOrder(user: RequestUser, dto: CreateRazorpayOrderDto, ip: string): Promise<{
        success: boolean;
        data: {
            checkoutId: string;
            orderId: string;
            orderNumber: string;
            razorpayOrderId: string;
            keyId: string;
            amount: number;
            currency: string;
            buyerName: string;
            buyerPhone: string;
            buyerEmail: string;
        };
    }>;
    verifyPayment(user: RequestUser, dto: VerifyPaymentDto, ip: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            orderId: string;
            orderNumber: string;
            message: string;
        } | {
            success: boolean;
            orderId: string;
            orderNumber: string;
            message?: undefined;
        };
    }>;
    syncPayment(user: RequestUser, dto: SyncRazorpayPaymentDto, ip: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            orderId: string;
            orderNumber: string;
            message: string;
        };
    }>;
    handleWebhook(req: RawBodyRequest<Request>, signature: string): Promise<{
        success: boolean;
    }>;
}
