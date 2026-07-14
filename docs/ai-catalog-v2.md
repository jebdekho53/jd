# AI Product Cataloging v2

Async, queue-driven AI cataloging + image generation for JebDekho. Extracts the
full product attribute surface, matches the deepest eligible category, generates
faithful e-commerce images, and normalizes approved attributes into an EAV layer
built for 1M+ products. Runs **alongside** the existing synchronous v1 flow and
stays **dormant behind a feature flag** until explicitly enabled.

> ⚠️ **This is additive.** v1 (`/merchant/stores/:storeId/products/ai/*`) is
> untouched and keeps working. Nothing in v2 executes until `feature.enabled` is
> turned on in `ai_catalog_settings` (or `AI_CATALOG_V2_ENABLED=true`), and jobs
> only run when the dedicated worker process is started.

---

## 1. Architecture

```
Merchant browser
   │  upload (data URL)
   ▼
Next.js BFF  ──►  NestJS API  ── validate+optimize (sharp) ─► AIProductAnalysis(QUEUED)
   ▲                  │                                            │
   │  WS /ai-catalog  │  enqueue (idempotent + ledger)            │
   │  + poll /jobs    ▼                                            ▼
   │            Redis (BullMQ)                              Postgres (ledger)
   │             ├── ai-product:analysis  ─┐
   │             ├── ai-product:image      │   consumed by
   │             ├── ai-product:moderation │  ┌───────────────────────────┐
   │             └── ai-product:retry      └─►│  AI Catalog Worker process │
   │                                          │  (PM2: ai-catalog-worker)  │
   └──────── Redis pub/sub (progress) ◄───────┤  analysis/image/mod/retry  │
                                              └───────────────────────────┘
                                                        │ OpenAI (vision + images)
```

- **API process** produces jobs, serves REST, hosts the WS gateway. It does
  **not** run processors.
- **Worker process** (`apps/api/src/ai-catalog-worker.ts`) runs the four BullMQ
  processors. Scale horizontally by running more instances.
- **Postgres is the source of truth.** `AIProductJob` mirrors every BullMQ job so
  the admin monitor and re-drive survive a Redis flush. WS is best-effort; the UI
  re-polls `/jobs/:id` after reconnect.

### Data model (migration `20260713000000_ai_catalog_v2_eav_images_jobs`)
- **EAV**: `AttributeGroup`, `AttributeDefinition`, `AttributeOption`,
  `CategoryAttributeDefinition`, `ProductAttribute`, `UnitDefinition`,
  `ProductAttributeHistory`. New attributes/categories need **no migration**.
- **Images**: `AIProductImageAsset` — versioned, `cacheKey`-deduped, per-asset
  prompt/provider/model/cost/latency/approval/metadata.
- **Jobs**: `AIProductJob` — durable ledger, idempotency-keyed, moderation fields.
- **Config**: `AICatalogSetting` (key/value), `AICatalogPromptVersion` (versioned,
  auditable prompts).
- Enum additions on `AIProductAnalysisStatus`: `QUEUED`, `MODERATION_HOLD`.

---

## 2. Environment variables

| Var | Default | Purpose |
|-----|---------|---------|
| `AI_CATALOG_V2_ENABLED` | `false` | Fallback feature flag (DB `feature.enabled` overrides). |
| `REDIS_URL` | `redis://127.0.0.1:6379` | BullMQ + progress pub/sub (already required). |
| `BULLMQ_PREFIX` | `jebdekho:bull` | Redis key prefix for queues. |
| `OPENAI_API_KEY` | — | Vision + image generation. Without it, v2 reports unavailable. |
| `OPENAI_VISION_MODEL` | `gpt-4o` | Vision model. |
| `OPENAI_IMAGE_MODEL` | `gpt-image-1` | Image model. |
| `OPENAI_IMAGE_SIZE` | `1024x1024` | Base render size. |
| `OPENAI_VISION_COST_PAISE` | `40` | Cost attribution per analysis. |
| `OPENAI_IMAGE_COST_PAISE` | `150` | Cost attribution per image. |
| `AI_CATALOG_ANALYSIS_PAISE` | `150` | Merchant charge on product creation. |
| `AI_CATALOG_DAILY_LIMIT` | `200` | Daily analyses per merchant. |
| `UPLOAD_DIR` / `UPLOAD_PUBLIC_URL` | existing | Image storage (reused from v1). |
| `REMBG_PYTHON` / `REMBG_SCRIPT` | existing | Local background removal (reused). |

