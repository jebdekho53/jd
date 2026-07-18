-- Records a merchant declaring they are NOT GST-registered (below the s.22
-- threshold). A null gst_number alone cannot distinguish "answered: no GST"
-- from "not filled in yet", which left unregistered merchants permanently
-- short of 100% on the onboarding checklist.
ALTER TABLE "merchant_profiles" ADD COLUMN "gst_exempt_declared_at" TIMESTAMP(3);
