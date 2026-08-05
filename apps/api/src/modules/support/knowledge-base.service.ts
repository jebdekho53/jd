import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

/**
 * Filtered out of search tokens — otherwise a ticket subject like "my payout
 * is delayed" turns into an OR clause on "the"/"is"/"my" that matches nearly
 * every article and drowns out the real signal ("payout", "delayed").
 */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'my', 'your',
  'our', 'their', 'i', 'you', 'we', 'it', 'this', 'that', 'to', 'of', 'in',
  'on', 'for', 'and', 'or', 'not', 'do', 'does', 'did', 'has', 'have', 'had',
  'with', 'from', 'about', 'why', 'how', 'what', 'when',
]);

@Injectable()
export class KnowledgeBaseService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query?: string, category?: string, audience?: string) {
    const where: Prisma.HelpArticleWhereInput = { isPublished: true };
    if (category) where.category = category;
    if (audience) where.audience = audience as never;
    if (query) {
      // `contains` matches only an exact substring, so passing a whole
      // sentence (ticket subject/description) as one filter almost never
      // matches article text — tokenize and OR across significant words
      // instead, so word order/filler words don't break the match.
      const tokens = Array.from(
        new Set(
          query
            .split(/\s+/)
            .map((t) => t.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase())
            .filter((t) => t.length >= 3 && !STOPWORDS.has(t)),
        ),
      ).slice(0, 8);
      const terms = tokens.length > 0 ? tokens : [query];
      where.OR = terms.flatMap((t) => [
        { title: { contains: t, mode: 'insensitive' } },
        { body: { contains: t, mode: 'insensitive' } },
      ]);
    }
    return this.prisma.helpArticle.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      take: 50,
    });
  }

  async getBySlug(slug: string) {
    return this.prisma.helpArticle.findUnique({ where: { slug } });
  }

  async listCategories(audience?: string) {
    const articles = await this.prisma.helpArticle.findMany({
      where: { isPublished: true, ...(audience ? { audience: audience as never } : {}) },
      select: { category: true },
      distinct: ['category'],
    });
    return articles.map((a) => a.category);
  }
}
