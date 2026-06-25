import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class KnowledgeBaseService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query?: string, category?: string, audience?: string) {
    const where: Prisma.HelpArticleWhereInput = { isPublished: true };
    if (category) where.category = category;
    if (audience) where.audience = audience as never;
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { body: { contains: query, mode: 'insensitive' } },
      ];
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
