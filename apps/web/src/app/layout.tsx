import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { ShoreStateProvider } from "@/components/shore-state-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "上岸仙岛 · SHORE",
  description: "上传负债，完成今日任务，每天离上岸近一步。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#bde7dc",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <ShoreStateProvider>
          <AppShell>{children}</AppShell>
        </ShoreStateProvider>
      </body>
    </html>
  );
}
