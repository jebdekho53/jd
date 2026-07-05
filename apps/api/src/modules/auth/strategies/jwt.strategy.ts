import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getConfig } from '../../../config/configuration';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestUser } from '../../../common/types';
import { TokenService } from '../token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {
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
   * Re-validates account status, roles, and permissions from DB on every request.
   * Prevents use of stale JWTs after suspension, role revocation, or blacklist.
   */
  async validate(payload: JwtPayload): Promise<RequestUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('Malformed token payload');
    }
    const user = await this.tokenService.resolveLiveRequestUser(payload.sub);
    return {
      ...user,
      authTime: payload.authTime,
      amr: payload.amr,
    };
  }
}
