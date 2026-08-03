"use client";

import React, { ReactNode, useMemo, useCallback, useEffect } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Import styles
import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Standard wallets like Phantom and Solflare are automatically registered
  // through the Wallet Standard in modern environments and do not need to be added here.
  const wallets = useMemo(() => [], []);

  const onError = useCallback((error: WalletError) => {
    // Suppress noise for expected user/browser behaviors
    if (
      error.message === "Unexpected error" ||
      error.message === "User rejected the request." ||
      error.name === "WalletDisconnectedError"
    ) {
      console.warn("Solana Wallet Info:", error.message || error.name);
      return;
    }
    console.error("Solana Wallet Error:", error.name, error.message);
  }, []);

  // Suppress unhandled rejections from browser extensions (e.g., MetaMask, Phantom)
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason) {
        const errorString = String(reason.message || reason.stack || reason);
        if (
          errorString.includes("MetaMask") ||
          errorString.includes("chrome-extension://") ||
          (reason.stack && reason.stack.includes("chrome-extension://"))
        ) {
          event.preventDefault();
          console.warn("Suppressed extension unhandled rejection:", errorString);
        }
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}