"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merchantOrderDayFilter = exports.startOfUtcDay = exports.IST_TIMEZONE = void 0;
exports.startOfIstDay = startOfIstDay;
exports.endOfIstDay = endOfIstDay;
exports.istDayRange = istDayRange;
exports.startOfIstMonth = startOfIstMonth;
exports.istWeekdayIndex = istWeekdayIndex;
exports.startOfIstWeek = startOfIstWeek;
exports.daysAgoIst = daysAgoIst;
exports.daysAgo = daysAgo;
exports.orderIstDayFilter = orderIstDayFilter;
exports.istHourRange = istHourRange;
exports.IST_TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const IST_WEEKDAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];
function istYmd(date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: exports.IST_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    return {
        y: Number(parts.find((p) => p.type === 'year').value),
        m: Number(parts.find((p) => p.type === 'month').value),
        d: Number(parts.find((p) => p.type === 'day').value),
    };
}
function startOfIstDay(date = new Date()) {
    const { y, m, d } = istYmd(date);
    return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
}
function endOfIstDay(date = new Date()) {
    return new Date(startOfIstDay(date).getTime() + 24 * 60 * 60 * 1000);
}
function istDayRange(date = new Date()) {
    const start = startOfIstDay(date);
    return { start, end: endOfIstDay(date) };
}
function startOfIstMonth(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: exports.IST_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
    }).formatToParts(date);
    const y = Number(parts.find((p) => p.type === 'year').value);
    const m = Number(parts.find((p) => p.type === 'month').value);
    return new Date(Date.UTC(y, m - 1, 1) - IST_OFFSET_MS);
}
function istWeekdayIndex(date = new Date()) {
    const name = new Intl.DateTimeFormat('en-US', {
        timeZone: exports.IST_TIMEZONE,
        weekday: 'long',
    }).format(date);
    return IST_WEEKDAYS.indexOf(name);
}
function startOfIstWeek(date = new Date()) {
    const dayStart = startOfIstDay(date);
    const dow = istWeekdayIndex(date);
    return new Date(dayStart.getTime() - dow * 24 * 60 * 60 * 1000);
}
function daysAgoIst(n, from = new Date()) {
    return new Date(startOfIstDay(from).getTime() - n * 24 * 60 * 60 * 1000);
}
exports.startOfUtcDay = startOfIstDay;
function daysAgo(n) {
    return daysAgoIst(n);
}
function orderIstDayFilter(opts) {
    if (!opts.today && !opts.yesterday)
        return undefined;
    const dayStart = startOfIstDay();
    const yesterdayStart = daysAgoIst(1);
    if (opts.today) {
        return {
            OR: [
                { createdAt: { gte: dayStart } },
                { paidAt: { gte: dayStart } },
            ],
        };
    }
    return {
        OR: [
            { createdAt: { gte: yesterdayStart, lt: dayStart } },
            { paidAt: { gte: yesterdayStart, lt: dayStart } },
        ],
    };
}
exports.merchantOrderDayFilter = orderIstDayFilter;
function istHourRange(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: exports.IST_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
    }).formatToParts(date);
    const y = Number(parts.find((p) => p.type === 'year').value);
    const m = Number(parts.find((p) => p.type === 'month').value);
    const d = Number(parts.find((p) => p.type === 'day').value);
    const h = Number(parts.find((p) => p.type === 'hour').value);
    const start = new Date(Date.UTC(y, m - 1, d, h) - IST_OFFSET_MS);
    return { start, end: new Date(start.getTime() + 60 * 60 * 1000) };
}
//# sourceMappingURL=ist-day.util.js.map