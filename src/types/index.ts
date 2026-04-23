// 图片类型
export interface ImageFile {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
}

// 可序列化的图片类型（用于跨页面传递）
export interface SerializableImage {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
}

// 拼接模式
export type MergeMode = 'template' | 'long-image' | 'custom';

// 长图拼接方向
export type LongImageDirection = 'vertical' | 'horizontal';

// 模板比例
export type TemplateRatio = 
  | '21:9' | '16:9' | '3:2' | '4:3' | '1:1' 
  | '3:4' | '2:3' | '9:16' | '9:21';

// 模板类型
export type TemplateType = 'equal' | 'highlight' | 'mixed';

// 拼接模板
export interface MergeTemplate {
  id: string;
  name: string;
  imageCount: number;
  ratio: TemplateRatio;
  type: TemplateType;
  // 布局配置：每个格子的位置和大小（百分比）
  cells: CellConfig[];
}

// 格子配置
export interface CellConfig {
  x: number; // 左上角 x 百分比
  y: number; // 左上角 y 百分比
  width: number; // 宽度百分比
  height: number; // 高度百分比
}

// 自定义模式中的图片位置
export interface CustomImagePosition {
  imageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// 导出格式
export type ExportFormat = 'png' | 'jpeg';

// JPEG 质量档位
export type JpegQuality = 'high' | 'medium' | 'low';

// 自定义模式配置
export interface CustomModeConfig {
  rowCount: 2 | 3; // 行数
  row1Count: number; // 第1行图片数
  row2Count: number; // 第2行图片数
  row3Count: number; // 第3行图片数（仅3行模式）
}

// 预览状态
export interface PreviewState {
  canvas: string; // base64 预览图
  width: number;
  height: number;
}

// 编辑器状态
export interface EditorState {
  images: ImageFile[];
  mode: MergeMode | null;
  // 模板模式
  selectedTemplate: MergeTemplate | null;
  // 长图模式
  longImageDirection: LongImageDirection;
  // 自定义模式
  customPositions: CustomImagePosition[];
  // 通用
  gap: number; // 间隙（px）
}
