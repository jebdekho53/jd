import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { RequestUser } from '../types';
export declare class WsAuthService {
    private readonly jwtService;
    private readonly cfg;
    constructor(jwtService: JwtService, configService: ConfigService);
    extractTokenFromSocket(client: Socket): string | null;
    verifyAccessToken(token: string): RequestUser | null;
    authenticateSocket(client: Socket): RequestUser | null;
    hasAnyRole(user: RequestUser, roles: string[]): boolean;
}
