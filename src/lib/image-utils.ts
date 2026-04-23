'use client';

import type { ImageFile, EditorState, MergeTemplate, CustomImagePosition, SerializableImage } from '@/types';

// 生成唯一 ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// 将 File 转换为 dataUrl
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 将 ImageFile 转换为可序列化格式
export async function imageFileToSerializable(image: ImageFile): Promise<SerializableImage> {
  const dataUrl = await fileToDataUrl(image.file);
  return {
    id: image.id,
    dataUrl,
    width: image.width,
    height: image.height,
  };
}

// 从可序列化格式恢复为 ImageFile
export function serializableToImageFile(serializable: SerializableImage): ImageFile {
  // 将 dataUrl 转换为 File 和 url
  const arr = serializable.dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const file = new File([u8arr], 'image.png', { type: mime });
  const url = serializable.dataUrl;
  
  return {
    id: serializable.id,
    file,
    url,
    width: serializable.width,
    height: serializable.height,
  };
}

// 创建图片文件对象
export async function createImageFile(file: File): Promise<ImageFile> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        id: generateId(),
        file,
        url,
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = reject;
    img.src = url;
  });
}

// 计算比例对应的宽高
export function getRatioDimensions(ratio: string, maxWidth: number): { width: number; height: number } {
  const [w, h] = ratio.split(':').map(Number);
  const aspectRatio = w / h;
  
  if (maxWidth / aspectRatio > 800) {
    const height = 800;
    return { width: height * aspectRatio, height };
  }
  
  return { width: maxWidth, height: maxWidth / aspectRatio };
}

// 初始化编辑器状态
export function getInitialEditorState(): EditorState {
  return {
    images: [],
    mode: null,
    selectedTemplate: null,
    longImageDirection: 'vertical',
    customPositions: [],
    gap: 0,
  };
}

