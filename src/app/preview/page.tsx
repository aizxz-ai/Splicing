'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Copy, RefreshCw, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadImage, copyImageToClipboard, exportImage } from '@/lib/image-utils';
import { usePreview } from '@/context/PreviewContext';
import type { ExportFormat, JpegQuality } from '@/types';

function PreviewContent() {
  const router = useRouter();
  const { previewUrl, mode, clearPreviewData } = usePreview();
  
  // 导出设置
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [jpegQuality, setJpegQuality] = useState<JpegQuality>('high');
  
  // 状态
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // 生成导出文件
  const generateExport = useCallback(async () => {
    if (!previewUrl) return null;
    
    return await exportImage(previewUrl, exportFormat, jpegQuality);
  }, [previewUrl, exportFormat, jpegQuality]);

  // 预览和导出变化时重新生成
  useEffect(() => {
    generateExport().then(url => setExportedUrl(url));
  }, [generateExport]);

  // 下载
  const handleDownload = useCallback(async () => {
    if (!exportedUrl) return;
    
    setDownloading(true);
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `splicing-${timestamp}.${exportFormat}`;
      downloadImage(exportedUrl, filename);
    } finally {
      setDownloading(false);
    }
  }, [exportedUrl, exportFormat]);

  // 复制
  const handleCopy = useCallback(async () => {
    if (!previewUrl) return;
    
    setCopying(true);
    try {
      await copyImageToClipboard(previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('复制失败');
    } finally {
      setCopying(false);
    }
  }, [previewUrl]);

  // 再拼一张
  const handleReset = useCallback(() => {
    clearPreviewData();
    router.push('/');
  }, [clearPreviewData, router]);

  if (!previewUrl) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#8e8e93] mb-4">没有可预览的图片</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[#000000] text-white rounded-lg hover:bg-[#000000] transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#ffffff] flex flex-col overflow-hidden">
      {/* 顶部导航 */}
      <header className="flex-shrink-0 bg-[#ffffff] border-b border-[#f0f0f0]">
        <div className="w-full px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#8e8e93] hover:text-[#1a1a1a] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回编辑</span>
          </button>
          
          <h1 className="text-lg font-semibold text-[#1a1a1a]">预览与导出</h1>
          
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-[#8e8e93] hover:text-[#000000] transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>再拼一张</span>
          </button>
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* 预览区域 */}
          <div className="bg-[#f5f5f5] rounded-2xl p-6 mb-6">
            <div className="bg-white rounded-xl overflow-hidden flex items-center justify-center min-h-[200px] max-h-[50vh] shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={exportedUrl || previewUrl}
                alt="预览"
                className="max-w-full max-h-[50vh] object-contain"
              />
            </div>
          </div>

          {/* 导出设置 */}
          <div className="bg-[#fafafa] rounded-xl p-5 mb-6">
            <h2 className="text-base font-semibold text-[#1a1a1a] mb-4">导出设置</h2>
            
            {/* 格式选择 */}
            <div className="mb-4">
              <p className="text-sm font-medium text-[#1a1a1a] mb-2">输出格式</p>
              <div className="flex gap-2">
                {[
                  { value: 'png' as ExportFormat, label: 'PNG', desc: '无损' },
                  { value: 'jpeg' as ExportFormat, label: 'JPEG', desc: '可调画质' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setExportFormat(option.value)}
                    className={cn(
                      'flex-1 py-2.5 px-3 rounded-xl border-2 text-left transition-all',
                      exportFormat === option.value
                        ? 'border-[#000000] bg-[#000000]/5'
                        : 'border-[#e5e5e5] hover:border-[#c5c5c5]'
                    )}
                  >
                    <p className={cn(
                      'font-medium text-sm',
                      exportFormat === option.value ? 'text-[#000000]' : 'text-[#1a1a1a]'
                    )}>
                      {option.label}
                    </p>
                    <p className="text-xs text-[#8e8e93]">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* JPEG 质量选择 */}
            {exportFormat === 'jpeg' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[#1a1a1a]">图片质量</p>
                  <span className="text-sm text-[#000000]">
                    {jpegQuality === 'high' && '高'}
                    {jpegQuality === 'medium' && '中'}
                    {jpegQuality === 'low' && '低'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {[
                    { value: 'high' as JpegQuality, label: '高' },
                    { value: 'medium' as JpegQuality, label: '中' },
                    { value: 'low' as JpegQuality, label: '低' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setJpegQuality(option.value)}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                        jpegQuality === option.value
                          ? 'bg-[#000000] text-white'
                          : 'bg-[#f5f5f5] text-[#8e8e93] hover:bg-[#e5e5e5]'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              disabled={copying || !exportedUrl}
              className={cn(
                'flex-1 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                copied
                  ? 'bg-[#000000] text-white'
                  : 'bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e5e5e5]',
                (copying || !exportedUrl) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {copying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>复制到剪贴板</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleDownload}
              disabled={downloading || !exportedUrl}
              className={cn(
                'flex-1 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                'bg-[#000000] text-white hover:bg-[#000000]',
                (downloading || !exportedUrl) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {downloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>保存到本地</span>
                </>
              )}
            </button>
          </div>

          {/* 再拼一张 */}
          <button
            onClick={handleReset}
            className="w-full mt-3 py-3 rounded-xl border-2 border-[#e5e5e5] text-[#8e8e93] hover:border-[#000000] hover:text-[#000000] font-medium transition-colors"
          >
            再拼一张
          </button>
        </div>
      </main>

      {/* 底部 */}
      <footer className="flex-shrink-0 border-t border-[#f0f0f0] py-4">
        <div className="px-6 text-center">
          <p className="text-sm text-[#8e8e93]">
            Splicing - 专注拼接，极简体验 · 无水印 · 无压缩
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function PreviewPage() {
  return <PreviewContent />;
}
