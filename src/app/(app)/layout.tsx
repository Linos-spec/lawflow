import { SessionProvider } from "@/components/providers/session-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
