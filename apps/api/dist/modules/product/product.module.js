"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModule = void 0;
const common_1 = require("@nestjs/common");
const product_service_1 = require("./product.service");
const category_service_1 = require("./category.service");
const product_controller_1 = require("./product.controller");
const product_csv_controller_1 = require("./product-csv.controller");
const product_csv_service_1 = require("./product-csv.service");
const product_ai_controller_1 = require("./product-ai.controller");
const product_ai_service_1 = require("./product-ai.service");
const product_duplicate_service_1 = require("./product-duplicate.service");
const merchant_ai_billing_service_1 = require("./merchant-ai-billing.service");
const merchant_ai_wallet_service_1 = require("./merchant-ai-wallet.service");
const merchant_ai_wallet_controller_1 = require("./merchant-ai-wallet.controller");
const ai_product_image_service_1 = require("./ai-product-image.service");
const openai_vision_client_1 = require("./openai-vision.client");
const merchant_module_1 = require("../merchant/merchant.module");
const category_governance_module_1 = require("../category-governance/category-governance.module");
const inventory_module_1 = require("../inventory/inventory.module");
const upload_module_1 = require("../upload/upload.module");
const payment_module_1 = require("../payment/payment.module");
let ProductModule = class ProductModule {
};
exports.ProductModule = ProductModule;
exports.ProductModule = ProductModule = __decorate([
    (0, common_1.Module)({
        imports: [
            merchant_module_1.MerchantModule,
            category_governance_module_1.CategoryGovernanceModule,
            inventory_module_1.InventoryModule,
            upload_module_1.UploadModule,
            (0, common_1.forwardRef)(() => payment_module_1.PaymentModule),
        ],
        controllers: [product_controller_1.ProductController, product_csv_controller_1.ProductCsvController, product_ai_controller_1.ProductAiController, merchant_ai_wallet_controller_1.MerchantAiWalletController],
        providers: [
            product_service_1.ProductService,
            category_service_1.CategoryService,
            product_csv_service_1.ProductCsvService,
            product_ai_service_1.ProductAiService,
            product_duplicate_service_1.ProductDuplicateService,
            merchant_ai_billing_service_1.MerchantAiBillingService,
            merchant_ai_wallet_service_1.MerchantAiWalletService,
            ai_product_image_service_1.AiProductImageService,
            openai_vision_client_1.OpenAiVisionClient,
        ],
        exports: [
            product_service_1.ProductService,
            category_service_1.CategoryService,
            product_csv_service_1.ProductCsvService,
            product_ai_service_1.ProductAiService,
            product_duplicate_service_1.ProductDuplicateService,
            merchant_ai_wallet_service_1.MerchantAiWalletService,
            openai_vision_client_1.OpenAiVisionClient,
        ],
    })
], ProductModule);
//# sourceMappingURL=product.module.js.map