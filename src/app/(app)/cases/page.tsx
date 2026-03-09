import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";

export default function CasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cases</h1>
          <p className="text-muted-foreground">Manage your legal cases</p>
        </div>
        <Link
          href="/cases/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Case
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center">
        <Briefcase className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No cases yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by creating your first case.
        </p>
      </div>
    </div>
  );
}
