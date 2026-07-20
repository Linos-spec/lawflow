"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface Firm {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  aiModeEnabled: boolean;
  aiAutoCreateMatter: boolean;
  aiAutoGenerateTasks: boolean;
}

interface FirmContextValue {
  firm: Firm | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const FirmContext = createContext<FirmContextValue>({ firm: null, loading: true, refresh: async () => {} });

export function FirmProvider({ children }: { children: React.ReactNode }) {
  const [firm, setFirm] = useState<Firm | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/firm");
      const json = await res.json();
      if (json.success) setFirm(json.data);
    } catch {
      /* leave firm as-is */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <FirmContext.Provider value={{ firm, loading, refresh }}>{children}</FirmContext.Provider>;
}

export function useFirm() {
  return useContext(FirmContext);
}
