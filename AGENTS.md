# Splicing - 图片拼接工具

## 1. 项目概述

### 产品定位
面向社交媒体内容创作者的极简图片拼接工具，通过直观的拖拽操作和精选模板，帮助用户快速完成跨平台适配的高质量拼图。

### 核心特性
- 三种拼接模式平级：多图模板 / 长图拼接 / 自定义拼接
- 支持拖拽上传、粘贴上传、按钮上传
- 保持原图分辨率，无水印
- 极简操作体验，用完即走

## 2. 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **图片处理**: 原生 Canvas API

## 3. 目录结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx           # 首页（上传入口）
│   ├── editor/
│   │   └── page.tsx       # 编辑器页面
│   └── preview/
│       └── page.tsx       # 预览页面
├── components/
│   ├── upload/            # 上传相关组件
│   │   ├── upload-zone.tsx
│   │   └── image-preview.tsx
│   ├── editor/             # 编辑器组件
│   │   ├── mode-selector.tsx
│   │   ├── template-grid.tsx
│   │   ├── long-image-editor.tsx
│   │   └── custom-editor.tsx
│   ├── preview/            # 预览组件
│   │   └── canvas-preview.tsx
│   └── ui/                 # shadcn/ui 组件
├── hooks/                  # 自定义 Hooks
│   └── use-image-merge.ts
├── lib/                    # 工具库
│   └── utils.ts
└── types/                  # 类型定义
    └── index.ts
```

## 4. 功能规格

### 4.1 图片上传
- 最少 2 张，最多 9 张
- 支持：拖拽上传 / 粘贴上传 / 点击按钮上传
- 不压缩分辨率

### 4.2 三种拼接模式

#### 模式 A：多图拼接模版
- 根据图片数量自动匹配模板选项
- 比例：21:9 / 16:9 / 3:2 / 4:3 / 1:1 / 3:4 / 2:3 / 9:16 / 9:21
- 模板类型：均等排列 / 突出重点 / 兼容异形
- 精选 5-10 个模板/分类

#### 模式 B：长图拼接
- 纵向 / 横向两种方向
- 无固定比例限制

#### 模式 C：自定义拼接
- 画布跟随内容（自动计算最小画布）
- 拖拽调整位置和大小

### 4.3 通用功能
- 预览环节可调整间隙（最小 0px）
- 外围无间隙

### 4.4 导出
- 格式：PNG（无损）/ JPEG（可选质量）
- 尺寸：无限制，保持原图尺寸
- 方式：保存本地 / 复制到剪贴板

## 5. 界面规格

- 配色：微信风格，背景色 #ffffff
- 风格：简约大气，高级感
- 平台：Web（桌面端优先）

## 6. 禁止做的事

1. 不做图片预处理（裁剪/滤镜/文字）
2. 不做账号体系
3. 不加水印
4. 不提供海量模板
5. 不做移动端适配

## 7. 构建命令

- 开发：`pnpm dev`（端口 5000）
- 构建：`pnpm build`
- 启动：`pnpm start`
