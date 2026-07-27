import { Module } from '@nestjs/common';
import { ComplianceModule } from '../compliance/compliance.module';
import { EstimateService } from './estimate.service';
import { EstimateController } from './estimate.controller';

@Module({
  imports: [ComplianceModule],
  controllers: [EstimateController],
  providers: [EstimateService],
})
export class EstimateModule {}
