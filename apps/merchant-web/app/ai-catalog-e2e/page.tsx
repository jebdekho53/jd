import { notFound } from 'next/navigation';
import { ToastProvider } from '@/design-system/primitives';
import { AiCatalogStudio } from '@/features/products/components/ai-catalog-studio';

/**
 * TEST-ONLY harness route for the AI Catalog v2 Playwright flow. It is inert in
 * every real environment: it 404s unless NEXT_PUBLIC_AI_CATALOG_E2E === '1',
 * which is only set when running the mocked E2E. It exists so the studio
 * component can be driven end-to-end with all network mocked; it is NOT linked
 * from any navigation and ships no product surface.
 */
export default function AiCatalogE2EHarness() {
  if (process.env.NEXT_PUBLIC_AI_CATALOG_E2E !== '1') notFound();
  return (
    <ToastProvider>
      <main className="mx-auto max-w-4xl p-6">
        <AiCatalogStudio storeId="store-e2e" />
      </main>
    </ToastProvider>
  );
}
