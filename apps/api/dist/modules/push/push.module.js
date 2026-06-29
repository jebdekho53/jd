"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushModule = void 0;
const common_1 = require("@nestjs/common");
const crm_module_1 = require("../crm/crm.module");
const buyer_push_controller_1 = require("./buyer-push.controller");
const buyer_push_subscription_service_1 = require("./buyer-push-subscription.service");
const buyer_push_notification_service_1 = require("./buyer-push-notification.service");
const buyer_push_listener_1 = require("./buyer-push.listener");
const web_push_service_1 = require("./web-push.service");
let PushModule = class PushModule {
};
exports.PushModule = PushModule;
exports.PushModule = PushModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => crm_module_1.CrmModule)],
        controllers: [buyer_push_controller_1.BuyerPushController],
        providers: [
            web_push_service_1.WebPushService,
            buyer_push_subscription_service_1.BuyerPushSubscriptionService,
            buyer_push_notification_service_1.BuyerPushNotificationService,
            buyer_push_listener_1.BuyerPushListener,
        ],
        exports: [buyer_push_notification_service_1.BuyerPushNotificationService, web_push_service_1.WebPushService, buyer_push_subscription_service_1.BuyerPushSubscriptionService],
    })
], PushModule);
//# sourceMappingURL=push.module.js.map