import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { SalesAssistant } from "@/components/marketing/sales-assistant";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingNavbar />
      <main>{children}</main>
      <MarketingFooter />
      <SalesAssistant />
    </>
  );
}
