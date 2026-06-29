import { ConfigService } from '@nestjs/config';
export declare class Msg91Service {
    private readonly configService;
    private readonly logger;
    private readonly cfg;
    constructor(configService: ConfigService);
    sendOtp(phone: string, otp: string): Promise<void>;
    sendTransactional(phone: string, message: string): Promise<void>;
    private sendViaMSG91;
}
