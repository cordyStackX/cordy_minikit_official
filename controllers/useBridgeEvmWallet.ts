"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";

export type BridgeEvmWalletRequest = {
  routeId: string;
  amount: string;
  from: "internal" | "external";
  to: "internal" | "external";
  recipient: string;
  sourceChainId?: number;
  sourceNetworkType: "evm" | "stellar";
  destinationNetworkType: "evm" | "stellar";
};

export type UseBridgeEvmWalletOptions = {
  onResume: (request: BridgeEvmWalletRequest, address: string) => Promise<void> | void;
  onCancel?: () => void;
  onError?: (error: string) => void;
};

export function bridgeRequestNeedsEvmWallet(request: BridgeEvmWalletRequest): boolean {
  return request.sourceNetworkType === "evm"
    || (request.sourceNetworkType === "stellar" && request.destinationNetworkType === "evm");
}

export function useBridgeEvmWallet({ onResume, onCancel, onError }: UseBridgeEvmWalletOptions) {
  const { address, status } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const pendingRef = useRef<BridgeEvmWalletRequest | undefined>(undefined);
  const resumingRef = useRef(false);
  const onResumeRef = useRef(onResume);
  const onCancelRef = useRef(onCancel);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResumeRef.current = onResume;
    onCancelRef.current = onCancel;
    onErrorRef.current = onError;
  }, [onCancel, onError, onResume]);

  const resume = useCallback(async (connectedAddress: string) => {
    const request = pendingRef.current;
    if (!request || resumingRef.current) return;
    resumingRef.current = true;
    try {
      if (request.sourceChainId !== undefined) {
        await switchChainAsync({ chainId: request.sourceChainId });
      }
      pendingRef.current = undefined;
      setOpen(false);
      await onResumeRef.current(request, connectedAddress);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The wallet connection or network switch failed.";
      onErrorRef.current?.(message);
      pendingRef.current = undefined;
      setOpen(false);
    } finally {
      resumingRef.current = false;
    }
  }, [switchChainAsync]);

  const request = useCallback((nextRequest: BridgeEvmWalletRequest): boolean => {
    if (!bridgeRequestNeedsEvmWallet(nextRequest)) return false;
    if (status === "connected" && address) {
      pendingRef.current = nextRequest;
      void resume(address);
      return true;
    }
    if (pendingRef.current || open) return false;
    pendingRef.current = nextRequest;
    setOpen(true);
    return false;
  }, [address, open, resume, status]);

  const handleConnected = useCallback((connectedAddress?: string) => {
    const nextAddress = connectedAddress || address;
    if (nextAddress) void resume(nextAddress);
  }, [address, resume]);

  const cancel = useCallback(() => {
    const hadPendingRequest = Boolean(pendingRef.current);
    pendingRef.current = undefined;
    const wasResuming = resumingRef.current;
    resumingRef.current = false;
    setOpen(false);
    if (hadPendingRequest && !wasResuming) onCancelRef.current?.();
  }, []);

  useEffect(() => {
    if (status === "connected" && address) handleConnected(address);
  }, [address, handleConnected, status]);

  return {
    open,
    request,
    handleConnected,
    cancel,
  };
}
