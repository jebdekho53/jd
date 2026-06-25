-- P7.5 Corporate & Institutional Commerce

CREATE TYPE "CorporateAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING');
CREATE TYPE "CorporateUserRole" AS ENUM ('ADMIN', 'APPROVER', 'EMPLOYEE');
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "corporate_accounts" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "gstin" TEXT,
    "credit_limit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "CorporateAccountStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "corporate_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "corporate_users" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "CorporateUserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "corporate_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "corporate_wallets" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "corporate_wallets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cost_centers" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_limit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchase_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "order_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "approval_workflows" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "approval_limit" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "corporate_invoices" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_amount" DECIMAL(14,2) NOT NULL,
    "period_start" DATE,
    "period_end" DATE,
    "ledger_journal_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "corporate_invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "corporate_users_account_id_user_id_key" ON "corporate_users"("account_id", "user_id");
CREATE UNIQUE INDEX "corporate_wallets_account_id_key" ON "corporate_wallets"("account_id");
CREATE UNIQUE INDEX "purchase_requests_order_id_key" ON "purchase_requests"("order_id");
CREATE UNIQUE INDEX "corporate_invoices_invoice_number_key" ON "corporate_invoices"("invoice_number");
CREATE INDEX "corporate_users_user_id_idx" ON "corporate_users"("user_id");
CREATE INDEX "purchase_requests_employee_id_status_idx" ON "purchase_requests"("employee_id", "status");

ALTER TABLE "corporate_users" ADD CONSTRAINT "corporate_users_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "corporate_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "corporate_users" ADD CONSTRAINT "corporate_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "corporate_wallets" ADD CONSTRAINT "corporate_wallets_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "corporate_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "corporate_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "corporate_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "corporate_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "corporate_invoices" ADD CONSTRAINT "corporate_invoices_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "corporate_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
