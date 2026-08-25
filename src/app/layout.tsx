import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linoscore Legal — The AI employee every lawyer wishes they had",
  description: "Linoscore Legal handles client intake, conflict checks, document organization, and follow-up so your firm can focus on practicing law. Part of the Linoscore suite.",
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
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
