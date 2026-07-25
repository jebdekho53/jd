-- Desserts/bakery items were being labeled "MILD" spice by the AI item-creation
-- flow for lack of a "not applicable" option, which reads as "a little spicy"
-- to merchants and buyers. Add a genuine NONE value for non-spicy items.
ALTER TYPE "SpiceLevel" ADD VALUE IF NOT EXISTS 'NONE';
