import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Splicing',
  description: '一款面向社交媒体内容创作者的极简图片拼接工具，通过直观的拖拽操作和精选模板，帮助用户快速完成跨平台适配的高质量拼图。',
  keywords: ['图片拼接', '拼图工具', '长图拼接', '社交媒体', '内容创作'],
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