// 获取图片数量对应的可用模板（新设计：按数量和比例分类）
export function getTemplatesForCount(imageCount: number, ratio: string): MergeTemplate[] {
  const templates: MergeTemplate[] = [];
  
  // === 2张图模版 ===
  if (imageCount === 2) {
    if (ratio === '1:1' || ratio === '4:3' || ratio === '16:9') {
      // 横版比例：左右布局
      templates.push(
        { id: `2-h-${ratio}-equal`, name: '左右均等', imageCount: 2, ratio: ratio as any, type: 'equal', cells: [{ x: 0, y: 0, width: 0.5, height: 1 }, { x: 0.5, y: 0, width: 0.5, height: 1 }] },
        { id: `2-h-${ratio}-left`, name: '左大右小', imageCount: 2, ratio: ratio as any, type: 'highlight', cells: [{ x: 0, y: 0, width: 2/3, height: 1 }, { x: 2/3, y: 0, width: 1/3, height: 1 }] },
      );
    }
    if (ratio === '1:1' || ratio === '3:4' || ratio === '9:16') {
      // 竖版比例：上下布局
      templates.push(
        { id: `2-v-${ratio}-equal`, name: '上下均等', imageCount: 2, ratio: ratio as any, type: 'equal', cells: [{ x: 0, y: 0, width: 1, height: 0.5 }, { x: 0, y: 0.5, width: 1, height: 0.5 }] },
        { id: `2-v-${ratio}-top`, name: '上大下小', imageCount: 2, ratio: ratio as any, type: 'highlight', cells: [{ x: 0, y: 0, width: 1, height: 2/3 }, { x: 0, y: 2/3, width: 1, height: 1/3 }] },
      );
    }
  }
  
  // === 3张图模版 ===
  if (imageCount === 3) {
    if (ratio === '1:1' || ratio === '4:3' || ratio === '16:9') {
      // 横版比例
      templates.push(
        { id: `3-h-${ratio}-col`, name: '三列均等', imageCount: 3, ratio: ratio as any, type: 'equal', cells: [{ x: 0, y: 0, width: 1/3, height: 1 }, { x: 1/3, y: 0, width: 1/3, height: 1 }, { x: 2/3, y: 0, width: 1/3, height: 1 }] },
        { id: `3-h-${ratio}-left2`, name: '一大两小横', imageCount: 3, ratio: ratio as any, type: 'highlight', cells: [{ x: 0, y: 0, width: 0.5, height: 1 }, { x: 0.5, y: 0, width: 0.5, height: 0.5 }, { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }] },
      );
    }
    if (ratio === '1:1' || ratio === '3:4' || ratio === '9:16') {
      // 竖版比例
      templates.push(
        { id: `3-v-${ratio}-row`, name: '三行均等', imageCount: 3, ratio: ratio as any, type: 'equal', cells: [{ x: 0, y: 0, width: 1, height: 1/3 }, { x: 0, y: 1/3, width: 1, height: 1/3 }, { x: 0, y: 2/3, width: 1, height: 1/3 }] },
        { id: `3-v-${ratio}-top2`, name: '一大两小竖', imageCount: 3, ratio: ratio as any, type: 'highlight', cells: [{ x: 0, y: 0, width: 1, height: 0.5 }, { x: 0, y: 0.5, width: 0.5, height: 0.5 }, { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }] },
      );
    }
  }
  
  // === 4张图模版 ===
  if (imageCount === 4) {
    templates.push(
      { id: `4-${ratio}-grid`, name: '四宫格均等', imageCount: 4, ratio: ratio as any, type: 'equal', cells: [{ x: 0, y: 0, width: 0.5, height: 0.5 }, { x: 0.5, y: 0, width: 0.5, height: 0.5 }, { x: 0, y: 0.5, width: 0.5, height: 0.5 }, { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }] },
      { id: `4-${ratio}-top1`, name: '上一下三', imageCount: 4, ratio: ratio as any, type: 'mixed', cells: [{ x: 0, y: 0, width: 1, height: 0.5 }, { x: 0, y: 0.5, width: 1/3, height: 0.5 }, { x: 1/3, y: 0.5, width: 1/3, height: 0.5 }, { x: 2/3, y: 0.5, width: 1/3, height: 0.5 }] },
      { id: `4-${ratio}-left1`, name: '一大三小', imageCount: 4, ratio: ratio as any, type: 'highlight', cells: [{ x: 0, y: 0, width: 0.5, height: 1 }, { x: 0.5, y: 0, width: 0.5, height: 1/3 }, { x: 0.5, y: 1/3, width: 0.5, height: 1/3 }, { x: 0.5, y: 2/3, width: 0.5, height: 1/3 }] },
    );
  }
  
  // === 5张图模版 ===
  if (imageCount === 5) {
    templates.push(
      // 上三下二：上排3张均分，下排2张均分，无留白
      { id: `5-${ratio}-top3`, name: '上三下二', imageCount: 5, ratio: ratio as any, type: 'equal', cells: [{ x: 0, y: 0, width: 1/3, height: 0.5 }, { x: 1/3, y: 0, width: 1/3, height: 0.5 }, { x: 2/3, y: 0, width: 1/3, height: 0.5 }, { x: 0, y: 0.5, width: 0.5, height: 0.5 }, { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }] },
      // 上二下三：上排2张均分，下排3张均分，无留白
      { id: `5-${ratio}-top2`, name: '上二下三', imageCount: 5, ratio: ratio as any, type: 'equal', cells: [{ x: 0, y: 0, width: 0.5, height: 0.5 }, { x: 0.5, y: 0, width: 0.5, height: 0.5 }, { x: 0, y: 0.5, width: 1/3, height: 0.5 }, { x: 1/3, y: 0.5, width: 1/3, height: 0.5 }, { x: 2/3, y: 0.5, width: 1/3, height: 0.5 }] },
    );
  }
  
  // === 6张图模版 ===
  if (imageCount === 6) {
    templates.push(
      // 2×3 网格
      { id: `6-${ratio}-grid2x3`, name: '六宫格(2×3)', imageCount: 6, ratio: ratio as any, type: 'equal', cells: [{ x: 0, y: 0, width: 1/3, height: 0.5 }, { x: 1/3, y: 0, width: 1/3, height: 0.5 }, { x: 2/3, y: 0, width: 1/3, height: 0.5 }, { x: 0, y: 0.5, width: 1/3, height: 0.5 }, { x: 1/3, y: 0.5, width: 1/3, height: 0.5 }, { x: 2/3, y: 0.5, width: 1/3, height: 0.5 }] },
      // 3×2 网格
      { id: `6-${ratio}-grid3x2`, name: '六宫格(3×2)', imageCount: 6, ratio: ratio as any, type: 'equal', cells: [{ x: 0, y: 0, width: 0.5, height: 1/3 }, { x: 0.5, y: 0, width: 0.5, height: 1/3 }, { x: 0, y: 1/3, width: 0.5, height: 1/3 }, { x: 0.5, y: 1/3, width: 0.5, height: 1/3 }, { x: 0, y: 2/3, width: 0.5, height: 1/3 }, { x: 0.5, y: 2/3, width: 0.5, height: 1/3 }] },
    );
  }
  
  // === 7张图模版 ===
  if (imageCount === 7) {
    templates.push(
      // 上三下四
      { id: `7-${ratio}-top3`, name: '上三下四', imageCount: 7, ratio: ratio as any, type: 'equal', cells: [{ x: 0, y: 0, width: 1/3, height: 0.5 }, { x: 1/3, y: 0, width: 1/3, height: 0.5 }, { x: 2/3, y: 0, width: 1/3, height: 0.5 }, { x: 0, y: 0.5, width: 0.25, height: 0.5 }, { x: 0.25, y: 0.5, width: 0.25, height: 0.5 }, { x: 0.5, y: 0.5, width: 0.25, height: 0.5 }, { x: 0.75, y: 0.5, width: 0.25, height: 0.5 }] },
      // 左三右四
      { id: `7-${ratio}-left3`, name: '左三右四', imageCount: 7, ratio: ratio as any, type: 'equal', cells: [{ x: 0, y: 0, width: 0.5, height: 1/3 }, { x: 0, y: 1/3, width: 0.5, height: 1/3 }, { x: 0, y: 2/3, width: 0.5, height: 1/3 }, { x: 0.5, y: 0, width: 0.5, height: 0.25 }, { x: 0.5, y: 0.25, width: 0.5, height: 0.25 }, { x: 0.5, y: 0.5, width: 0.5, height: 0.25 }, { x: 0.5, y: 0.75, width: 0.5, height: 0.25 }] },
    );
  }

  // === 8张图模版 ===
  if (imageCount === 8) {
    templates.push(
      // 上四下四（2×4网格）
      { id: `8-${ratio}-top4`, name: '上四下四', imageCount: 8, ratio: ratio as any, type: 'equal', cells: [{ x: 0, y: 0, width: 0.25, height: 0.5 }, { x: 0.25, y: 0, width: 0.25, height: 0.5 }, { x: 0.5, y: 0, width: 0.25, height: 0.5 }, { x: 0.75, y: 0, width: 0.25, height: 0.5 }, { x: 0, y: 0.5, width: 0.25, height: 0.5 }, { x: 0.25, y: 0.5, width: 0.25, height: 0.5 }, { x: 0.5, y: 0.5, width: 0.25, height: 0.5 }, { x: 0.75, y: 0.5, width: 0.25, height: 0.5 }] },
      // 左四右四
      { id: `8-${ratio}-left4`, name: '左四右四', imageCount: 8, ratio: ratio as any, type: 'equal', cells: [{ x: 0, y: 0, width: 0.5, height: 0.25 }, { x: 0, y: 0.25, width: 0.5, height: 0.25 }, { x: 0, y: 0.5, width: 0.5, height: 0.25 }, { x: 0, y: 0.75, width: 0.5, height: 0.25 }, { x: 0.5, y: 0, width: 0.5, height: 0.25 }, { x: 0.5, y: 0.25, width: 0.5, height: 0.25 }, { x: 0.5, y: 0.5, width: 0.5, height: 0.25 }, { x: 0.5, y: 0.75, width: 0.5, height: 0.25 }] },
    );
  }

  // === 9张图模版 ===
  if (imageCount === 9) {
    templates.push(
      // 九宫格
      { id: `9-${ratio}-grid`, name: '九宫格', imageCount: 9, ratio: ratio as any, type: 'equal', cells: [{ x: 0, y: 0, width: 1/3, height: 1/3 }, { x: 1/3, y: 0, width: 1/3, height: 1/3 }, { x: 2/3, y: 0, width: 1/3, height: 1/3 }, { x: 0, y: 1/3, width: 1/3, height: 1/3 }, { x: 1/3, y: 1/3, width: 1/3, height: 1/3 }, { x: 2/3, y: 1/3, width: 1/3, height: 1/3 }, { x: 0, y: 2/3, width: 1/3, height: 1/3 }, { x: 1/3, y: 2/3, width: 1/3, height: 1/3 }, { x: 2/3, y: 2/3, width: 1/3, height: 1/3 }] },
    );
  }
  
  return templates;
}

