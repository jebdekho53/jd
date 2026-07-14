import type { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileNav } from './mobile-nav';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Desktop sidebar — hidden on phones/tablets, replaced by the drawer below. */}
      <div className="hidden flex-shrink-0 lg:flex">
        <Sidebar />
      </div>
      {/* Mobile slide-in drawer (rendered on top; toggled from the Topbar hamburger). */}
      <MobileNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
