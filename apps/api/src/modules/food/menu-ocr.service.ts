import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MenuOcrStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { OpenAiVisionClient } from '../product/openai-vision.client';
import { MenuService } from './menu.service';
import { slugifyMenu } from './vertical.constants';

const MENU_OCR_PROMPT = `You are a restaurant menu OCR assistant for an Indian food delivery platform.

Extract menu structure from the uploaded printed menu image. Return strict JSON only.

Schema:
{
  "categories": [
    {
      "name": "",
      "items": [
        {
          "name": "",
          "description": "",
          "price": null,
          "dietType": "VEG",
          "prepTimeMins": null,
          "servingSize": null
        }
      ]
    }
  ],
  "confidence": 0
}

Rules:
- dietType: VEG, NON_VEG, or EGG — only if clearly indicated (green dot, egg icon, etc.)
- Do NOT invent ingredients or descriptions not visible on menu
- price: only if clearly printed; null if unreadable
- prepTimeMins: only if printed on menu
- Return JSON only`;

@Injectable()
export class MenuOcrService {
  private readonly logger = new Logger(MenuOcrService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vision: OpenAiVisionClient,
    private readonly menu: MenuService,
    private readonly config: ConfigService,
  ) {}

  async uploadMenuForOcr(merchantProfileId: string, storeId: string, imageUrl: string) {
    await this.menu.assertStoreOwnership(merchantProfileId, storeId);

    const job = await this.prisma.menuOcrJob.create({
      data: { storeId, imageUrl, status: MenuOcrStatus.UPLOADED },
    });

    void this.processJob(job.id).catch((err) => {
      this.logger.error(`Menu OCR failed for ${job.id}: ${err}`);
    });

    return job;
  }

  private async processJob(jobId: string) {
    const job = await this.prisma.menuOcrJob.findUnique({ where: { id: jobId } });
    if (!job) return;

    await this.prisma.menuOcrJob.update({
      where: { id: jobId },
      data: { status: MenuOcrStatus.PROCESSING },
    });

    try {
      if (!this.config.get<string>('OPENAI_API_KEY')) {
        throw new ServiceUnavailableException('AI not configured');
      }

      const extracted = await this.vision.analyzeWithCustomPrompt(job.imageUrl, MENU_OCR_PROMPT);
      await this.prisma.menuOcrJob.update({
        where: { id: jobId },
        data: {
          status: MenuOcrStatus.DRAFT_READY,
          extractedJson: extracted as Prisma.InputJsonValue,
          draftMenuJson: extracted as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      await this.prisma.menuOcrJob.update({
        where: { id: jobId },
        data: {
          status: MenuOcrStatus.FAILED,
          errorMessage: err instanceof Error ? err.message : 'OCR failed',
        },
      });
    }
  }

  async publishDraftMenu(merchantProfileId: string, storeId: string, jobId: string) {
    await this.menu.assertStoreOwnership(merchantProfileId, storeId);
    const job = await this.prisma.menuOcrJob.findFirst({
      where: { id: jobId, storeId, status: MenuOcrStatus.DRAFT_READY },
    });
    if (!job || !job.draftMenuJson) {
      throw new ServiceUnavailableException('Draft menu not ready');
    }

    const draft = job.draftMenuJson as {
      categories?: {
        name: string;
        items?: {
          name: string;
          description?: string;
          price?: number;
          dietType?: string;
          prepTimeMins?: number;
          servingSize?: string;
        }[];
      }[];
    };

    for (const [ci, cat] of (draft.categories ?? []).entries()) {
      const category = await this.menu.createCategory(merchantProfileId, storeId, {
        name: cat.name,
        slug: slugifyMenu(cat.name),
        sortOrder: ci,
      });

      for (const item of cat.items ?? []) {
        if (!item.name || item.price == null) continue;
        await this.menu.createMenuItem(merchantProfileId, storeId, {
          categoryId: category.id,
          name: item.name,
          description: item.description,
          basePrice: item.price,
          dietType: (item.dietType as 'VEG' | 'NON_VEG' | 'EGG') ?? 'VEG',
          prepTimeMins: item.prepTimeMins,
          servingSize: item.servingSize,
        });
      }
    }

    return this.prisma.menuOcrJob.update({
      where: { id: jobId },
      data: { status: MenuOcrStatus.PUBLISHED },
    });
  }

  async getJob(merchantProfileId: string, storeId: string, jobId: string) {
    await this.menu.assertStoreOwnership(merchantProfileId, storeId);
    const job = await this.prisma.menuOcrJob.findFirst({ where: { id: jobId, storeId } });
    if (!job) throw new ServiceUnavailableException('OCR job not found');
    return job;
  }
}
