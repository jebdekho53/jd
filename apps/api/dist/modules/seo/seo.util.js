"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SITE_URL = exports.SITE_NAME = void 0;
exports.slugify = slugify;
exports.absoluteUrl = absoluteUrl;
exports.SITE_NAME = 'JebDekho';
exports.DEFAULT_SITE_URL = 'https://jebdekho.com';
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-');
}
function absoluteUrl(path, baseUrl) {
    const base = baseUrl.replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
}
//# sourceMappingURL=seo.util.js.map