All pricing/threshold/model values are **also** overridable at runtime via the
admin API (`ai_catalog_settings`), which takes precedence over env.

---

## 3. Deployment order

> **Do NOT run migrations against production without staging validation.** The
> repo's `DATABASE_URL` currently points at `jebdekho_prod`.

1. **Staging DB first**
   ```bash
   # point DATABASE_URL at staging, then:
   pnpm db:generate
   pnpm exec prisma migrate deploy   # applies 20260713000000_ai_catalog_v2_...
   pnpm db:seed:ai-catalog           # units, groups, starter attribute taxonomy
   ```
2. **Build**
   ```bash
   pnpm --filter @jebdekho/api build   # emits dist/main.js + dist/ai-catalog-worker.js
   ```
3. **Start the worker** (keep flag OFF — no jobs will be produced yet)
   ```bash
   pm2 start deploy/ecosystem.config.js --only jebdekho-ai-catalog-worker
   pm2 save
   ```
4. **Smoke test** with the flag on for an internal store only, then enable
   globally via admin: `POST /admin/ai-catalog/config { "key":"feature.enabled","value":true }`.
5. **Production**: repeat 1–3 against prod during a maintenance window, keep flag
   OFF, verify `pm2 logs jebdekho-ai-catalog-worker`, then enable.

### Rollback
- **Disable instantly** (no deploy): `feature.enabled=false`. New work stops
  being produced; the studio shows "not enabled".
- **Stop workers**: `pm2 stop jebdekho-ai-catalog-worker`. In-flight jobs drain
  first (graceful shutdown); un-started jobs remain queued.
- **Full revert**: redeploy the previous API build (the module import is inert
  with the flag off). The migration is **additive** — no rollback of schema is
  required; if you must, drop the new tables/enums (data-loss, v1 unaffected).

### Queue draining (safe restart / deploy of workers)
`pm2 reload jebdekho-ai-catalog-worker` sends SIGTERM → `app.close()` waits for
active jobs to finish (up to `kill_timeout`), then closes Redis. Jobs still
waiting stay in Redis and resume on the new process. No job is lost mid-flight;
a killed job is retried (idempotent) by BullMQ.

---

## 4. Safety & correctness guarantees

- **Idempotent enqueue** — one durable ledger row per unit of work; duplicate
  enqueues collapse (`AiCatalogQueueService.upsertLedger`).
- **No double billing** — image debits are idempotency-keyed by `imageAssetId`;
  a retry returns `charged:false`. Charge happens **after** a successful render.
- **Refund only on irrecoverable failure** — a dead-lettered paid render triggers
  `refundForImage` (idempotent). Cache hits are never charged.
- **No-overwrite** — a merchant-verified `ProductAttribute` is never clobbered by
  a later AI run.
- **Never invent enums** — unknown ENUM/MULTI_SELECT option values are rejected.
- **Never invent categories** — matching is only against the store-eligible tree;
  low-confidence/low-margin results require merchant confirmation. The full
  AI-suggested tree is preserved for audit.
- **Prompt-injection resistant** — label OCR text is treated as data, never
  instructions; the vision prompt fixes the schema and forbids placeholder text.
- **Image fidelity** — prompts hard-constrain brand/label/shape/color/quantity;
  synthetic-geometry outputs (`angle_45`, `lifestyle`, `infographic`) are flagged
  in metadata. A single-front photo never fabricates a real 45° geometry.
