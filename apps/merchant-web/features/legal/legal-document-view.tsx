export interface LegalSection {
  heading: string;
  body?: string[];
  list?: string[];
}

export interface LegalDocumentData {
  code: string;
  title: string;
  version: string;
  effectiveDate: string;
  summary: string;
  sections: LegalSection[];
}

/**
 * Renders a legal document served by the API. The words come from the API's
 * registry — the same source the acceptance version is validated against — so
 * what a merchant reads here is provably what they agreed to.
 */
export function LegalDocumentView({ doc }: { doc: LegalDocumentData }) {
  return (
    <article className="prose prose-slate max-w-none prose-headings:font-semibold prose-h2:text-base prose-p:text-sm prose-li:text-sm">
      <header className="not-prose mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900">{doc.title}</h1>
        <p className="mt-1 text-xs text-slate-500">
          Version {doc.version} · Effective {doc.effectiveDate}
        </p>
      </header>

      {doc.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.body?.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
          {section.list && (
            <ul>
              {section.list.map((item) => (
                <li key={item.slice(0, 48)}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
