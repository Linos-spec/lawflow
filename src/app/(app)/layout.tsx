import { SessionProvider } from "@/components/providers/session-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen" style={{ background: "var(--bg-base)" }}>
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-6">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
