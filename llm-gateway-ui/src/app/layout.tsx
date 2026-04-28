import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Prism — LLM Gateway",
  description: "LLM cost observability, semantic caching, and intelligent model routing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface text-ink min-h-screen flex">
        <Sidebar />
        <main className="flex-1 ml-56 min-h-screen bg-grid-faint bg-grid">
          {children}
        </main>
      </body>
    </html>
  );
}
