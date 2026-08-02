'use client';

import { useState } from 'react';
import { useStoreStore } from '@/store/store-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/primitives';
import { NewBillForm } from './new-bill-form';
import { BillHistoryTable } from './bill-history-table';
import { BillCustomersTable } from './bill-customers-table';

export function MerchantBillingContent() {
  const { currentStore } = useStoreStore();
  const storeId = currentStore?.id;
  const [tab, setTab] = useState('new');

  if (!storeId) {
    return <p className="text-sm text-slate-500">Select a store to create in-store bills.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Ring up a walk-in customer against your existing catalog — stock decrements the same way as a single
        offline-sale record, and the customer&apos;s phone number is saved so you can build a local customer
        list over time.
      </p>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="new">New Bill</TabsTrigger>
          <TabsTrigger value="history">Bill History</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <div className="mt-4">
            <NewBillForm storeId={storeId} onDone={() => setTab('history')} />
          </div>
        </TabsContent>
        <TabsContent value="history">
          <div className="mt-4">
            <BillHistoryTable storeId={storeId} />
          </div>
        </TabsContent>
        <TabsContent value="customers">
          <div className="mt-4">
            <BillCustomersTable storeId={storeId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
