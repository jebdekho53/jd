import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
import { EmailNotificationService } from './email-notification.service';
import { AdminEmailController } from './admin-email.controller';

@Global()
@Module({
  controllers: [AdminEmailController],
  providers: [EmailService, EmailTemplateService, EmailNotificationService],
  exports: [EmailService, EmailTemplateService, EmailNotificationService],
})
export class EmailModule {}
