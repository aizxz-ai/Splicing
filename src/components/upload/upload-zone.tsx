'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createImageFile } from '@/lib/image-utils';
import type { ImageFile } from '@/types';

// 创建 DataTransfer 文件列表
function createDataTransferFiles(files: File[]): DataTransfer {
  const dataTransfer = new DataTransfer();
  files.forEach(file => dataTransfer.items.add(file));
  return dataTransfer;
}

interface UploadZoneProps {
  onImagesUploaded: (images: ImageFile[]) => void;
  maxImages?: number;
  minImages?: number;
}

export function UploadZone({
  onImagesUploaded,
  maxImages = 9,
  minImages = 2,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorVisible, setErrorVisible] = useState(false);
  
  // 拖拽排序状态
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // 错误提示自动消失
  useEffect(() => {
    if (error) {
      setErrorVisible(true);
      const timer = setTimeout(() => {
        setErrorVisible(false);
        setTimeout(() => setError(null), 300); // 等动画结束后清除错误
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFiles = useCallback(async (files: FileList) => {
    setError(null);
    setErrorVisible(false);
    
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (validFiles.length === 0) {
      setError('请上传图片文件');
      return;
    }
    
    const totalAfterAdd = images.length + validFiles.length;
    if (totalAfterAdd > maxImages) {
      setError(`最多只能上传 ${maxImages} 张图片`);
      return;
    }
    
    if (totalAfterAdd < minImages) {
      setError(`至少需要上传 ${minImages} 张图片`);
      return;
    }
    
    try {
      const newImages: ImageFile[] = [];
      for (const file of validFiles) {
        const img = await createImageFile(file);
        newImages.push(img);
      }
      
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesUploaded(updatedImages);
    } catch {
      setError('图片加载失败，请重试');
    }
  }, [images, maxImages, minImages, onImagesUploaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    
    if (imageFiles.length > 0) {
      const dataTransfer = createDataTransferFiles(imageFiles);
      handleFiles(dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeImage = useCallback((id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    onImagesUploaded(updatedImages);
  }, [images, onImagesUploaded]);

  // 拖拽排序相关函数
  const handleImageDragStart = useCallback((index: number) => {
    dragItem.current = index;
    setDraggingIndex(index);
  }, []);

  const handleImageDragEnter = useCallback((index: number) => {
    dragOverItem.current = index;
    setDragOverIndex(index);
  }, []);

  const handleImageDragEnd = useCallback(() => {
    // 交换图片位置
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const newImages = [...images];
      const dragItemValue = dragItem.current;
      const dragOverItemValue = dragOverItem.current;
      
      // 使用 splice 交换位置
      const draggedItem = newImages[dragItemValue];
      newImages.splice(dragItemValue, 1);
      newImages.splice(dragOverItemValue, 0, draggedItem);
      
      setImages(newImages);
      onImagesUploaded(newImages);
    }
    
    // 重置状态
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, [images, onImagesUploaded]);

  const handleImageDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* 上传区域 */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl py-28 px-12 text-center transition-all duration-200',
          isDragging
            ? 'border-[#000000] bg-[#000000]/5'
            : 'border-[#e5e5e5] hover:border-[#c5c5c5]',
          images.length > 0 && 'py-20'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center gap-5">
          <div className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center transition-colors',
            isDragging ? 'bg-[#000000]/10' : 'bg-[#f5f5f5]'
          )}>
            <Upload className={cn(
              'w-10 h-10 transition-colors',
              isDragging ? 'text-[#000000]' : 'text-[#8e8e93]'
            )} />
          </div>
          
          <div className="space-y-1">
            <p className="text-base font-medium text-[#1a1a1a]">
              点击 / 拖拽 / 粘贴 上传图片
            </p>
            <p className="text-sm text-[#8e8e93]">
              支持 JPG、PNG、GIF、WebP 等格式 · {minImages}-{maxImages} 张图片
            </p>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className={cn(
          'mt-4 p-3 bg-[#fef2f2] rounded-lg transition-all duration-300',
          errorVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        )}>
          <p className="text-sm text-[#dc2626]">{error}</p>
        </div>
      )}

      {/* 已上传图片预览 */}
      {images.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-[#8e8e93]">
              已上传 {images.length} 张图片 · 拖拽可调整顺序
            </p>
            <button
              onClick={() => {
                setImages([]);
                onImagesUploaded([]);
              }}
              className="text-sm text-[#8e8e93] hover:text-[#000000] transition-colors"
            >
              清空全部
            </button>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {images.map((img, index) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => handleImageDragStart(index)}
                onDragEnter={() => handleImageDragEnter(index)}
                onDragEnd={handleImageDragEnd}
                onDragOver={handleImageDragOver}
                className={cn(
                  'relative aspect-square rounded-lg overflow-hidden bg-[#f5f5f5] group cursor-grab active:cursor-grabbing transition-all',
                  draggingIndex === index && 'opacity-50 scale-95',
                  dragOverIndex === index && draggingIndex !== null && 'ring-2 ring-[#000000] ring-offset-2 scale-105'
                )}
              >
                {/* 拖拽手柄图标 */}
                <div className="absolute top-1 left-1 z-10 w-5 h-5 bg-[#1a1a1a]/50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3 text-white" />
                </div>
                
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`上传图片 ${index + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                />
                
                {/* 序号 */}
                <div className="absolute top-2 left-2 w-6 h-6 bg-[#1a1a1a]/70 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">{index + 1}</span>
                </div>
                
                {/* 删除按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(img.id);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-[#1a1a1a]/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#dc2626]"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
            
            {/* 添加更多按钮 */}
            {images.length < maxImages && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-[#e5e5e5] flex flex-col items-center justify-center cursor-pointer hover:border-[#000000] hover:bg-[#000000]/5 transition-all">
                <ImageIcon className="w-6 h-6 text-[#8e8e93]" />
                <span className="text-xs text-[#8e8e93] mt-1">添加</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
