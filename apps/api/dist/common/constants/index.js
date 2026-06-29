"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiTags = exports.MAX_DEVICES_PER_USER = exports.PHONE_E164_REGEX = exports.INDIAN_PHONE_REGEX = exports.AUDIT_ACTION_KEY = exports.IS_PUBLIC_KEY = exports.PERMISSIONS_KEY = exports.ROLES_KEY = void 0;
exports.ROLES_KEY = 'roles';
exports.PERMISSIONS_KEY = 'permissions';
exports.IS_PUBLIC_KEY = 'isPublic';
exports.AUDIT_ACTION_KEY = 'auditAction';
exports.INDIAN_PHONE_REGEX = /^\+91[6-9]\d{9}$/;
exports.PHONE_E164_REGEX = /^\+[1-9]\d{6,14}$/;
exports.MAX_DEVICES_PER_USER = 10;
var ApiTags;
(function (ApiTags) {
    ApiTags["AUTH"] = "auth";
    ApiTags["BUYERS"] = "buyers";
    ApiTags["MERCHANTS"] = "merchants";
    ApiTags["STORES"] = "stores";
    ApiTags["PRODUCTS"] = "products";
    ApiTags["ORDERS"] = "orders";
    ApiTags["RIDERS"] = "riders";
    ApiTags["ADMIN"] = "admin";
    ApiTags["HEALTH"] = "health";
})(ApiTags || (exports.ApiTags = ApiTags = {}));
//# sourceMappingURL=index.js.map