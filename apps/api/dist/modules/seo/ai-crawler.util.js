"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectCrawlerType = detectCrawlerType;
exports.parseEntityFromPath = parseEntityFromPath;
const client_1 = require("@prisma/client");
const CRAWLER_PATTERNS = [
    { type: client_1.AiCrawlerType.CHATGPT, patterns: [/ChatGPT-User/i, /GPTBot/i] },
    { type: client_1.AiCrawlerType.OPENAI, patterns: [/OpenAI/i] },
    { type: client_1.AiCrawlerType.GEMINI, patterns: [/Google-Extended/i, /Gemini/i] },
    { type: client_1.AiCrawlerType.GOOGLE_AI, patterns: [/Googlebot/i, /Google-InspectionTool/i] },
    { type: client_1.AiCrawlerType.PERPLEXITY, patterns: [/PerplexityBot/i] },
    { type: client_1.AiCrawlerType.CLAUDE, patterns: [/ClaudeBot/i, /anthropic/i] },
    { type: client_1.AiCrawlerType.BING_AI, patterns: [/bingbot/i, /BingPreview/i] },
];
function detectCrawlerType(userAgent) {
    if (!userAgent)
        return null;
    for (const { type, patterns } of CRAWLER_PATTERNS) {
        if (patterns.some((p) => p.test(userAgent)))
            return type;
    }
    return null;
}
function parseEntityFromPath(path) {
    const cityMatch = path.match(/^\/city\/([^/]+)(?:\/([^/]+))?/);
    if (cityMatch) {
        return cityMatch[2]
            ? { type: 'city_category', id: `${cityMatch[1]}/${cityMatch[2]}` }
            : { type: 'city', id: cityMatch[1] };
    }
    const storeMatch = path.match(/^\/store\/([^/]+)/);
    if (storeMatch)
        return { type: 'store', id: storeMatch[1] };
    const categoryMatch = path.match(/^\/category\/([^/]+)/);
    if (categoryMatch)
        return { type: 'category', id: categoryMatch[1] };
    const brandMatch = path.match(/^\/brand\/([^/]+)/);
    if (brandMatch)
        return { type: 'brand', id: brandMatch[1] };
    return null;
}
//# sourceMappingURL=ai-crawler.util.js.map