import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linos Legal — The AI employee every lawyer wishes they had",
  description: "Linos Legal handles client intake, conflict checks, document organization, and follow-up so your firm can focus on practicing law. Part of the Linoscore suite.",
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
