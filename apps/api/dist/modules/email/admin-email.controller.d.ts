import { EmailNotificationService } from './email-notification.service';
import { TestEmailDto } from './dto/test-email.dto';
export declare class AdminEmailController {
    private readonly emails;
    constructor(emails: EmailNotificationService);
    testEmail(dto: TestEmailDto): Promise<{
        success: boolean;
        data: {
            sent: boolean;
            recipient: string;
            message: string;
        };
    }>;
}
