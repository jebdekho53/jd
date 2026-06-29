"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailModule = void 0;
const common_1 = require("@nestjs/common");
const email_service_1 = require("./email.service");
const email_template_service_1 = require("./email-template.service");
const email_notification_service_1 = require("./email-notification.service");
const admin_email_controller_1 = require("./admin-email.controller");
let EmailModule = class EmailModule {
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [admin_email_controller_1.AdminEmailController],
        providers: [email_service_1.EmailService, email_template_service_1.EmailTemplateService, email_notification_service_1.EmailNotificationService],
        exports: [email_service_1.EmailService, email_template_service_1.EmailTemplateService, email_notification_service_1.EmailNotificationService],
    })
], EmailModule);
//# sourceMappingURL=email.module.js.map