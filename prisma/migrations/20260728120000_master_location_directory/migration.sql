-- Master Location Directory

CREATE TYPE "DeliveryRegion" AS ENUM ('DELHI_NCR');

CREATE TABLE "location_states" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country_code" TEXT NOT NULL DEFAULT 'IN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_states_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "location_districts" (
    "id" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_districts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "location_cities" (
    "id" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "delivery_region" "DeliveryRegion",
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "operational_city_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_cities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "location_areas" (
    "id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sub_area" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_areas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "location_pincodes" (
    "id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "area_id" TEXT,
    "post_office" TEXT,
    "sub_area" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "delivery_region" "DeliveryRegion" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_pincodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "location_aliases" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "state_id" TEXT,
    "district_id" TEXT,
    "city_id" TEXT,
    "area_id" TEXT,
    "pincode_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_aliases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "location_states_code_key" ON "location_states"("code");
CREATE UNIQUE INDEX "location_states_slug_key" ON "location_states"("slug");
CREATE INDEX "location_states_is_active_idx" ON "location_states"("is_active");

CREATE UNIQUE INDEX "location_districts_state_id_slug_key" ON "location_districts"("state_id", "slug");
CREATE INDEX "location_districts_state_id_is_active_idx" ON "location_districts"("state_id", "is_active");

CREATE UNIQUE INDEX "location_cities_district_id_slug_key" ON "location_cities"("district_id", "slug");
CREATE UNIQUE INDEX "location_cities_operational_city_id_key" ON "location_cities"("operational_city_id");
CREATE INDEX "location_cities_state_id_is_active_idx" ON "location_cities"("state_id", "is_active");
CREATE INDEX "location_cities_delivery_region_is_active_idx" ON "location_cities"("delivery_region", "is_active");

CREATE UNIQUE INDEX "location_areas_city_id_slug_key" ON "location_areas"("city_id", "slug");
CREATE INDEX "location_areas_city_id_is_active_idx" ON "location_areas"("city_id", "is_active");

CREATE UNIQUE INDEX "location_pincodes_pincode_post_office_key" ON "location_pincodes"("pincode", "post_office");
CREATE INDEX "location_pincodes_pincode_idx" ON "location_pincodes"("pincode");
CREATE INDEX "location_pincodes_city_id_is_active_idx" ON "location_pincodes"("city_id", "is_active");
CREATE INDEX "location_pincodes_area_id_idx" ON "location_pincodes"("area_id");
CREATE INDEX "location_pincodes_delivery_region_is_active_idx" ON "location_pincodes"("delivery_region", "is_active");

CREATE UNIQUE INDEX "location_aliases_slug_key" ON "location_aliases"("slug");
CREATE INDEX "location_aliases_normalized_idx" ON "location_aliases"("normalized");
CREATE INDEX "location_aliases_is_active_idx" ON "location_aliases"("is_active");

ALTER TABLE "location_districts" ADD CONSTRAINT "location_districts_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "location_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_cities" ADD CONSTRAINT "location_cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "location_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_cities" ADD CONSTRAINT "location_cities_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "location_districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_cities" ADD CONSTRAINT "location_cities_operational_city_id_fkey" FOREIGN KEY ("operational_city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "location_areas" ADD CONSTRAINT "location_areas_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "location_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_pincodes" ADD CONSTRAINT "location_pincodes_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "location_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_pincodes" ADD CONSTRAINT "location_pincodes_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "location_districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_pincodes" ADD CONSTRAINT "location_pincodes_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "location_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_pincodes" ADD CONSTRAINT "location_pincodes_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "location_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "location_aliases" ADD CONSTRAINT "location_aliases_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "location_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_aliases" ADD CONSTRAINT "location_aliases_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "location_districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_aliases" ADD CONSTRAINT "location_aliases_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "location_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_aliases" ADD CONSTRAINT "location_aliases_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "location_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_aliases" ADD CONSTRAINT "location_aliases_pincode_id_fkey" FOREIGN KEY ("pincode_id") REFERENCES "location_pincodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "addresses" ADD COLUMN "location_pincode_id" TEXT;
ALTER TABLE "addresses" ADD COLUMN "location_area_id" TEXT;
ALTER TABLE "addresses" ADD COLUMN "location_city_id" TEXT;
ALTER TABLE "stores" ADD COLUMN "location_pincode_id" TEXT;
ALTER TABLE "stores" ADD COLUMN "location_area_id" TEXT;
ALTER TABLE "stores" ADD COLUMN "location_city_id" TEXT;
ALTER TABLE "service_areas" ADD COLUMN "location_area_id" TEXT;

CREATE INDEX "addresses_location_pincode_id_idx" ON "addresses"("location_pincode_id");
CREATE INDEX "addresses_location_city_id_idx" ON "addresses"("location_city_id");
CREATE INDEX "stores_location_pincode_id_idx" ON "stores"("location_pincode_id");
CREATE INDEX "stores_location_city_id_idx" ON "stores"("location_city_id");

ALTER TABLE "addresses" ADD CONSTRAINT "addresses_location_pincode_id_fkey" FOREIGN KEY ("location_pincode_id") REFERENCES "location_pincodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_location_area_id_fkey" FOREIGN KEY ("location_area_id") REFERENCES "location_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_location_city_id_fkey" FOREIGN KEY ("location_city_id") REFERENCES "location_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stores" ADD CONSTRAINT "stores_location_pincode_id_fkey" FOREIGN KEY ("location_pincode_id") REFERENCES "location_pincodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stores" ADD CONSTRAINT "stores_location_area_id_fkey" FOREIGN KEY ("location_area_id") REFERENCES "location_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stores" ADD CONSTRAINT "stores_location_city_id_fkey" FOREIGN KEY ("location_city_id") REFERENCES "location_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_areas" ADD CONSTRAINT "service_areas_location_area_id_fkey" FOREIGN KEY ("location_area_id") REFERENCES "location_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
