"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureRandomInt = secureRandomInt;
exports.secureNumericCode = secureNumericCode;
const crypto_1 = require("crypto");
function secureRandomInt(min, max) {
    return (0, crypto_1.randomInt)(min, max + 1);
}
function secureNumericCode(length) {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    return String(secureRandomInt(min, max));
}
//# sourceMappingURL=secure-random.util.js.map