// 获取所有可用比例
export function getAvailableRatios(): string[] {
  return ['1:1', '4:3', '3:4', '16:9', '9:16'];
}

// 获取比例字符串（如 "16:9"）
export function parseRatio(ratio: string): [number, number] {
  const [w, h] = ratio.split(':').map(Number);
  return [w, h];
}

// 计算模板画布尺寸
export function calculateTemplateCanvas(
  template: MergeTemplate,
  maxSize: number = 1200
): { width: number; height: number } {
  const [rw, rh] = parseRatio(template.ratio);
  const aspectRatio = rw / rh;
  
  if (aspectRatio > 1) {
    // 横版
    return { width: maxSize, height: maxSize / aspectRatio };
  } else {
    // 竖版或方形
    return { width: maxSize * aspectRatio, height: maxSize };
  }
}

// 加载图片到 canvas
export async function loadImageToCanvas(
  img: ImageFile,
  canvas: HTMLCanvasElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
        resolve();
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    image.onerror = reject;
    image.src = img.url;
  });
}

// 裁剪并填充图片到目标区域
export async function cropAndFillImage(
  img: ImageFile,
  targetWidth: number,
  targetHeight: number,
  canvas: HTMLCanvasElement,
  offsetX: number,
  offsetY: number,
  gap: number
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = img.url;
  });
  
  // 设置高质量绘制
  ctx.imageSmoothingQuality = 'high';
  
  // 计算裁剪区域（中心裁剪）- 使用 naturalWidth/naturalHeight 从原图完整像素区域
  const imgAspect = image.naturalWidth / image.naturalHeight;
  const targetAspect = targetWidth / targetHeight;
  
  let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;
  
  if (imgAspect > targetAspect) {
    // 图片更宽，裁剪左右
    sw = image.naturalHeight * targetAspect;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    // 图片更高，裁剪上下
    sh = image.naturalWidth / targetAspect;
    sy = (image.naturalHeight - sh) / 2;
  }
  
  // 使用9参数 drawImage 从原图完整像素区域绘制
  // 将gap除以2使用，使相邻cell之间的实际间隙等于用户设置的gap值
  const halfGap = gap / 2;
  ctx.drawImage(
    image,
    sx, sy, sw, sh,  // 源图裁剪区域
    offsetX + halfGap, offsetY + halfGap,  // 目标位置
    targetWidth - gap,  // 目标宽度（减去两侧halfGap）
    targetHeight - gap  // 目标高度（减去两侧halfGap）
  );

}

