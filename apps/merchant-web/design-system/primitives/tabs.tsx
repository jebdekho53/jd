'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface TabsContextValue {
  activeTab: string;
  setTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsCtx() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs context missing');
  return ctx;
}

interface TabsProps {
  value: string;
  onValueChange: (v: string) => void;
  children: ReactNode;
}

export function Tabs({ value, onValueChange, children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ activeTab: value, setTab: onValueChange }}>
      {children}
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex gap-1 rounded-lg bg-slate-100 p-1', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  const { activeTab, setTab } = useTabsCtx();
  return (
    <button
      type="button"
      onClick={() => setTab(value)}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        activeTab === value
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-600 hover:text-slate-900',
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: ReactNode }) {
  const { activeTab } = useTabsCtx();
  if (activeTab !== value) return null;
  return <>{children}</>;
}
