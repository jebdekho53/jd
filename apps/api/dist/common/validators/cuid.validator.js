"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUID_REGEX = void 0;
exports.IsCuid = IsCuid;
const class_validator_1 = require("class-validator");
exports.CUID_REGEX = /^c[a-z0-9]{24}$/;
function IsCuid(validationOptions) {
    return (0, class_validator_1.Matches)(exports.CUID_REGEX, {
        message: '$property must be a valid CUID',
        ...validationOptions,
    });
}
//# sourceMappingURL=cuid.validator.js.map