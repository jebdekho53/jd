import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getConfig } from '../../config/configuration';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Msg91Service } from './msg91.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { MerchantModule } from '../merchant/merchant.module';
import { TrustSafetyModule } from '../trust-safety/trust-safety.module';
import { WalletLoyaltyModule } from '../wallet-loyalty/wallet-loyalty.module';
import { PasswordService } from './password.service';

@Module({
  imports: [
    MerchantModule,
    TrustSafetyModule,
    WalletLoyaltyModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const cfg = getConfig(configService);
        return {
          privateKey: cfg.jwt.privateKey,
          publicKey: cfg.jwt.publicKey,
          signOptions: {
            algorithm: 'RS256',
            expiresIn: cfg.jwt.accessExpiresIn,
            issuer: cfg.jwt.issuer,
            audience: cfg.jwt.audience,
            keyid: cfg.jwt.keyId,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    Msg91Service,
    OtpService,
    TokenService,
    PasswordService,
    AuthService,
    // Export guards so other modules can use them as app-level guards
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [
    JwtModule,
    PassportModule,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    TokenService,
    AuthService,
  ],
})
export class AuthModule {}
