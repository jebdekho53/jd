import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getConfig } from '../../../config/configuration';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestUser } from '../../../common/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const cfg = getConfig(configService);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKey: cfg.jwt.publicKey,
      issuer: cfg.jwt.issuer,
      audience: cfg.jwt.audience,
    });
  }

  /**
   * Called after Passport verifies the token signature and expiry.
   * The returned value is attached to request.user.
   */
  validate(payload: JwtPayload): RequestUser {
    if (!payload.sub) {
      throw new UnauthorizedException('Malformed token payload');
    }

    return {
      id: payload.sub,
      phone: payload.phone,
      email: payload.email ?? null,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
    };
  }
}
