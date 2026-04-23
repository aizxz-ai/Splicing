"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Grid3x3, AlignVerticalJustifyCenter, LayoutGrid } from "lucide-react";
import { UploadZone } from "@/components/upload/upload-zone";
import { useImages } from "@/context/ImageContext";
import { cn } from "@/lib/utils";
import type { ImageFile, MergeMode } from "@/types";

export default function Home() {
    const router = useRouter();
    const { images, setImages, clearImages } = useImages();
    const [selectedMode, setSelectedMode] = useState<MergeMode | null>(null);

    const handleImagesUploaded = useCallback((newImages: ImageFile[]) => {
        setImages(newImages);
    }, [setImages]);

    const handleContinue = useCallback(() => {
        if (images.length < 2 || !selectedMode)
            return;

        const imageUrls = images.map(img => img.url).join(",");

        const params = new URLSearchParams({
            images: imageUrls,
            mode: selectedMode
        });

        router.push(`/editor?${params.toString()}`);
    }, [images, selectedMode, router]);

    const modeOptions = [{
        mode: "template" as MergeMode,
        icon: Grid3x3,
        title: "多图拼接模版",
        description: "选择预设模板，自动排列组合"
    }, {
        mode: "long-image" as MergeMode,
        icon: AlignVerticalJustifyCenter,
        title: "长图拼接",
        description: "纵向或横向拼接，保留原始比例"
    }, {
        mode: "custom" as MergeMode,
        icon: LayoutGrid,
        title: "自定义拼接",
        description: "自由拖拽摆放，随心所欲创作"
    }];

    return (
        <div className="min-h-screen bg-[#ffffff] flex flex-col">
            {}
            <header className="flex-shrink-0 bg-[#ffffff] border-b border-[#f0f0f0]">
                <div className="w-full px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center pl-2">
                        {}
                        <img src="/title.png" alt="Title" className="h-10 w-auto" />
                    </div>
                    <p className="text-sm text-[#8e8e93]">极简图片拼接工具</p>
                </div>
            </header>
            {}
            <main className="flex-1 w-full px-6 py-12 flex flex-col">
                {}
                <section className="w-full max-w-3xl mx-auto mb-12">
                    <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">上传图片</h2>
                    <p
                        className="text-[#8e8e93] mb-6"
                        style={{
                            fontSize: "14px"
                        }}>上传 2-9 张图片开始拼接</p>
                    <UploadZone onImagesUploaded={handleImagesUploaded} maxImages={9} minImages={2} />
                </section>
                {}
                {images.length >= 2 && <section
                    className="w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">选择拼接方式</h2>
                    <p
                        className="text-[#8e8e93] mb-6"
                        style={{
                            fontSize: "14px"
                        }}>提供三大拼图模式，选择最适合你的拼接方式</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {modeOptions.map(option => {
                            const Icon = option.icon;
                            const isDisabled = images.length === 2 && (option.mode === 'template' || option.mode === 'custom');

                            return (
                                <button
                                    key={option.mode}
                                    disabled={isDisabled}
                                    onClick={() => {
                                        if (!isDisabled) {
                                            router.push(`/editor?mode=${option.mode}`);
                                        }
                                    }}
                                    className={cn(
                                        "relative p-6 rounded-xl border-2 text-left transition-all duration-200",
                                        isDisabled
                                            ? "border-[#e5e5e5]/50 bg-[#f5f5f5]/50 cursor-not-allowed opacity-60"
                                            : "border-[#e5e5e5] hover:border-[#000000] hover:bg-[#000000]/5 bg-white"
                                    )}>
                                    <div
                                        className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                                            isDisabled ? "bg-[#e5e5e5]" : "bg-[#f5f5f5]"
                                        )}>
                                        <Icon
                                            className={cn(
                                                "w-6 h-6 transition-colors",
                                                isDisabled ? "text-[#c0c0c0]" : "text-[#8e8e93]"
                                            )} />
                                    </div>
                                    <h3 className={cn(
                                        "text-lg font-semibold mb-1",
                                        isDisabled ? "text-[#8e8e93]" : "text-[#1a1a1a]"
                                    )}>
                                        {option.title}
                                    </h3>
                                    <p
                                        className="text-sm text-[#8e8e93]"
                                        style={{
                                            fontSize: "12px"
                                        }}>
                                        {option.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </section>}
                {}
                <div className="flex-1"></div>
            </main>
            {}
            <footer className="flex-shrink-0 py-6">
                <div className="px-6 text-center">
                    <p className="text-sm text-[#8e8e93]">Splicing - 专注拼接，极简体验
                                                                                                                                  </p>
                </div>
            </footer>
        </div>
    );
}