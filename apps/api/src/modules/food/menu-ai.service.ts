import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MenuOcrStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { OpenAiVisionClient } from '../product/openai-vision.client';
import { MerchantAiWalletService } from '../product/merchant-ai-wallet.service';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { assertTrustedUploadUrl } from '../../common/utils/trusted-upload-url.util';
import { uploadPublicBases } from '../../common/utils/asset-url.util';
import { getConfig } from '../../config/configuration';

const DISH_PROMPT = `You are a menu cataloging assistant for an Indian food delivery platform.

Look at the photo of ONE prepared dish / bakery item / sweet and return strict JSON only.

Schema:
{
  "name": "",
  "description": "",
  "dietType": "VEG" | "NON_VEG" | "EGG" | "VEGAN",
  "spiceLevel": "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT",
  "prepTimeMins": null,
  "servingSize": "",
  "suggestedPrice": null,
  "sizes": [{ "name": "", "price": null }],
  "confidence": 0
}

Rules:
- name: the dish as a customer would recognise it (e.g. "Chocolate Truffle Pastry").
- description: one appetising sentence, max 160 chars, only what is visible.
- dietType: VEG unless meat/fish/egg is clearly visible. Eggless bakery items are VEG.
- spiceLevel: MILD for bakery, sweets and desserts.
- prepTimeMins: realistic prep estimate in minutes (bakery/counter items 10-15).
- servingSize: e.g. "1 piece", "Serves 2", "250g" — only if reasonably inferable.
- suggestedPrice: typical Indian retail price in rupees, or null if unsure.
- sizes: only when the photo clearly shows multiple sizes; otherwise [].
- confidence: 0-1, how sure you are about the dish identification.
- Never invent allergens, ingredients or brand claims. JSON only.`;

export interface DishAnalysisFields {
  name: string;
  description: string;
  dietType: string;
  spiceLevel: string;
  prepTimeMins: number | null;
  servingSize: string;
  suggestedPrice: number | null;
  sizes: Array<{ name: string; price: number }>;
  confidence: number;
}

/**
 * Single-dish AI for the menu builder — the menu-side twin of ProductAiService.
 * Analysis is free; the merchant is charged the same per-item fee as a grocery
 * product only when they confirm and the menu item is actually created.
 *
 * Analyses are persisted as MenuOcrJob rows so the flow reuses the existing menu
 * AI table instead of the product-only AIProductAnalysis.
 */
@Injectable()
export class MenuAiService {
  private readonly logger = new Logger(MenuAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vision: OpenAiVisionClient,
    private readonly menu: MenuService,
    private readonly wallet: MerchantAiWalletService,
    private readonly config: ConfigService,
  ) {}

  async analyzeDishPhoto(merchantProfileId: string, storeId: string, imageUrl: string) {
    await this.menu.assertStoreOwnership(merchantProfileId, storeId);
    await this.menu.assertMenuAccess(storeId);
    assertTrustedUploadUrl(imageUrl, uploadPublicBases(getConfig(this.config).storage));

    if (!this.config.get<string>('OPENAI_API_KEY')) {
      throw new ServiceUnavailableException(
        'AI menu add is temporarily unavailable. Manual entry is still free.',
      );
    }

    const job = await this.prisma.menuOcrJob.create({
      data: { storeId, imageUrl, status: MenuOcrStatus.PROCESSING },
    });

    try {
      const raw = await this.vision.analyzeWithCustomPrompt(imageUrl, DISH_PROMPT);
      const fields = this.normalize(raw);
      await this.prisma.menuOcrJob.update({
        where: { id: job.id },
        data: {
          status: MenuOcrStatus.DRAFT_READY,
          extractedJson: raw as Prisma.InputJsonValue,
          draftMenuJson: fields as unknown as Prisma.InputJsonValue,
        },
      });
      return {
        jobId: job.id,
        imageUrl,
        fields,
        pricePaise: this.wallet.getProductCostPaise(),
        priceRupee: this.wallet.getProductCostPaise() / 100,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Dish analysis failed';
      await this.prisma.menuOcrJob.update({
        where: { id: job.id },
        data: { status: MenuOcrStatus.FAILED, errorMessage: message },
      });
      this.logger.error(`Menu dish analysis failed for ${job.id}: ${message}`);
      throw new ServiceUnavailableException(
        'Could not analyse this photo. Try a clearer picture or add the dish manually.',
      );
    }
  }

  /**
   * Charge, then create the menu item from the merchant-reviewed draft. Any
   * failure after the debit is refunded so a merchant never pays for an item
   * that does not exist.
   */
  async createItemFromAnalysis(
    merchantProfileId: string,
    storeId: string,
    jobId: string,
    dto: CreateMenuItemDto,
    userId: string,
    ipAddress?: string,
  ) {
    await this.menu.assertStoreOwnership(merchantProfileId, storeId);

    const job = await this.prisma.menuOcrJob.findFirst({
      where: { id: jobId, storeId },
    });
    if (!job) throw new BadRequestException('AI analysis not found');
    if (job.status === MenuOcrStatus.PUBLISHED) {
      throw new BadRequestException('This AI analysis was already used to create an item');
    }

    const charge = await this.wallet.debitForMenuItemCreation(
      merchantProfileId,
      storeId,
      jobId,
      userId,
      ipAddress,
    );

    try {
      const item = await this.menu.createMenuItem(merchantProfileId, storeId, {
        ...dto,
        imageUrls: dto.imageUrls?.length ? dto.imageUrls : [job.imageUrl],
      });
      await this.prisma.menuOcrJob.update({
        where: { id: jobId },
        data: { status: MenuOcrStatus.PUBLISHED },
      });
      return { item, amountPaise: charge.amountPaise, charged: charge.charged };
    } catch (err) {
      await this.wallet.refundMenuItemCreation(
        merchantProfileId,
        storeId,
        jobId,
        'Menu item creation failed after AI charge',
        userId,
        ipAddress,
      );
      throw err;
    }
  }

  private normalize(raw: Record<string, unknown>): DishAnalysisFields {
    const str = (key: string) => {
      const value = raw[key];
      return value == null ? '' : String(value).trim();
    };
    const num = (key: string) => {
      const value = Number(raw[key]);
      return Number.isFinite(value) && value > 0 ? value : null;
    };
    const diet = str('dietType').toUpperCase();
    const spice = str('spiceLevel').toUpperCase();
    const rawSizes = Array.isArray(raw.sizes) ? raw.sizes : [];

    return {
      name: str('name'),
      description: str('description').slice(0, 300),
      dietType: ['VEG', 'NON_VEG', 'EGG', 'VEGAN'].includes(diet) ? diet : 'VEG',
      spiceLevel: ['MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT'].includes(spice) ? spice : 'MILD',
      prepTimeMins: num('prepTimeMins'),
      servingSize: str('servingSize'),
      suggestedPrice: num('suggestedPrice'),
      sizes: rawSizes
        .map((entry) => {
          const size = entry as Record<string, unknown>;
          const price = Number(size?.price);
          return {
            name: size?.name == null ? '' : String(size.name).trim(),
            price: Number.isFinite(price) && price > 0 ? price : 0,
          };
        })
        .filter((size) => size.name && size.price > 0),
      confidence: Number(raw.confidence) || 0,
    };
  }
}
