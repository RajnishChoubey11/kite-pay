"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { USDC_DEVNET_MINT, USDC_DEVNET_MINTS } from "@/lib/solana";

export default function WalletBalance() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getBalance() {
      if (!connected || !publicKey) {
        setBalance(null);
        return;
      }

      setLoading(true);
      try {
        let totalBalance = 0;
        let fetchedSuccessfully = false;

        try {
          const [tokenAccounts, token2022Accounts] = await Promise.all([
            connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID }),
            connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_2022_PROGRAM_ID }),
          ]);

          const allAccounts = [...tokenAccounts.value, ...token2022Accounts.value];
          console.log(`[WalletBalance] Tokens found for ${publicKey.toBase58()}:`, 
            allAccounts.map(a => ({ 
              mint: a.account.data.parsed.info.mint, 
              balance: a.account.data.parsed.info.tokenAmount.uiAmount 
            }))
          );

          allAccounts.forEach((account) => {
            const parsed = account.account.data.parsed;
            const mint = parsed.info.mint;
            const isUsdc = USDC_DEVNET_MINTS.includes(mint) || mint === USDC_DEVNET_MINT.toBase58();
            
            if (isUsdc) {
              totalBalance += Number(parsed.info.tokenAmount.uiAmount || 0);
            }
          });
          fetchedSuccessfully = true;
        } catch (error) {
          console.warn("[WalletBalance] Failed to fetch token accounts by owner, falling back to direct ATA query:", error);
        }

        // Fallback: If getParsedTokenAccountsByOwner failed or returned 0,
        // query the standard Associated Token Account (ATA) balance directly.
        if (!fetchedSuccessfully || totalBalance === 0) {
          try {
            const ata = await getAssociatedTokenAddress(
              USDC_DEVNET_MINT,
              publicKey,
              false,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            );
            const ataBalance = await connection.getTokenAccountBalance(ata);
            if (ataBalance && ataBalance.value) {
              totalBalance = Number(ataBalance.value.uiAmount || 0);
            }
          } catch (ataError) {
            console.warn("[WalletBalance] Failed to fetch direct ATA balance:", ataError);
          }
        }

        setBalance(totalBalance);
      } catch (error) {
        console.error("Error in WalletBalance getBalance flow:", error);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    }

    getBalance();
    const id = setInterval(getBalance, 10000);
    return () => clearInterval(id);
  }, [connected, publicKey, connection]);

  if (!connected) return null;

  return (
    <div className="metric-card">
      <span>Company Wallet (USDC)</span>
      <strong>
        {loading && balance === null ? "..." : `${balance?.toFixed(2) || "0.00"} USDC`}
      </strong>
      <p className="muted" style={{ fontSize: "10px", marginTop: "4px" }}>
        Devnet Mint: {USDC_DEVNET_MINT.toBase58().slice(0, 8)}...
      </p>
    </div>
  );
}
