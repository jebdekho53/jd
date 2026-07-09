-- Electronics / gadget product fields
ALTER TABLE "products" ADD COLUMN     "model_number" TEXT,
ADD COLUMN     "specifications" JSONB,
ADD COLUMN     "warranty_months" INTEGER;
