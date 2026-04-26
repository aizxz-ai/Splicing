'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowDown, Grid3x3, AlignVerticalJustifyCenter, LayoutGrid, Copy, Check, Download, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { copyImageToClipboard, downloadImage, exportImage, getTemplatesForCount, mergeWithTemplate, mergeLongImage, mergeCustom } from '@/lib/image-utils';
import type { ImageFile, MergeMode, MergeTemplate, LongImageDirection, CustomImagePosition, TemplateRatio, ExportFormat, JpegQuality, CustomModeConfig } from '@/types';
import { useImages } from '@/context/ImageContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 可拖拽缩略图组件
interface SortableThumbnailProps {
  image: ImageFile;
  index: number;
}

function SortableThumbnail({ image, index }: SortableThumbnailProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex-1 relative cursor-grab active:cursor-grabbing group aspect-square',
        isDragging && 'opacity-50 z-50 ring-2 ring-[#000000]'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="w-full h-full rounded-lg overflow-hidden bg-[#f5f5f5]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={`图片 ${index + 1}`}
          className="w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a]/60 text-white text-xs text-center py-0.5 rounded-b-lg">
        {index + 1}
      </div>
    </div>
  );
}

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { images, setImages, clearImages } = useImages();
  
  const initialMode = searchParams.get('mode') as MergeMode;
  
  // 状态
  const [mode, setMode] = useState<MergeMode>(initialMode);
  
  // 模板模式状态
  const [selectedRatio, setSelectedRatio] = useState<TemplateRatio>('1:1');
  const [selectedTemplate, setSelectedTemplate] = useState<MergeTemplate | null>(null);
  
  // 长图模式状态
  const [longImageDirection, setLongImageDirection] = useState<LongImageDirection>('vertical');
  
  // 自定义模式状态
  const [customConfig, setCustomConfig] = useState<CustomModeConfig>({ rowCount: 2, row1Count: 1, row2Count: images.length - 1, row3Count: 0 });
  const [customPositions, setCustomPositions] = useState<CustomImagePosition[]>([]);
  
  // 通用状态
  const [gap, setGap] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // 导出设置
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [jpegQuality, setJpegQuality] = useState<JpegQuality>('medium');
  const [downloading, setDownloading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // 处理拖拽排序
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      const newImages = arrayMove(images, oldIndex, newIndex);
      setImages(newImages);
    }
  };

  // 检查图片数量
  useEffect(() => {
    if (images.length < 2) {
      router.push('/');
    }
  }, [images, router]);

  // 生成预览
  const generatePreview = useCallback(async () => {
    if (images.length === 0) return;
    
    setPreviewLoading(true);
    try {
      let url = '';
      
      if (mode === 'template' && selectedTemplate) {
        url = await mergeWithTemplate(images, selectedTemplate, gap);
      } else if (mode === 'long-image') {
        url = await mergeLongImage(images, longImageDirection, gap);
      } else if (mode === 'custom' && customConfig.row1Count > 0) {
        url = await mergeCustom(images, customConfig, gap);
      }
      
      setPreviewUrl(url);
    } catch (error) {
      console.error('生成预览失败:', error);
    } finally {
      setPreviewLoading(false);
    }
  }, [images, mode, selectedTemplate, longImageDirection, customPositions, gap]);

  // 复制到剪贴板
  const handleCopyToClipboard = useCallback(async () => {
    if (!previewUrl) return;
    
    setCopying(true);
    try {
      await copyImageToClipboard(previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    } finally {
      setCopying(false);
    }
  }, [previewUrl]);

  // 保存到本地
  const handleSaveToLocal = useCallback(async () => {
    if (!previewUrl) return;
    
    setDownloading(true);
    try {
      const exportedUrl = await exportImage(previewUrl, exportFormat, jpegQuality);
      await downloadImage(exportedUrl, 'splicing');
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setDownloading(false);
    }
  }, [previewUrl, exportFormat, jpegQuality]);

  // 当依赖变化时重新生成预览
  useEffect(() => {
    if (images.length > 0 && mode) {
      generatePreview();
    }
  }, [generatePreview, images, mode, customConfig]);

  // 当切换到自定义模式时，初始化默认配置（2行，第1行1张，剩余给第2行）
  useEffect(() => {
    if (mode === 'custom') {
      setCustomConfig({ rowCount: 2, row1Count: 1, row2Count: images.length - 1, row3Count: 0 });
      setCustomPositions([]);
    }
  }, [mode, images.length]);

  // 根据配置生成位置
  useEffect(() => {
    if (mode !== 'custom') return;
    
    const generatePositions = async () => {
      // 按行分组
      const rows: string[][] = [];
      let currentIndex = 0;
      
      // 第1行
      rows.push(images.slice(0, customConfig.row1Count).map(i => i.id));
      currentIndex = customConfig.row1Count;
      
      // 第2行
      rows.push(images.slice(currentIndex, currentIndex + customConfig.row2Count).map(i => i.id));
      currentIndex += customConfig.row2Count;
      
      // 第3行（如果有）
      if (customConfig.rowCount === 3) {
        rows.push(images.slice(currentIndex).map(i => i.id));
      }
      
      // 计算布局
      const positions = await calculateCustomLayout(rows, gap);
      setCustomPositions(positions);
    };
    
    generatePositions();
  }, [mode, customConfig, images, gap]);

  // 获取所有可用比例（按指定顺序：竖版 → 正方形 → 横版）
  const availableRatios = ['9:16', '3:4', '1:1', '4:3', '16:9'];
  
  // 获取当前比例下的模板
  const templatesForRatio = getTemplatesForCount(images.length, selectedRatio);

  // 处理模板选择
  const handleTemplateSelect = (template: MergeTemplate) => {
    setSelectedTemplate(template);
  };

  // 处理自定义模式拖拽
  const handleCustomDrag = (imageId: string, deltaX: number, deltaY: number) => {
    setCustomPositions(prev => prev.map(pos => 
      pos.imageId === imageId
        ? { ...pos, x: pos.x + deltaX, y: pos.y + deltaY }
        : pos
    ));
  };

  // 处理自定义模式缩放
  const handleCustomResize = (imageId: string, newWidth: number, newHeight: number) => {
    setCustomPositions(prev => prev.map(pos => 
      pos.imageId === imageId
        ? { ...pos, width: newWidth, height: newHeight }
        : pos
    ));
  };

  // 计算自定义布局
  const calculateCustomLayout = async (rows: string[][], gapSize: number): Promise<CustomImagePosition[]> => {
    if (rows.length === 0 || rows.some(row => row.length === 0)) {
      return [];
    }

    // 加载所有图片获取原始尺寸
    const imageData = await Promise.all(
      images.map(async (img) => {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = img.url;
        });
        return {
          id: img.id,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          aspectRatio: image.naturalWidth / image.naturalHeight
        };
      })
    );

    const getImageData = (id: string) => imageData.find(d => d.id === id)!;

    // 步骤1: 以所有图片 naturalHeight 的最大值为初始基准估算各行宽度
    const maxNaturalHeight = Math.max(...imageData.map(d => d.naturalHeight));
    
    const rowWidths = rows.map(row => {
      const rowHeight = maxNaturalHeight;
      let totalWidth = 0;
      row.forEach((imgId, index) => {
        const data = getImageData(imgId);
        const scaledWidth = rowHeight * data.aspectRatio;
        totalWidth += scaledWidth;
        if (index < row.length - 1) {
          totalWidth += gapSize; // 添加间隙
        }
      });
      return totalWidth;
    });

    // 步骤2: 取最大行宽作为最终基准总宽度
    const baseTotalWidth = Math.max(...rowWidths);

    // 步骤3: 按照"基准总宽度 / 该行所有图片宽高比之和"反推每行的行高
    const rowHeights = rows.map(row => {
      const totalAspectRatio = row.reduce((sum, imgId) => {
        return sum + getImageData(imgId).aspectRatio;
      }, 0);
      // 总宽度 = 行高 * 宽高比之和 + 间隙
      // 行高 = (总宽度 - 间隙) / 宽高比之和
      const totalGap = (row.length - 1) * gapSize;
      return (baseTotalWidth - totalGap) / totalAspectRatio;
    });

    // 生成位置信息
    const positions: CustomImagePosition[] = [];
    let currentY = 0;

    rows.forEach((row, rowIndex) => {
      const rowHeight = rowHeights[rowIndex];
      let currentX = 0;

      row.forEach((imgId) => {
        const data = getImageData(imgId);
        const scaledWidth = rowHeight * data.aspectRatio;
        
        positions.push({
          imageId: imgId,
          x: currentX,
          y: currentY,
          width: scaledWidth,
          height: rowHeight
        });

        currentX += scaledWidth + gapSize;
      });

      currentY += rowHeight + gapSize;
    });

    return positions;
  };

  return (
    <div className="h-screen bg-[#ffffff] flex flex-col overflow-hidden">
      {/* 顶部导航 */}
      <header className="flex-shrink-0 bg-[#ffffff] border-b border-[#f0f0f0]">
        <div className="w-full px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-[#8e8e93] hover:text-[#1a1a1a] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          
          <h1 className="text-lg font-semibold text-[#1a1a1a]">
            {mode === 'template' && '多图拼接模版'}
            {mode === 'long-image' && '长图拼接'}
            {mode === 'custom' && '自定义拼接'}
          </h1>
          
          <div className="w-20"></div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 左侧：编辑区域 */}
        <div className="w-full lg:w-[480px] flex-shrink-0 border-r border-[#f0f0f0] overflow-y-auto p-4">
          <div className="space-y-4">
            {/* 模式切换 */}
            <div className="flex gap-2 p-1 bg-[#f5f5f5] rounded-xl">
              {[
                { mode: 'template' as MergeMode, icon: Grid3x3, label: '模版', 
                  disabled: images.length < 3,
                  disabledReason: images.length < 3 ? '需要至少3张图片' : undefined
                },
                { mode: 'long-image' as MergeMode, icon: AlignVerticalJustifyCenter, label: '长图' },
                { mode: 'custom' as MergeMode, icon: LayoutGrid, label: '自定义', 
                  disabled: images.length < 3,
                  disabledReason: images.length < 3 ? '需要至少3张图片' : undefined
                },
              ].map(({ mode: m, icon: Icon, label, disabled, disabledReason }) => (
                <button
                  key={m}
                  onClick={() => !disabled && setMode(m)}
                  disabled={disabled}
                  title={disabledReason}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all text-sm',
                    mode === m
                      ? 'bg-white text-[#000000] shadow-sm'
                      : disabled
                        ? 'text-[#c5c5c5] cursor-not-allowed'
                        : 'text-[#8e8e93] hover:text-[#1a1a1a]'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* 模板模式配置 */}
            {mode === 'template' && (
              <div className="space-y-4">
                {/* 比例选择 - 使用图标展示 */}
                <div>
                  <p className="text-sm font-medium text-[#1a1a1a] mb-2">选择图幅比例</p>
                  <div className="flex gap-2">
                    {availableRatios.map(ratio => {
                      // 解析比例计算图标尺寸，确保对应比例的横竖版面积相等
                      const [w, h] = ratio.split(':').map(Number);
                      // 使用基准尺寸，按平方根比例缩放确保面积相等
                      const baseArea = 200; // 基准面积
                      const scale = Math.sqrt(baseArea / (w * h));
                      const iconWidth = Math.round(w * scale);
                      const iconHeight = Math.round(h * scale);
                      
                      return (
                        <button
                          key={ratio}
                          onClick={() => setSelectedRatio(ratio as TemplateRatio)}
                          className={cn(
                            'flex-1 py-2 rounded-xl flex flex-col items-center transition-all',
                            selectedRatio === ratio
                              ? 'bg-[#000000]/10'
                              : 'bg-transparent hover:bg-[#000000]/5'
                          )}
                        >
                          {/* 比例图标容器 - 固定高度确保文字基线对齐 */}
                          <div className="h-6 flex items-center justify-center">
                            {/* 比例图标 - 空心描边样式 */}
                            <div 
                              className="border-2 border-[#000000] bg-transparent rounded-sm"
                              style={{
                                width: `${iconWidth}px`,
                                height: `${iconHeight}px`,
                              }}
                            />
                          </div>
                          <span className={cn(
                            'text-xs font-medium mt-1',
                            selectedRatio === ratio ? 'text-[#000000]' : 'text-[#8e8e93]'
                          )}>
                            {ratio}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 模板选择 - 单排横向排列，紧凑显示 */}
                <div>
                  <p className="text-sm font-medium text-[#1a1a1a] mb-2">
                    选择布局 ({templatesForRatio.length} 个)
                  </p>
                  <div className={cn(
                    templatesForRatio.length === 1 && 'flex justify-center',
                    templatesForRatio.length === 2 && 'flex justify-center gap-[120px]',
                    templatesForRatio.length >= 3 && 'flex justify-between'
                  )}>
                    {templatesForRatio.map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={cn(
                          'p-2 rounded-lg transition-all',
                          selectedTemplate?.id === template.id
                            ? 'bg-[#000000]/10'
                            : 'bg-transparent hover:bg-[#000000]/5'
                        )}
                      >
                        {/* 模板线框预览 - 根据选中比例动态调整尺寸 */}
                        <div 
                          className="h-12 bg-white overflow-hidden relative outline outline-[#d0d0d0]"
                          style={{
                            width: selectedRatio === '9:16' ? 27 : selectedRatio === '3:4' ? 36 : selectedRatio === '1:1' ? 48 : selectedRatio === '4:3' ? 64 : 85,
                          }}
                        >
                          <div
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <div
                              className="relative w-full h-full bg-white"
                            >
                              {template.cells.map((cell, i) => (
                                <div
                                  key={i}
                                  className="absolute outline outline-[#d0d0d0] bg-[#f8f8f8]"
                                  style={{
                                    left: `${cell.x * 100}%`,
                                    top: `${cell.y * 100}%`,
                                    width: `${cell.width * 100}%`,
                                    height: `${cell.height * 100}%`,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 长图模式配置 */}
            {mode === 'long-image' && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[#1a1a1a]">选择拼接方向</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLongImageDirection('vertical')}
                    className={cn(
                      'flex-1 py-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all',
                      longImageDirection === 'vertical'
                        ? 'border-[#000000] bg-[#000000]/5'
                        : 'border-[#e5e5e5] hover:border-[#c5c5c5]'
                    )}
                  >
                    <ArrowDown className={cn(
                      'w-6 h-6',
                      longImageDirection === 'vertical' ? 'text-[#000000]' : 'text-[#8e8e93]'
                    )} />
                    <span className={cn(
                      'text-xs font-medium',
                      longImageDirection === 'vertical' ? 'text-[#000000]' : 'text-[#8e8e93]'
                    )}>
                      纵向
                    </span>
                  </button>
                  <button
                    onClick={() => setLongImageDirection('horizontal')}
                    className={cn(
                      'flex-1 py-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all',
                      longImageDirection === 'horizontal'
                        ? 'border-[#000000] bg-[#000000]/5'
                        : 'border-[#e5e5e5] hover:border-[#c5c5c5]'
                    )}
                  >
                    <ArrowRight className={cn(
                      'w-6 h-6',
                      longImageDirection === 'horizontal' ? 'text-[#000000]' : 'text-[#8e8e93]'
                    )} />
                    <span className={cn(
                      'text-xs font-medium',
                      longImageDirection === 'horizontal' ? 'text-[#000000]' : 'text-[#8e8e93]'
                    )}>
                      横向
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* 自定义模式 - 一屏展示所有配置 */}
            {mode === 'custom' && (
              <div className="space-y-4">
                {/* 第一部分：选择行数 */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-[#1a1a1a]">选择行数</p>
                  <div className="flex gap-3">
                    {/* 2行选项 */}
                    <button
                      onClick={() => {
                        // 切换到2行，保持第1行数量，剩余给第2行
                        const row1Count = Math.min(customConfig.row1Count, images.length - 1);
                        setCustomConfig({
                          rowCount: 2,
                          row1Count: row1Count || 1,
                          row2Count: images.length - (row1Count || 1),
                          row3Count: 0
                        });
                      }}
                      className={cn(
                        'flex-1 py-5 rounded-xl flex flex-col items-center gap-3 transition-all',
                        customConfig.rowCount === 2
                          ? 'bg-[#000000]/10'
                          : 'bg-transparent hover:bg-[#000000]/5'
                      )}
                    >
                      <div className="flex flex-col justify-center gap-[8px]">
                        <div className={cn('w-20 h-[11px] rounded-sm', customConfig.rowCount === 2 ? 'bg-[#000000]' : 'bg-[#8e8e93]')}></div>
                        <div className={cn('w-20 h-[11px] rounded-sm', customConfig.rowCount === 2 ? 'bg-[#000000]' : 'bg-[#8e8e93]')}></div>
                      </div>
                      <span className={cn('text-base font-medium', customConfig.rowCount === 2 ? 'text-[#000000]' : 'text-[#8e8e93]')}>2行</span>
                    </button>
                    
                    {/* 3行选项 */}
                    <button
                      onClick={() => {
                        if (images.length >= 4) {
                          // 切换到3行，重新计算分配
                          const row1Count = Math.min(customConfig.row1Count, images.length - 2);
                          const remaining = images.length - row1Count;
                          if (remaining === 2) {
                            // 剩余2张，各1张
                            setCustomConfig({
                              rowCount: 3,
                              row1Count: row1Count || 1,
                              row2Count: 1,
                              row3Count: 1
                            });
                          } else {
                            // 剩余>2张，第2行至少1张
                            const row2Count = Math.min(1, remaining - 1);
                            setCustomConfig({
                              rowCount: 3,
                              row1Count: row1Count || 1,
                              row2Count: row2Count,
                              row3Count: remaining - row2Count
                            });
                          }
                        }
                      }}
                      disabled={images.length < 4}
                      className={cn(
                        'flex-1 py-5 rounded-xl flex flex-col items-center gap-3 transition-all',
                        images.length < 4
                          ? 'bg-transparent cursor-not-allowed'
                          : customConfig.rowCount === 3
                            ? 'bg-[#000000]/10'
                            : 'bg-transparent hover:bg-[#000000]/5'
                      )}
                    >
                      <div className="flex flex-col justify-center gap-[4px]">
                        <div className={cn('w-20 h-[7px] rounded-sm', images.length < 4 ? 'bg-[#c5c5c5]' : customConfig.rowCount === 3 ? 'bg-[#000000]' : 'bg-[#8e8e93]')}></div>
                        <div className={cn('w-20 h-[7px] rounded-sm', images.length < 4 ? 'bg-[#c5c5c5]' : customConfig.rowCount === 3 ? 'bg-[#000000]' : 'bg-[#8e8e93]')}></div>
                        <div className={cn('w-20 h-[7px] rounded-sm', images.length < 4 ? 'bg-[#c5c5c5]' : customConfig.rowCount === 3 ? 'bg-[#000000]' : 'bg-[#8e8e93]')}></div>
                      </div>
                      <span className={cn('text-base font-medium', images.length < 4 ? 'text-[#c5c5c5]' : customConfig.rowCount === 3 ? 'text-[#000000]' : 'text-[#8e8e93]')}>3行</span>
                      {images.length < 4 && <span className="text-xs text-[#8e8e93]">需4张以上</span>}
                    </button>
                  </div>
                </div>

                {/* 第二部分：选择各行图片数量 */}
                <div className="space-y-3">
                  {/* 第1行选择 - 始终显示 */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[#1a1a1a]">
                      第1行放置图片数量
                    </p>
                    <div className="flex gap-2">
                      {(() => {
                        const maxRow1 = customConfig.rowCount === 2 
                          ? images.length - 1  // 2行：至少留1张给第2行
                          : images.length - 2; // 3行：至少留2张给第2、3行
                        return Array.from({ length: maxRow1 }, (_, i) => i + 1).map(count => (
                          <button
                            key={count}
                            onClick={() => {
                              const remaining = images.length - count;
                              if (customConfig.rowCount === 2) {
                                // 2行：剩余全部给第2行
                                setCustomConfig({
                                  ...customConfig,
                                  row1Count: count,
                                  row2Count: remaining
                                });
                              } else {
                                // 3行：需要重新计算
                                if (remaining === 2) {
                                  // 剩余2张，各1张
                                  setCustomConfig({
                                    ...customConfig,
                                    row1Count: count,
                                    row2Count: 1,
                                    row3Count: 1
                                  });
                                } else {
                                  // 剩余>2张，保持第2行数量或重新分配
                                  const currentRow2 = customConfig.row2Count;
                                  const newRow2 = Math.min(currentRow2, remaining - 1);
                                  setCustomConfig({
                                    ...customConfig,
                                    row1Count: count,
                                    row2Count: newRow2 || 1,
                                    row3Count: remaining - (newRow2 || 1)
                                  });
                                }
                              }
                            }}
                            className={cn(
                              'flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                              customConfig.row1Count === count
                                ? 'border-[#000000] bg-[#000000] text-white'
                                : 'border-[#e5e5e5] hover:border-[#000000] hover:bg-[#000000]/5'
                            )}
                          >
                            {count}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* 第2行选择 - 仅3行模式且剩余>2时显示 */}
                  {customConfig.rowCount === 3 && (images.length - customConfig.row1Count) > 2 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[#1a1a1a]">
                        第2行放置图片数量
                      </p>
                      <div className="flex gap-2">
                        {(() => {
                          const remaining = images.length - customConfig.row1Count;
                          const maxRow2 = remaining - 1; // 至少留1张给第3行
                          return Array.from({ length: maxRow2 }, (_, i) => i + 1).map(count => (
                            <button
                              key={count}
                              onClick={() => {
                                setCustomConfig({
                                  ...customConfig,
                                  row2Count: count,
                                  row3Count: remaining - count
                                });
                              }}
                              className={cn(
                                'flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                                customConfig.row2Count === count
                                  ? 'border-[#000000] bg-[#000000] text-white'
                                  : 'border-[#e5e5e5] hover:border-[#000000] hover:bg-[#000000]/5'
                              )}
                            >
                              {count}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* 自动计算的行显示为文字说明 */}
                  <div className="bg-[#f5f5f5] rounded-lg p-3 space-y-2">
                    {customConfig.rowCount === 2 ? (
                      // 2行模式
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#8e8e93]">第2行（自动分配）:</span>
                        <span className="font-medium text-[#1a1a1a]">{customConfig.row2Count}张</span>
                      </div>
                    ) : (
                      // 3行模式
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#8e8e93]">第2行:</span>
                          <span className="font-medium text-[#1a1a1a]">{customConfig.row2Count}张</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#8e8e93]">第3行（自动分配）:</span>
                          <span className="font-medium text-[#1a1a1a]">{customConfig.row3Count}张</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* 间隙调整 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#1a1a1a]">图片间隙</p>
                    <span className="text-sm text-[#8e8e93]">{gap}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={gap}
                    onChange={(e) => setGap(Number(e.target.value))}
                    className="w-full h-2 bg-[#e5e5e5] rounded-lg appearance-none cursor-pointer accent-[#000000]"
                  />
                </div>
              </div>
            )}

            {/* 间隙调整 - 模板和长图模式 */}
            {(mode === 'template' || mode === 'long-image') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#1a1a1a]">图片间隙</p>
                  <span className="text-sm text-[#8e8e93]">{gap}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={gap}
                  onChange={(e) => setGap(Number(e.target.value))}
                  className="w-full h-2 bg-[#e5e5e5] rounded-lg appearance-none cursor-pointer accent-[#000000]"
                />
              </div>
            )}

            {/* 图片列表 - 可拖拽排序 */}
            <div>
              <p className="text-sm font-medium text-[#1a1a1a] mb-2">
                已上传 ({images.length}) · 拖拽排序
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={images.map(img => img.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex gap-2 w-full">
                    {images.map((img, index) => (
                      <SortableThumbnail key={img.id} image={img} index={index} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>

        {/* 右侧：预览区域 */}
        <div className="hidden lg:flex flex-1 bg-[#fafafa]">
          {/* 预览容器：撑满父级 */}
          <div className="flex flex-col w-full h-full">
            {/* 标题：紧贴顶部 */}
            <div className="flex-shrink-0 pt-4 pb-2 text-center">
              <p className="text-sm font-medium text-[#1a1a1a]">预览</p>
            </div>
            
            {/* 图片预览：flex-1 占满剩余空间 */}
            <div className="flex-1 min-h-0 px-6 pb-2">
              {/* 拼图预览 */}
              <div className="h-full bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                {previewLoading ? (
                  <div className="text-center">
                    <div className="w-10 h-10 border-4 border-[#000000] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-[#8e8e93]">生成中...</p>
                  </div>
                ) : previewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewUrl}
                    alt="预览"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <p className="text-[#8e8e93]">请选择配置</p>
                )}
              </div>
            </div>
            
            {/* 操作区：紧贴底部，仅在有预览时显示 */}
            {previewUrl && (
              <div className="flex-shrink-0">
                {/* 格式选择 */}
                <div className="flex items-center gap-2 px-6 py-3">
                  <span className="text-sm text-[#8e8e93]">格式:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setExportFormat('png')}
                      className={cn(
                        'w-20 h-8 text-sm rounded-lg transition-colors flex items-center justify-center',
                        exportFormat === 'png'
                          ? 'bg-[#000000] text-white'
                          : 'bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e5e5e5]'
                      )}
                    >
                      PNG
                    </button>
                    <button
                      onClick={() => setExportFormat('jpeg')}
                      className={cn(
                        'w-20 h-8 text-sm rounded-lg transition-colors flex items-center justify-center',
                        exportFormat === 'jpeg'
                          ? 'bg-[#000000] text-white'
                          : 'bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e5e5e5]'
                      )}
                    >
                      JPEG
                    </button>
                  </div>
                </div>
                
                {/* JPEG 画质选择：与格式行按钮组右边缘对齐 */}
                {exportFormat === 'jpeg' && (
                  <div className="flex items-center gap-2 px-6 py-3">
                    <span className="text-sm text-[#8e8e93]">画质:</span>
                    <div className="flex gap-1" style={{ width: '164px' }}>
                      {(['high', 'medium', 'low'] as const).map(level => (
                        <button
                          key={level}
                          onClick={() => setJpegQuality(level)}
                          className={cn(
                            'flex-1 h-8 text-sm rounded-lg transition-colors flex items-center justify-center',
                            jpegQuality === level
                              ? 'bg-[#000000] text-white'
                              : 'bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e5e5e5]'
                          )}
                        >
                          {level === 'high' ? '高' : level === 'medium' ? '中' : '低'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 操作按钮：位于格式选择下方，与预览区等宽 */}
                <div className="flex gap-2 px-6 pb-6">
                  <button
                    onClick={handleCopyToClipboard}
                    disabled={copying}
                    className={cn(
                      'flex-1 h-[76px] text-lg font-medium border-2 border-[#000000] bg-white text-[#000000] hover:bg-[#f5f5f5] rounded-lg flex items-center justify-center gap-2 transition-all',
                      copied && 'bg-[#000000] text-white hover:bg-[#000000]'
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5 flex-shrink-0" />
                        <span className="whitespace-nowrap">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 flex-shrink-0" />
                        <span className="whitespace-nowrap">复制到剪贴板</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSaveToLocal}
                    disabled={downloading}
                    className={cn(
                      'flex-1 h-[76px] text-lg font-medium border-2 border-[#000000] bg-white text-[#000000] hover:bg-[#f5f5f5] rounded-lg flex items-center justify-center gap-2 transition-all',
                      downloading && 'bg-[#f5f5f5]'
                    )}
                  >
                    {downloading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[#000000] border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                        <span className="whitespace-nowrap">保存中...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 flex-shrink-0" />
                        <span className="whitespace-nowrap">保存到本地</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">加载中...</div>}>
      <EditorContent />
    </Suspense>
  );
}