// 合并图片（模板模式）
export async function mergeWithTemplate(
  images: ImageFile[],
  template: MergeTemplate,
  gap: number
): Promise<string> {
  const { width: canvasWidth, height: canvasHeight } = calculateTemplateCanvas(template, 1200);
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  // 填充白色背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // 绘制每个格子
  for (let i = 0; i < Math.min(images.length, template.cells.length); i++) {
    const cell = template.cells[i];
    const img = images[i];
    
    const cellX = cell.x * canvasWidth;
    const cellY = cell.y * canvasHeight;
    const cellWidth = cell.width * canvasWidth;
    const cellHeight = cell.height * canvasHeight;
    
    await cropAndFillImage(img, cellWidth, cellHeight, canvas, cellX, cellY, gap);
  }
  
  return canvas.toDataURL('image/png');
}

// 合并长图
export async function mergeLongImage(
  images: ImageFile[],
  direction: 'vertical' | 'horizontal',
  gap: number
): Promise<string> {
  // 加载所有图片并获取原始尺寸
  const imageData: { img: HTMLImageElement; naturalWidth: number; naturalHeight: number }[] = [];
  
  for (const imgFile of images) {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = imgFile.url;
    });
    imageData.push({ 
      img: image, 
      naturalWidth: image.naturalWidth, 
      naturalHeight: image.naturalHeight 
    });
  }
  
  let totalWidth: number;
  let totalHeight: number;
  
  if (direction === 'vertical') {
    // 纵向拼接：基准宽度取所有图片 naturalWidth 的最大值
    const maxNaturalWidth = Math.max(...imageData.map(d => d.naturalWidth));
    
    // 计算每张图的缩放后高度
    const scaledHeights = imageData.map(d => 
      Math.round(d.naturalHeight * (maxNaturalWidth / d.naturalWidth))
    );
    const totalScaledHeight = scaledHeights.reduce((a, b) => a + b, 0);
    const totalGaps = gap * (images.length - 1);
    
    // 使用内缩进方式：canvas增加边缘间隙，图片向内缩进halfGap
    const halfGap = gap / 2;
    totalWidth = maxNaturalWidth;
    totalHeight = totalScaledHeight + totalGaps + gap; // 顶部和底部各halfGap
    
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    // 设置高质量绘制
    ctx.imageSmoothingQuality = 'high';
    
    // 填充白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    
    // 绘制图片 - 使用内缩进方式，与模版模式一致
    let currentY = halfGap; // 从顶部halfGap开始
    for (let i = 0; i < imageData.length; i++) {
      const d = imageData[i];
      const scaledWidth = maxNaturalWidth;
      const scaledHeight = scaledHeights[i];
      
      // 9参数 drawImage: 源图完整区域 -> 目标区域（水平方向内缩进）
      ctx.drawImage(
        d.img,
        0, 0, d.naturalWidth, d.naturalHeight,  // 源图完整区域
        halfGap, currentY, scaledWidth - gap, scaledHeight   // 目标区域（内缩进）
      );
      currentY += scaledHeight + gap;
    }
    
    return canvas.toDataURL('image/png');
    
  } else {
    // 横向拼接：基准高度取所有图片 naturalHeight 的最大值
    const maxNaturalHeight = Math.max(...imageData.map(d => d.naturalHeight));
    
    // 计算每张图的缩放后宽度
    const scaledWidths = imageData.map(d => 
      Math.round(d.naturalWidth * (maxNaturalHeight / d.naturalHeight))
    );
    const totalScaledWidth = scaledWidths.reduce((a, b) => a + b, 0);
    const totalGaps = gap * (images.length - 1);
    
    // 使用内缩进方式：canvas增加边缘间隙，图片向内缩进halfGap
    const halfGap = gap / 2;
    totalWidth = totalScaledWidth + totalGaps + gap; // 左侧和右侧各halfGap
    totalHeight = maxNaturalHeight;
    
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    // 设置高质量绘制
    ctx.imageSmoothingQuality = 'high';
    
    // 填充白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    
    // 绘制图片 - 使用内缩进方式，与模版模式一致
    let currentX = halfGap; // 从左侧halfGap开始
    for (let i = 0; i < imageData.length; i++) {
      const d = imageData[i];
      const scaledWidth = scaledWidths[i];
      const scaledHeight = maxNaturalHeight;
      
      // 9参数 drawImage: 源图完整区域 -> 目标区域（垂直方向内缩进）
      ctx.drawImage(
        d.img,
        0, 0, d.naturalWidth, d.naturalHeight,  // 源图完整区域
        currentX, halfGap, scaledWidth, scaledHeight - gap   // 目标区域（内缩进）
      );
      currentX += scaledWidth + gap;
    }
    
    return canvas.toDataURL('image/png');
  }
}

