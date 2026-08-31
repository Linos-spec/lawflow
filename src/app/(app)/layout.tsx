import { SessionProvider } from "@/components/providers/session-provider";
import { FirmProvider } from "@/components/providers/firm-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AiChatWrapper } from "@/components/ai/chat-wrapper";
import { BillingGate } from "@/components/billing/billing-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FirmProvider>
        <BillingGate>
          <div className="flex h-screen" style={{ background: "var(--bg-base)" }}>
            <AppSidebar />
            <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden">
              {/* Responsive gutters (16/24/32) + top clearance for the mobile top
                  bar, and bottom padding so content clears the floating AI launcher. */}
              <div
                className="mx-auto px-4 pt-20 pb-28 md:px-6 md:pt-6 lg:px-8 lg:pt-8"
                style={{ maxWidth: 1440 }}
              >
                {children}
              </div>
            </main>
            <AiChatWrapper />
          </div>
        </BillingGate>
      </FirmProvider>
    </SessionProvider>
  );
}
