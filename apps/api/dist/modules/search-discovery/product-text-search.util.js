"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProductTextSearchWhere = buildProductTextSearchWhere;
function buildProductTextSearchWhere(q) {
    const term = q.trim().toLowerCase();
    return {
        OR: [
            { searchIndex: { searchText: { contains: term }, isActive: true } },
            { name: { contains: term, mode: 'insensitive' } },
            { brand: { contains: term, mode: 'insensitive' } },
        ],
    };
}
//# sourceMappingURL=product-text-search.util.js.map