// 合并自定义拼接 - 新设计：根据行配置计算布局
export async function mergeCustom(
  images: ImageFile[],
  rowConfig: { rowCount: number; row1Count: number; row2Count: number; row3Count: number },
  gap: number = 0
): Promise<string> {
  if (images.length === 0) {
    throw new Error('No images provided');
  }

  // 按行分组
  const rows: string[][] = [];
  let currentIndex = 0;
  
  // 第1行
  rows.push(images.slice(0, rowConfig.row1Count).map(i => i.id));
  currentIndex = rowConfig.row1Count;
  
  // 第2行
  rows.push(images.slice(currentIndex, currentIndex + rowConfig.row2Count).map(i => i.id));
  currentIndex += rowConfig.row2Count;
  
  // 第3行（如果有）
  if (rowConfig.rowCount === 3) {
    rows.push(images.slice(currentIndex).map(i => i.id));
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
        aspectRatio: image.naturalWidth / image.naturalHeight,
        img: image
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
        totalWidth += gap; // 添加间隙
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
    const totalGap = (row.length - 1) * gap;
    return (baseTotalWidth - totalGap) / totalAspectRatio;
  });

  // 使用内缩进方式：canvas增加边缘间隙，与模版模式一致
  const halfGap = gap / 2;

  // 计算每行的列宽（用于计算canvas宽度和绘制位置）
  const rowColumnWidths = rows.map((row, rowIndex) => {
    const rowHeight = rowHeights[rowIndex];
    return row.map(imgId => {
      const data = getImageData(imgId);
      return rowHeight * data.aspectRatio;
    });
  });

  // 计算canvas总宽度和总高度（按照用户给出的正确公式）
  // canvas总宽度 = 所有列宽之和 + (列数-1)*gap + gap（左右各halfGap）
  // 需要找出列数最多的那一行，以确定canvas宽度
  const maxColumnTotalWidth = Math.max(...rowColumnWidths.map(widths =>
    widths.reduce((sum, w) => sum + w, 0)
  ));
  const maxColCount = rows.length > 0 ? Math.max(...rows.map(row => row.length)) : 0;
  const canvasWidth = Math.ceil(maxColumnTotalWidth + (maxColCount - 1) * gap + gap);

  // canvas总高度 = 所有行高之和 + (行数-1)*gap + gap（上下各halfGap）
  const canvasHeight = Math.ceil(
    rowHeights.reduce((sum, h) => sum + h, 0) + (rows.length - 1) * gap + gap
  );

  // 创建画布
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // 设置高质量绘制
  ctx.imageSmoothingQuality = 'high';

  // 填充白色背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 绘制图片 - 使用正确的计算公式
  // 每张图片的绘制起始Y = halfGap + 该图片所在行之前所有行的高度之和 + 该图片所在行之前的行间隙数 × gap
  let currentY = halfGap;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const rowHeight = rowHeights[rowIndex];
    const colWidths = rowColumnWidths[rowIndex];

    // 每张图片的绘制起始X = halfGap + 该图片所在列之前所有列的宽度之和 + 该图片所在列之前的列间隙数 × gap
    let currentX = halfGap;

    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const imgId = row[colIndex];
      const data = getImageData(imgId);
      const scaledWidth = colWidths[colIndex];

      // 9参数 drawImage: 从原图完整像素区域绘制到目标区域
      // 目标区域使用原始计算尺寸，不额外减去gap
      ctx.drawImage(
        data.img,
        0, 0, data.naturalWidth, data.naturalHeight,  // 源图完整区域
        currentX, currentY, scaledWidth, rowHeight     // 目标区域（不使用内缩进）
      );

      // 移动到下一列：当前列宽度 + gap
      currentX += scaledWidth + gap;
    }

    // 移动到下一行：当前行高度 + gap
    currentY += rowHeight + gap;
  }

  return canvas.toDataURL('image/png');
}

// 下载图片
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 复制图片到剪贴板
export async function copyImageToClipboard(dataUrl: string): Promise<void> {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('Invalid image data URL');
  }

  try {
    // 将 data URL 转换为 Blob，避免使用 fetch
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: mimeString });

    await navigator.clipboard.write([
      new ClipboardItem({ [mimeString]: blob })
    ]);
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    throw error;
  }
}

// 导出为指定格式
export async function exportImage(
  dataUrl: string,
  format: 'png' | 'jpeg',
  quality: 'high' | 'medium' | 'low' = 'high'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const qualityMap = { high: 0.95, medium: 0.7, low: 0.4 };
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      
      resolve(canvas.toDataURL(mimeType, qualityMap[quality]));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
