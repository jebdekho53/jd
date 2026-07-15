'use client';

import { useQuery } from '@tanstack/react-query';
import { listSupportArticles } from '@/lib/api';
import { CaptainPageShell, Panel } from '@/features/rider/captain-page-shell';

const modules = [
  ['Order pickup SOP', 'Verify order number, seal, and item count before pickup.'],
  ['COD handling', 'Collect exact amount, keep cash separate, and submit COD on time.'],
  ['Customer handoff', 'Confirm address, be polite, and mark delivered only after handoff.'],
  ['Safety', 'Do not speed. Pause deliveries if weather or road conditions are unsafe.'],
];

export default function TrainingPage() {
  const articles = useQuery({ queryKey: ['rider', 'support', 'articles'], queryFn: listSupportArticles });
  return (
    <CaptainPageShell title="Training" subtitle="Captain playbooks and help articles.">
      <Panel title="Core modules">
        <ul className="space-y-2">
          {modules.map(([title, body]) => (
            <li key={title} className="rounded-lg bg-slate-100 p-3 text-sm">
              <b>{title}</b>
              <p className="text-slate-600">{body}</p>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Help articles">
        <ul className="space-y-2">
          {(articles.data ?? []).slice(0, 8).map((article) => (
            <li key={article.id} className="rounded-lg bg-slate-100 p-3 text-sm">
              <b>{article.title}</b>
              {article.summary && <p className="text-slate-600">{article.summary}</p>}
            </li>
          ))}
        </ul>
      </Panel>
    </CaptainPageShell>
  );
}
