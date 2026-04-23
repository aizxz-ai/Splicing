'use client';

import { ImageProvider } from '@/context/ImageContext';
import { PreviewProvider } from '@/context/PreviewContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ImageProvider>
      <PreviewProvider>{children}</PreviewProvider>
    </ImageProvider>
  );
}
