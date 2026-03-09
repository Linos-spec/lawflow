import {
  Briefcase,
  CalendarClock,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to LawFlow. Your legal practice at a glance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-medium text-muted-foreground">
              Active Cases
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-orange-600" />
            <p className="text-sm font-medium text-muted-foreground">
              Pending Deadlines
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-muted-foreground">
              Overdue Deadlines
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-red-600">0</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-muted-foreground">
              Outstanding Revenue
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold">$0.00</p>
        </div>
      </div>

      {/* Placeholder sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Upcoming Deadlines</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No upcoming deadlines in the next 7 days.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No recent activity to display.
          </p>
        </div>
      </div>
    </div>
  );
}
