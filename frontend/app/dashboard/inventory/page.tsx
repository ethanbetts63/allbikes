'use client';

import InventoryTable from '@/components/InventoryTable';
import { Button } from '@/components/ui/button';
import DepositSettingsPanel from './_components/DepositSettingsPanel';

export default function InventoryManagementPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-dark-primary)]">Inventory</h1>
          <p className="mt-1 text-sm text-[var(--text-dark-secondary)]">
            Manage listings, availability and how stock appears on the website.
          </p>
        </div>
        <Button
          onClick={() => window.location.assign('/dashboard/add-motorcycle')}
          className="mt-2 sm:mt-0"
        >
          Add inventory
        </Button>
      </div>
      <DepositSettingsPanel />
      <InventoryTable />
    </div>
  );
}
