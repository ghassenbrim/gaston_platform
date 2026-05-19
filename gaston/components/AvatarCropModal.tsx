"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
    src: string;
    onConfirm: (blob: Blob) => void;
    onCancel: () => void;
}

const PREVIEW_SIZE = 280;
const OUTPUT_SIZE = 400;

export default function AvatarCropModal({ src, onConfirm, onCancel }: Props) {
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
    const dragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });
    const imgRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            const minScale = Math.max(PREVIEW_SIZE / img.naturalWidth, PREVIEW_SIZE / img.naturalHeight);
            setScale(minScale);
            setPos({
                x: (PREVIEW_SIZE - img.naturalWidth * minScale) / 2,
                y: (PREVIEW_SIZE - img.naturalHeight * minScale) / 2,
            });
            setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
            imgRef.current = img;
        };
        img.src = src;
    }, [src]);

    const clampPos = useCallback((x: number, y: number, s: number) => {
        const imgW = imgSize.w * s;
        const imgH = imgSize.h * s;
        return {
            x: Math.min(0, Math.max(x, PREVIEW_SIZE - imgW)),
            y: Math.min(0, Math.max(y, PREVIEW_SIZE - imgH)),
        };
    }, [imgSize]);

    const applyZoom = useCallback((delta: number) => {
        setScale(s => {
            const minScale = Math.max(PREVIEW_SIZE / Math.max(imgSize.w, 1), PREVIEW_SIZE / Math.max(imgSize.h, 1));
            const newScale = Math.min(5, Math.max(minScale, s + delta));
            setPos(p => clampPos(p.x, p.y, newScale));
            return newScale;
        });
    }, [imgSize, clampPos]);

    const handleMouseDown = (e: React.MouseEvent) => {
        dragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging.current) return;
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        setPos(p => clampPos(p.x + dx, p.y + dy, scale));
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        applyZoom(-e.deltaY * 0.001);
    };

    // Touch drag
    const lastTouch = useRef<{ x: number; y: number } | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1)
            lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 1 && lastTouch.current) {
            const dx = e.touches[0].clientX - lastTouch.current.x;
            const dy = e.touches[0].clientY - lastTouch.current.y;
            lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            setPos(p => clampPos(p.x + dx, p.y + dy, scale));
        }
    };

    const handleConfirm = () => {
        if (!imgRef.current || imgSize.w === 0) return;
        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext("2d")!;
        ctx.beginPath();
        ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();
        const ratio = OUTPUT_SIZE / PREVIEW_SIZE;
        ctx.drawImage(
            imgRef.current,
            pos.x * ratio,
            pos.y * ratio,
            imgSize.w * scale * ratio,
            imgSize.h * scale * ratio
        );
        canvas.toBlob(blob => { if (blob) onConfirm(blob); }, "image/jpeg", 0.92);
    };

    const minScale = imgSize.w > 0 ? Math.max(PREVIEW_SIZE / imgSize.w, PREVIEW_SIZE / imgSize.h) : 1;
    const pct = minScale > 0 ? Math.round((scale / minScale) * 100) : 100;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl w-full max-w-sm">
                <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-slate-500">Cadrer la photo</h3>

                {/* Circular crop zone */}
                <div
                    className="relative overflow-hidden rounded-full border-4 border-[#bca086] cursor-grab active:cursor-grabbing select-none shadow-xl"
                    style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={() => { dragging.current = false; }}
                    onMouseLeave={() => { dragging.current = false; }}
                    onWheel={handleWheel}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => { lastTouch.current = null; }}
                >
                    {imgSize.w > 0 && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={src}
                            alt="crop"
                            draggable={false}
                            style={{
                                position: "absolute",
                                left: pos.x,
                                top: pos.y,
                                width: imgSize.w * scale,
                                height: imgSize.h * scale,
                                userSelect: "none",
                                pointerEvents: "none",
                            }}
                        />
                    )}
                    {imgSize.w === 0 && (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-zinc-800">
                            <div className="w-8 h-8 border-4 border-[#bca086] border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Zoom controls */}
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => applyZoom(-0.15)}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300 transition-colors"
                    >−</button>
                    <div className="flex flex-col items-center gap-1 w-20">
                        <span className="text-sm font-bold text-[#bca086]">{pct}%</span>
                        <div className="w-full h-1 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#bca086] rounded-full transition-all"
                                style={{ width: `${Math.min(100, ((scale - minScale) / (5 - minScale)) * 100)}%` }}
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => applyZoom(0.15)}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300 transition-colors"
                    >+</button>
                </div>

                <p className="text-[10px] text-slate-400 tracking-wide">Glissez pour repositionner · Scroll ou +/− pour zoomer</p>

                <div className="flex gap-3 w-full">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 text-sm font-semibold transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="flex-1 py-3 rounded-2xl bg-[#bca086] text-white hover:bg-[#a8896e] text-sm font-semibold transition-colors shadow-lg shadow-[#bca086]/30"
                    >
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    );
}
