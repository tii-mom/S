"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import type { ReactNode } from "react";

const configuredManifest = process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL;

export function AppProviders({ children }: { children: ReactNode }) {
  const manifestUrl =
    configuredManifest ||
    (typeof window === "undefined"
      ? "https://shore-web-staging.workers.dev/tonconnect-manifest.json"
      : `${window.location.origin}/tonconnect-manifest.json`);

  return <TonConnectUIProvider manifestUrl={manifestUrl}>{children}</TonConnectUIProvider>;
}
