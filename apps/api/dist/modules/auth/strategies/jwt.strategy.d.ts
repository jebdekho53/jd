import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestUser } from '../../../common/types';
import { TokenService } from '../token.service';
declare const JwtStrategy_base: any;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly tokenService;
    constructor(configService: ConfigService, tokenService: TokenService);
    validate(payload: JwtPayload): Promise<RequestUser>;
}
export {};
