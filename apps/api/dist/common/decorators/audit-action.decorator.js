"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAction = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../constants");
const AuditAction = (action) => (0, common_1.SetMetadata)(constants_1.AUDIT_ACTION_KEY, action);
exports.AuditAction = AuditAction;
//# sourceMappingURL=audit-action.decorator.js.map