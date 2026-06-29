"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugifyOperationalCity = slugifyOperationalCity;
function slugifyOperationalCity(name, state) {
    return `${name}-${state}`
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-');
}
//# sourceMappingURL=geo.util.js.map