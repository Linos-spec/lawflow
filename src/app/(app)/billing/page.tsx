import Link from "next/link";
import { DollarSign, Plus } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">Manage invoices and billing records</p>
        </div>
        <Link
          href="/billing/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center">
        <DollarSign className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No invoices yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your first invoice to start billing.
        </p>
      </div>
    </div>
  );
}
