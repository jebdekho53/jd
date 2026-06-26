-- Multi-pincode delivery coverage per store

CREATE TABLE "store_delivery_areas" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "delivery_fee" DECIMAL(10,2),
    "minimum_order" DECIMAL(10,2),
    "estimated_minutes" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "location_pincode_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_delivery_areas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "store_delivery_areas_store_id_pincode_key" ON "store_delivery_areas"("store_id", "pincode");
CREATE INDEX "store_delivery_areas_pincode_idx" ON "store_delivery_areas"("pincode");
CREATE INDEX "store_delivery_areas_store_id_is_active_idx" ON "store_delivery_areas"("store_id", "is_active");

ALTER TABLE "store_delivery_areas" ADD CONSTRAINT "store_delivery_areas_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "store_delivery_areas" ADD CONSTRAINT "store_delivery_areas_location_pincode_id_fkey" FOREIGN KEY ("location_pincode_id") REFERENCES "location_pincodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "merchant_applications" ADD COLUMN "delivery_coverage_pincodes" JSONB;

-- Migrate existing store physical pincodes into delivery coverage
INSERT INTO "store_delivery_areas" (
    "id",
    "store_id",
    "pincode",
    "city",
    "state",
    "delivery_fee",
    "minimum_order",
    "estimated_minutes",
    "priority",
    "is_active",
    "location_pincode_id",
    "created_at",
    "updated_at"
)
SELECT
    'sda_' || substr(md5(s."id" || s."pincode"), 1, 24),
    s."id",
    s."pincode",
    lc."name",
    ls."name",
    s."delivery_fee",
    s."min_order_amount",
    s."avg_prep_time_mins",
    0,
    true,
    s."location_pincode_id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "stores" s
LEFT JOIN "location_pincodes" lp ON lp."id" = s."location_pincode_id"
LEFT JOIN "location_cities" lc ON lc."id" = COALESCE(s."location_city_id", lp."city_id")
LEFT JOIN "location_districts" ld ON ld."id" = lc."district_id"
LEFT JOIN "location_states" ls ON ls."id" = ld."state_id"
WHERE s."deleted_at" IS NULL
  AND s."pincode" IS NOT NULL
  AND length(s."pincode") = 6
ON CONFLICT ("store_id", "pincode") DO NOTHING;
