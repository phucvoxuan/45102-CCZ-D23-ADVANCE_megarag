'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { LimitReachedModal, type LimitType } from '@/components/usage/LimitReachedModal';

interface LimitModalState {
  open: boolean;
  type: LimitType;
  current: number;
  limit: number;
}

interface LimitModalContextType {
  show: (type: LimitType, current: number, limit: number) => void;
  hide: () => void;
}

const LimitModalContext = createContext<LimitModalContextType | null>(null);

export function LimitModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LimitModalState>({
    open: false,
    type: 'documents',
    current: 0,
    limit: 0,
  });

  const show = useCallback((type: LimitType, current: number, limit: number) => {
    setState({ open: true, type, current, limit });
  }, []);

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <LimitModalContext.Provider value={{ show, hide }}>
      {children}
      <LimitReachedModal
        open={state.open}
        onClose={hide}
        type={state.type}
        current={state.current}
        limit={state.limit}
      />
    </LimitModalContext.Provider>
  );
}

export function useLimitModal() {
  const context = useContext(LimitModalContext);
  if (!context) {
    throw new Error('useLimitModal must be used within LimitModalProvider');
  }
  return context;
}

/**
 * Hook for making API calls with automatic limit checking
 * Shows the limit modal when a 403 LIMIT_EXCEEDED response is received
 */
export function useApiWithLimits() {
  const { show: showLimitModal } = useLimitModal();

  const fetchWithLimitCheck = useCallback(
    async (url: string, options?: RequestInit) => {
      const response = await fetch(url, options);

      if (response.status === 403) {
        try {
          const data = await response.json();
          if (data.error === 'LIMIT_EXCEEDED') {
            showLimitModal(data.type, data.current, data.limit);
            throw new Error(data.message || 'Limit exceeded');
          }
        } catch (e) {
          // If parsing fails, just throw the original error
          if (e instanceof Error && e.message !== 'Limit exceeded') {
            throw new Error('Request forbidden');
          }
          throw e;
        }
      }

      if (!response.ok) {
        throw new Error('Request failed');
      }

      return response;
    },
    [showLimitModal]
  );

  return { fetchWithLimitCheck };
}
