import type { ReactNode } from 'react';

/** Placeholder shell for feature modules — replaced in Phase 2. */
export function FeaturePlaceholder({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {children}
    </div>
  );
}
