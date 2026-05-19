"use client";

import React, { useRef, useState, useEffect } from "react";

interface AudioPlayerProps {
    src: string;
    isMe: boolean; // true = bulle marron (admin/sent), false = bulle blanche (reçu)
}

export function AudioPlayer({ src, isMe }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying]   = useState(false);
    const [current, setCurrent]   = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const a = audioRef.current;
        if (!a) return;
        const onTime   = () => setCurrent(a.currentTime);
        const onLoaded = () => setDuration(a.duration);
        const onEnded  = () => { setPlaying(false); setCurrent(0); };
        a.addEventListener("timeupdate",        onTime);
        a.addEventListener("loadedmetadata",    onLoaded);
        a.addEventListener("durationchange",    onLoaded);
        a.addEventListener("ended",             onEnded);
        return () => {
            a.removeEventListener("timeupdate",     onTime);
            a.removeEventListener("loadedmetadata", onLoaded);
            a.removeEventListener("durationchange", onLoaded);
            a.removeEventListener("ended",          onEnded);
        };
    }, []);

    const toggle = () => {
        const a = audioRef.current;
        if (!a) return;
        if (playing) { a.pause(); setPlaying(false); }
        else         { a.play();  setPlaying(true);  }
    };

    const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const a = audioRef.current;
        if (!a) return;
        a.currentTime = Number(e.target.value);
        setCurrent(Number(e.target.value));
    };

    const fmt = (s: number) => {
        if (!isFinite(s)) return "0:00";
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60).toString().padStart(2, "0");
        return `${m}:${sec}`;
    };

    const pct = duration > 0 ? (current / duration) * 100 : 0;

    // Couleurs selon la bulle
    const playBtn  = isMe ? "bg-white/20 hover:bg-white/30 text-white" : "bg-[#bca086]/15 hover:bg-[#bca086]/25 text-[#bca086]";
    const timeText = isMe ? "text-white/70" : "text-slate-400";
    const trackBg  = isMe ? "bg-white/30" : "bg-slate-200";
    const trackFill = isMe ? "bg-white" : "bg-[#bca086]";

    return (
        <div className="flex items-center gap-2 w-[200px]">
            <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

            {/* Play / Pause */}
            <button type="button" onClick={toggle}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${playBtn}`}>
                {playing ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <rect x="5" y="4" width="3" height="12" rx="1"/>
                        <rect x="12" y="4" width="3" height="12" rx="1"/>
                    </svg>
                ) : (
                    <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                    </svg>
                )}
            </button>

            {/* Progress + durée */}
            <div className="flex-1 flex flex-col gap-0.5">
                {/* Barre */}
                <div className="relative h-1.5 w-full">
                    <div className={`absolute inset-0 rounded-full ${trackBg}`} />
                    <div className={`absolute left-0 top-0 h-full rounded-full transition-all ${trackFill}`}
                        style={{ width: `${pct}%` }} />
                    <input type="range" min={0} max={duration || 1} step={0.1} value={current}
                        onChange={seek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                {/* Temps */}
                <span className={`text-[10px] leading-none ${timeText}`}>
                    {fmt(current)} / {fmt(duration)}
                </span>
            </div>
        </div>
    );
}
