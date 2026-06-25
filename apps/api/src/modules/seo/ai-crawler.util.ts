import { AiCrawlerType } from '@prisma/client';

const CRAWLER_PATTERNS: Array<{ type: AiCrawlerType; patterns: RegExp[] }> = [
  { type: AiCrawlerType.CHATGPT, patterns: [/ChatGPT-User/i, /GPTBot/i] },
  { type: AiCrawlerType.OPENAI, patterns: [/OpenAI/i] },
  { type: AiCrawlerType.GEMINI, patterns: [/Google-Extended/i, /Gemini/i] },
  { type: AiCrawlerType.GOOGLE_AI, patterns: [/Googlebot/i, /Google-InspectionTool/i] },
  { type: AiCrawlerType.PERPLEXITY, patterns: [/PerplexityBot/i] },
  { type: AiCrawlerType.CLAUDE, patterns: [/ClaudeBot/i, /anthropic/i] },
  { type: AiCrawlerType.BING_AI, patterns: [/bingbot/i, /BingPreview/i] },
];

export function detectCrawlerType(userAgent: string | undefined): AiCrawlerType | null {
  if (!userAgent) return null;
  for (const { type, patterns } of CRAWLER_PATTERNS) {
    if (patterns.some((p) => p.test(userAgent))) return type;
  }
  return null;
}

export function parseEntityFromPath(path: string): { type: string; id?: string } | null {
  const cityMatch = path.match(/^\/city\/([^/]+)(?:\/([^/]+))?/);
  if (cityMatch) {
    return cityMatch[2]
      ? { type: 'city_category', id: `${cityMatch[1]}/${cityMatch[2]}` }
      : { type: 'city', id: cityMatch[1] };
  }
  const storeMatch = path.match(/^\/store\/([^/]+)/);
  if (storeMatch) return { type: 'store', id: storeMatch[1] };
  const categoryMatch = path.match(/^\/category\/([^/]+)/);
  if (categoryMatch) return { type: 'category', id: categoryMatch[1] };
  const brandMatch = path.match(/^\/brand\/([^/]+)/);
  if (brandMatch) return { type: 'brand', id: brandMatch[1] };
  return null;
}
