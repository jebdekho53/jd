import { ConfigService } from '@nestjs/config';
export declare function createAuthConfigMock(overrides?: Record<string, string>): Pick<ConfigService, 'get'>;
