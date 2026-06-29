"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decimalToNumber = decimalToNumber;
exports.roundMoney = roundMoney;
exports.addDays = addDays;
function decimalToNumber(value) {
    if (value == null)
        return 0;
    return typeof value === 'number' ? value : value.toNumber();
}
function roundMoney(value) {
    return Math.round(value * 100) / 100;
}
function addDays(date, days) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
}
//# sourceMappingURL=settlement.utils.js.map