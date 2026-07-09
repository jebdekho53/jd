-- CreateEnum
CREATE TYPE "StoreDeliveryMode" AS ENUM ('PLATFORM', 'SELF');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "delivery_mode" "StoreDeliveryMode" NOT NULL DEFAULT 'PLATFORM',
ADD COLUMN     "merchant_delivery_contribution" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "delivery_mode" "StoreDeliveryMode" NOT NULL DEFAULT 'PLATFORM',
ADD COLUMN     "free_delivery_threshold" DECIMAL(10,2);
