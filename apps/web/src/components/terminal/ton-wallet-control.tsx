"use client";

import {
  useIsConnectionRestored,
  useTonAddress,
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react";
import type {
  TonProofNonceResponse,
  VerifiedWallet,
  VerifyTonProofRequest,
  VerifyTonProofResponse,
} from "@shore/shared";
import { useCallback, useEffect, useRef, useState } from "react";

import { WalletIcon } from "./terminal-icons";

function shortenAddress(address: string): string {
  return address.length <= 14 ? address : `${address.slice(0, 6)}…${address.slice(-5)}`;
}

export type TonWalletBridge = {
  label: string;
  disabled: boolean;
  connected: boolean;
  verified: boolean;
  openWallet: () => Promise<void>;
};

export function useTonWalletBridge({
  verifiedWallet,
  disabled = false,
  issueNonce,
  bindWallet,
}: {
  verifiedWallet: VerifiedWallet | null;
  disabled?: boolean;
  issueNonce: () => Promise<TonProofNonceResponse>;
  bindWallet: (input: VerifyTonProofRequest) => Promise<VerifyTonProofResponse | null>;
}): TonWalletBridge {
  const [tonConnectUi] = useTonConnectUI();
  const wallet = useTonWallet();
  const friendlyAddress = useTonAddress();
  const connectionRestored = useIsConnectionRestored();
  const [nonceState, setNonceState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [verificationState, setVerificationState] = useState<
    "idle" | "verifying" | "verified" | "error"
  >("idle");
  const verifiedSignatures = useRef(new Set<string>());

  const prepareNonce = useCallback(async () => {
    setNonceState("loading");
    tonConnectUi.setConnectRequestParameters({ state: "loading" });
    try {
      const response = await issueNonce();
      tonConnectUi.setConnectRequestParameters({
        state: "ready",
        value: { tonProof: response.nonce },
      });
      setNonceState("ready");
      return true;
    } catch {
      tonConnectUi.setConnectRequestParameters(null);
      setNonceState("error");
      return false;
    }
  }, [issueNonce, tonConnectUi]);

  useEffect(() => {
    if (connectionRestored && !wallet && nonceState === "idle" && !disabled) {
      void prepareNonce();
    }
  }, [connectionRestored, disabled, nonceState, prepareNonce, wallet]);

  useEffect(() => {
    if (!wallet) {
      setVerificationState("idle");
      return;
    }

    const tonProof = wallet.connectItems?.tonProof;
    if (!tonProof || !("proof" in tonProof)) {
      setVerificationState("error");
      return;
    }

    const signature = tonProof.proof.signature;
    if (verifiedSignatures.current.has(signature)) return;
    verifiedSignatures.current.add(signature);
    setVerificationState("verifying");

    void bindWallet({
      address: wallet.account.address,
      walletStateInit: wallet.account.walletStateInit,
      network: wallet.account.chain,
      walletApp: wallet.device.appName,
      proof: tonProof.proof,
    }).then((result) => {
      setVerificationState(result ? "verified" : "error");
    });
  }, [bindWallet, wallet]);

  const openWallet = useCallback(async () => {
    if (disabled || !connectionRestored) return;
    if (wallet) {
      await tonConnectUi.disconnect();
      verifiedSignatures.current.clear();
      setVerificationState("idle");
      await prepareNonce();
      return;
    }
    const ready = nonceState === "ready" || (await prepareNonce());
    if (ready) await tonConnectUi.openModal();
  }, [connectionRestored, disabled, nonceState, prepareNonce, tonConnectUi, wallet]);

  const visibleAddress = verifiedWallet?.addressFriendly || friendlyAddress;
  const label = !connectionRestored
    ? "RESTORING"
    : verifiedWallet
      ? shortenAddress(verifiedWallet.addressFriendly)
      : wallet && verificationState === "verifying"
        ? "VERIFYING"
        : wallet && verificationState === "error"
          ? "PROOF ERROR"
          : visibleAddress
            ? shortenAddress(visibleAddress)
            : nonceState === "loading"
              ? "PREPARING"
              : "CONNECT";

  return {
    label,
    disabled: disabled || !connectionRestored,
    connected: Boolean(wallet),
    verified: Boolean(verifiedWallet),
    openWallet,
  };
}

export function TonWalletButton({
  bridge,
  compact = false,
  className = "",
}: {
  bridge: TonWalletBridge;
  compact?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`wallet-button${compact ? " wallet-button--compact" : ""}${bridge.verified ? " wallet-button--verified" : ""}${className ? ` ${className}` : ""}`}
      aria-label={bridge.connected ? "断开TON钱包" : "连接TON钱包"}
      disabled={bridge.disabled}
      onClick={() => void bridge.openWallet()}
    >
      <WalletIcon />
      {compact ? null : <span>{bridge.label}</span>}
    </button>
  );
}
