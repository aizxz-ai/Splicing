'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ImageFile } from '@/types';

interface ImageContextType {
  images: ImageFile[];
  setImages: (images: ImageFile[]) => void;
  addImages: (newImages: ImageFile[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export function ImageProvider({ children }: { children: ReactNode }) {
  const [images, setImagesState] = useState<ImageFile[]>([]);

  const setImages = useCallback((newImages: ImageFile[]) => {
    setImagesState(newImages);
  }, []);

  const addImages = useCallback((newImages: ImageFile[]) => {
    setImagesState(prev => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImagesState(prev => prev.filter(img => img.id !== id));
  }, []);

  const clearImages = useCallback(() => {
    setImagesState([]);
  }, []);

  return (
    <ImageContext.Provider value={{ images, setImages, addImages, removeImage, clearImages }}>
      {children}
    </ImageContext.Provider>
  );
}

export function useImages() {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImages must be used within ImageProvider');
  }
  return context;
}
