-- P2.2 Merchant fulfillment — PACKING order status

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PACKING' AFTER 'PREPARING';
