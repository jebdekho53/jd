-- Self-delivering merchants (deliveryMode=SELF) now get the delivery fee the
-- customer pays credited to their payout, instead of delivery being free with
-- nobody compensated. This mirrors merchant_delivery_contribution but in the
-- opposite direction (credit, not deduction).
ALTER TABLE "orders" ADD COLUMN "merchant_delivery_earning" DECIMAL(10,2) NOT NULL DEFAULT 0;
