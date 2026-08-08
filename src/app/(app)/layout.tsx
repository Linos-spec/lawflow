import { SessionProvider } from "@/components/providers/session-provider";
import { FirmProvider } from "@/components/providers/firm-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AiChatWrapper } from "@/components/ai/chat-wrapper";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FirmProvider>
        <div className="flex h-screen" style={{ background: "var(--bg-base)" }}>
          <AppSidebar />
          <main className="flex-1 overflow-y-auto">
            {/* Extra bottom padding so page content/actions clear the floating
                "Ask Linoscore AI" button, especially on narrower viewports. */}
            <div className="mx-auto max-w-7xl p-6 pb-28">{children}</div>
          </main>
          <AiChatWrapper />
        </div>
      </FirmProvider>
    </SessionProvider>
  );
}
