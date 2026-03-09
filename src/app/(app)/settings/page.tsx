import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your firm settings</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center">
        <Settings className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">Settings</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Firm settings and team management coming soon.
        </p>
      </div>
    </div>
  );
}
