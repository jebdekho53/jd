import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { getConfig } from '../../config/configuration';
import { RequestUser } from '../types';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

@Injectable()
export class WsAuthService {
  private readonly cfg: ReturnType<typeof getConfig>;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.cfg = getConfig(configService);
  }

  extractTokenFromSocket(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length).trim();
    }

    return null;
  }

  verifyAccessToken(token: string): RequestUser | null {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        algorithms: ['RS256'],
        issuer: this.cfg.jwt.issuer,
        audience: this.cfg.jwt.audience,
        publicKey: this.cfg.jwt.publicKey,
      });

      if (!payload.sub) return null;

      return {
        id: payload.sub,
        phone: payload.phone,
        email: payload.email ?? null,
        roles: payload.roles ?? [],
        permissions: payload.permissions ?? [],
      };
    } catch {
      return null;
    }
  }

  authenticateSocket(client: Socket): RequestUser | null {
    const token = this.extractTokenFromSocket(client);
    if (!token) return null;
    return this.verifyAccessToken(token);
  }

  hasAnyRole(user: RequestUser, roles: string[]): boolean {
    return roles.some((role) => user.roles.includes(role));
  }
}
