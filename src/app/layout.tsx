import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { PwaClient } from "@/components/pwa/pwa-client";

export const metadata: Metadata = {
  title: "Linoscore Legal — The operating system for modern law firms",
  description: "Linoscore Legal handles client intake, conflict checks, document organization, and follow-up so your firm can focus on practicing law. Part of the Linoscore suite.",
  applicationName: "Linoscore Legal",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Linoscore Legal",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1e293b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <PwaClient />
      </body>
    </html>
  );
}
