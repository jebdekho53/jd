import { Module } from '@nestjs/common';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';
import { LegalAcceptanceGuard } from './legal-acceptance.guard';

@Module({
  controllers: [LegalController],
  providers: [LegalService, LegalAcceptanceGuard],
  exports: [LegalService, LegalAcceptanceGuard],
})
export class LegalModule {}
