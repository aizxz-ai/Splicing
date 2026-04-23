'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PreviewContextType {
  previewUrl: string | null;
  mode: string | null;
  setPreviewData: (url: string, mode: string) => void;
  clearPreviewData: () => void;
}

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);

  const setPreviewData = useCallback((url: string, m: string) => {
    setPreviewUrl(url);
    setMode(m);
  }, []);

  const clearPreviewData = useCallback(() => {
    setPreviewUrl(null);
    setMode(null);
  }, []);

  return (
    <PreviewContext.Provider value={{ previewUrl, mode, setPreviewData, clearPreviewData }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error('usePreview must be used within PreviewProvider');
  }
  return context;
}