- **Upload hardening** — MIME + decoded-format check, min dimensions, pixel/byte
  ceilings (decompression bombs), EXIF stripped, SSRF-safe local-only reads.
- **Cross-merchant isolation** — WS clients auto-join only their own
  `ai:merchant:<id>` room; ownership is re-checked server-side on every route.

---

## 5. Manual QA checklist

Prereq: staging DB migrated + seeded, worker running, `OPENAI_API_KEY` set,
`feature.enabled=true`, merchant AI wallet funded.

- [ ] **Flag off** → merchant studio shows "not enabled"; `analyze` returns 503
      `AI_CATALOG_DISABLED`. v1 modal still works.
- [ ] **Upload** a clear packaged product → job goes QUEUED→PROCESSING→COMPLETED;
      progress bar advances; attributes + deepest category candidates render.
- [ ] **Source badges** show On-label vs AI-guess correctly.
- [ ] **Category** auto-selects for a confident match; a vague image requires
      manual confirmation.
- [ ] **Default images** (main, transparent PNG, hero) appear; transparent PNG has
      real transparency; brand/label unchanged.
- [ ] **On-demand** lifestyle/infographic/social generate; cost preview shown;
      wallet debited once per new render.
- [ ] **Cache** — regenerate the same output without force → free, no new render;
      with force → new **version**, prior version retained.
- [ ] **Confirm** as draft → product created inactive; as publish → active.
      Approved attributes appear as `ProductAttribute` rows; history recorded.
- [ ] **Wallet** debited exactly `analysisPaise` on confirm; re-confirm doesn't
      double-charge.
- [ ] **Moderation** — upload a medicine/supplement-with-unreadable-label →
      status MODERATION_HOLD; appears in admin moderation; approve → COMPLETED.
- [ ] **Failure/refund** — force an image failure (e.g. bad `OPENAI_API_KEY`
      briefly) → asset FAILED after retries; any charge refunded.
- [ ] **Retry** — admin re-drives a failed job; it re-runs.
- [ ] **Worker restart** mid-job (`pm2 reload`) → job completes or safely retries;
      no double charge; ledger consistent.
- [ ] **WS reconnect** — reload the studio mid-job → progress recovers via polling.
- [ ] **Cross-merchant** — a second merchant never sees the first's progress/assets.
- [ ] **Admin** — queue health counts update; feature toggle works; per-output
      pricing/thresholds/prompt versions persist and take effect.

---

## 6. Commands

```bash
# Migration (staging/prod via your normal deploy — never ad-hoc on prod)
pnpm exec prisma migrate deploy
pnpm db:seed:ai-catalog

# Build + run worker
pnpm --filter @jebdekho/api build
pnpm --filter @jebdekho/api worker:ai-catalog          # prod
pnpm --filter @jebdekho/api worker:ai-catalog:dev      # watch mode
pm2 start deploy/ecosystem.config.js --only jebdekho-ai-catalog-worker

# Tests (no real OpenAI / wallet / publish)
pnpm --filter @jebdekho/api test -- src/modules/ai-catalog
```

---

## 7. Known limitations

- **`gpt-image-1` constraints**: no true "8K" (we never advertise a resolution we
  don't render); a genuine 45° view from a single front photo is intentionally
  **not** offered (it would fabricate geometry and risk changing shape/label).
  `alternate_background`/`angle_45` on-demand outputs are AI-styled and flagged.
- **Integration/E2E against a live Redis** and **UI E2E (Playwright)** are speced
  in the QA checklist but not automated here; unit coverage is comprehensive
  (category match, EAV mapping/validation, cache keys, idempotency, billing/
  refund, backoff, prompt building, moderation). Add a `test-redis` integration
  suite in CI before GA.
- **Attribute auto-approval** defaults to ≥0.90 confidence; tune per category via
  admin before relying on unattended normalization.
- **Moderation** is a deterministic first pass (restricted keywords + confidence);
  it routes to humans rather than auto-rejecting. Extend `RESTRICTED_KEYWORDS`
  and thresholds as policy evolves.
```
