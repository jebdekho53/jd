-- Allow many master location cities to map to one operational city (e.g. delhi-ncr).

DROP INDEX IF EXISTS "location_cities_operational_city_id_key";

CREATE INDEX IF NOT EXISTS "location_cities_operational_city_id_idx" ON "location_cities"("operational_city_id");
