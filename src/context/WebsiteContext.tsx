import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type WebsiteCtx = {
  website: string | null;
  connect: (url: string) => void;
  disconnect: () => void;
  removeWebsite: () => void;
};

const KEY = 'insyflow_website';
const WebsiteContext = createContext<WebsiteCtx | undefined>(undefined);

export const WebsiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [website, setWebsite] = useState<string | null>(() => localStorage.getItem(KEY));

  useEffect(() => {
    if (website) localStorage.setItem(KEY, website);
  }, [website]);

  const connect = (url: string) => setWebsite(url.trim());
  const disconnect = () => setWebsite(null);
  const removeWebsite = () => {
    localStorage.removeItem(KEY);
    setWebsite(null);
  };

  const value = useMemo(() => ({ website, connect, disconnect, removeWebsite }), [website]);

  return <WebsiteContext.Provider value={value}>{children}</WebsiteContext.Provider>;
};

export const useWebsite = () => {
  const ctx = useContext(WebsiteContext);
  if (!ctx) throw new Error('useWebsite must be used within WebsiteProvider');
  return ctx;
};