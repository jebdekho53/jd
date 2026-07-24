'use client';

import { useQuery } from '@tanstack/react-query';
import { listSupportArticles } from '@/lib/api';
import { CaptainPageShell, Panel } from '@/features/rider/captain-page-shell';
import { QueryList } from '@/design-system/primitives';

const modules = [
  ['Order pickup SOP', 'Verify order number, seal, and item count before pickup.'],
  ['COD handling', 'Collect exact amount, keep cash separate, and submit COD on time.'],
  ['Customer handoff', 'Confirm address, be polite, and mark delivered only after handoff.'],
  ['Safety', 'Do not speed. Pause deliveries if weather or road conditions are unsafe.'],
];

export default function TrainingPage() {
  const articles = useQuery({ queryKey: ['rider', 'support', 'articles'], queryFn: () => listSupportArticles() });
  return (
    <CaptainPageShell title="Training" subtitle="Captain playbooks and help articles.">
      <Panel title="Core modules">
        <ul className="space-y-2">
          {modules.map(([title, body]) => (
            <li key={title} className="rounded-xl bg-white/5 p-3 text-sm text-rider-text">
              <b>{title}</b>
              <p className="text-rider-muted">{body}</p>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Help articles">
        <QueryList query={articles} empty="No help articles published yet." errorTitle="Could not load help articles">
          {(items) => (
            <ul className="space-y-2">
              {items.slice(0, 8).map((article) => (
                <li key={article.id} className="rounded-xl bg-white/5 p-3 text-sm text-rider-text">
                  <b>{article.title}</b>
                  {article.summary && <p className="text-rider-muted">{article.summary}</p>}
                </li>
              ))}
            </ul>
          )}
        </QueryList>
      </Panel>
    </CaptainPageShell>
  );
}
