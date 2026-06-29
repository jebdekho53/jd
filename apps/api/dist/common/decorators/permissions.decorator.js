"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permissions = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../constants");
const Permissions = (...permissions) => (0, common_1.SetMetadata)(constants_1.PERMISSIONS_KEY, permissions);
exports.Permissions = Permissions;
//# sourceMappingURL=permissions.decorator.js.map