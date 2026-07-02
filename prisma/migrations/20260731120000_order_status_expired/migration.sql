-- Auto-expiry for unpaid (non-COD) orders marks them EXPIRED (soft cancel).
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
