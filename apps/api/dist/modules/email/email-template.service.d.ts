export declare class EmailTemplateService {
    layout(title: string, bodyHtml: string, preheader?: string): string;
    otp(code: string, expiresMinutes: number): {
        subject: string;
        html: string;
        text: string;
    };
    welcome(name: string): {
        subject: string;
        html: string;
        text: string;
    };
    orderConfirmation(data: {
        orderNumber: string;
        items: Array<{
            name: string;
            qty: number;
            price: string;
        }>;
        total: string;
        paymentMethod: string;
        address: string;
    }): {
        subject: string;
        html: string;
        text: string;
    };
    orderDelivered(orderNumber: string, reviewUrl: string): {
        subject: string;
        html: string;
        text: string;
    };
    passwordReset(resetUrl: string, expiresMinutes: number): {
        subject: string;
        html: string;
        text: string;
    };
    supportTicket(data: {
        ticketNumber: string;
        subject: string;
        category: string;
        description: string;
    }): {
        subject: string;
        html: string;
        text: string;
    };
    refund(data: {
        orderNumber: string;
        amount: string;
        settlementTime: string;
    }): {
        subject: string;
        html: string;
        text: string;
    };
    gstInvoice(invoiceNumber: string): {
        subject: string;
        html: string;
        text: string;
    };
    test(): {
        subject: string;
        html: string;
        text: string;
    };
    adminWelcome(name: string): {
        subject: string;
        html: string;
        text: string;
    };
    adminPasswordReset(resetUrl: string, expiresMinutes: number): {
        subject: string;
        html: string;
        text: string;
    };
    adminSecurityAlert(message: string): {
        subject: string;
        html: string;
        text: string;
    };
    adminNewDeviceLogin(name: string, ipAddress: string): {
        subject: string;
        html: string;
        text: string;
    };
    merchantApproved(storeName: string, dashboardUrl: string): {
        subject: string;
        html: string;
        text: string;
    };
    merchantRejected(storeName: string, reason: string, dashboardUrl: string): {
        subject: string;
        html: string;
        text: string;
    };
    private escape;
}
