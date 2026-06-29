import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestUser } from '../../../common/types';
import { TokenService } from '../token.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly tokenService;
    constructor(configService: ConfigService, tokenService: TokenService);
    validate(payload: JwtPayload): Promise<RequestUser>;
}
export {};
