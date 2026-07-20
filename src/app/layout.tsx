import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linos Legal — Practice Management for Law Firms",
  description: "AI-powered legal practice management — part of the Linoscore suite.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
