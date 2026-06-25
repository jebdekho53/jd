export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Vendor Dashboard</h1>
      <p className="text-sm text-slate-400">
        Manage catalog, fulfill merchant procurement orders, and track settlements.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card title="Catalog" href="/catalog" desc="Products & price tiers" />
        <Card title="Orders" href="/orders" desc="Ship & deliver B2B orders" />
        <Card title="Analytics" href="/dashboard" desc="Performance insights" />
      </div>
    </div>
  );
}

function Card({ title, href, desc }: { title: string; href: string; desc: string }) {
  return (
    <a href={href} className="block rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-violet-600">
      <p className="font-medium text-white">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{desc}</p>
    </a>
  );
}
