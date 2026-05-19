"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Playfair_Display } from "next/font/google";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

interface Message {
    id: string;
    content: string;
    mediaUrl?: string | null;
    mediaType?: string | null;
    fileName?: string | null;
    createdAt: string;
    sender: { id: string; name: string | null; role: string };
}

export default function MessageBoxPage() {
    const [messages,    setMessages]   = useState<Message[]>([]);
    const [adminName,   setAdminName]  = useState("Administration");
    const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
    const [input,       setInput]      = useState("");
    const [isSending,  setIsSending]  = useState(false);
    const [isLoading,  setIsLoading]  = useState(true);
    const [showEmoji,  setShowEmoji]  = useState(false);

    // Voice
    const [isRecording, setIsRecording] = useState(false);
    const [recordSecs,  setRecordSecs]  = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef   = useRef<Blob[]>([]);
    const recordTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef   = useRef<HTMLInputElement>(null);
    const inputRef       = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    const loadMessages = useCallback(async () => {
        try {
            const res  = await fetch("/api/user/messages", { cache: "no-store" });
            const data = await res.json();
            if (data.success) {
                setMessages(data.messages);
                setAdminName(data.adminName || "Administration");
                if (data.adminAvatar) setAdminAvatar(data.adminAvatar);
            }
        } finally { setIsLoading(false); setTimeout(scrollToBottom, 100); }
    }, []);

    useEffect(() => { loadMessages(); }, [loadMessages]);
    useEffect(() => { const iv = setInterval(loadMessages, 3000); return () => clearInterval(iv); }, [loadMessages]);
    useEffect(() => { scrollToBottom(); }, [messages]);

    const sendMessage = async (content: string, media?: { mediaUrl: string; mediaType: string; fileName?: string }) => {
        if (isSending) return;
        setIsSending(true);
        try {
            const res  = await fetch("/api/user/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, ...media }),
            });
            const data = await res.json();
            if (data.success) { setInput(""); setShowEmoji(false); await loadMessages(); }
        } finally { setIsSending(false); }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input.trim());
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onEmojiClick = (emojiData: any) => {
        setInput(prev => prev + emojiData.emoji);
        inputRef.current?.focus();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";
        const fd = new FormData();
        fd.append("file", file);
        const res  = await fetch("/api/messages/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.success) sendMessage("", { mediaUrl: data.url, mediaType: data.mediaType, fileName: data.fileName });
    };

    const startRecording = async () => {
        try {
            const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioChunksRef.current = [];
            recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            recorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const file = new File([blob], `vocal_${Date.now()}.webm`, { type: "audio/webm" });
                const fd   = new FormData();
                fd.append("file", file);
                const res  = await fetch("/api/messages/upload", { method: "POST", body: fd });
                const data = await res.json();
                if (data.success) sendMessage("", { mediaUrl: data.url, mediaType: "audio", fileName: data.fileName });
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setRecordSecs(0);
            recordTimerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
        } catch { /* micro refusé */ }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
        setRecordSecs(0);
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        if (d.toDateString() === new Date().toDateString())
            return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    };

    const fmtSecs = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    const renderMedia = (msg: Message, isMe: boolean) => {
        if (!msg.mediaUrl) return null;
        if (msg.mediaType === "image") {
            return (
                <a href={msg.mediaUrl} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={msg.mediaUrl} alt="image" className="max-w-[220px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity" />
                </a>
            );
        }
        if (msg.mediaType === "audio") {
            return (
                <audio controls className="max-w-[220px] h-10"
                    style={{ filter: isMe ? "invert(1) brightness(2)" : undefined }}>
                    <source src={msg.mediaUrl} />
                </audio>
            );
        }
        return (
            <a href={msg.mediaUrl} target="_blank" rel="noreferrer"
                className={`flex items-center gap-2 text-sm font-medium hover:underline ${isMe ? "text-white/90" : "text-slate-700"}`}>
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="truncate max-w-[160px]">{msg.fileName || "Fichier"}</span>
            </a>
        );
    };

    return (
        <div className="p-0 flex flex-col h-full bg-[#f0f2f5] dark:bg-zinc-950" onClick={() => setShowEmoji(false)}>

            {/* Header */}
            <header className="h-16 px-6 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-white/5 flex items-center gap-3 shrink-0 shadow-sm">
                <div className="relative">
                    {adminAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={adminAvatar} alt={adminName} className="w-10 h-10 rounded-2xl object-cover shadow-md" />
                    ) : (
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-md">
                            {adminName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                </div>
                <div>
                    <h2 className={`${playfair.className} text-xl italic text-slate-900 dark:text-white leading-none`}>{adminName}</h2>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">En ligne</p>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                {isLoading ? (
                    <div className="flex justify-center pt-10"><div className="w-8 h-8 border-2 border-[#bca086]/30 border-t-[#bca086] rounded-full animate-spin" /></div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                        {adminAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={adminAvatar} alt={adminName} className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-lg">
                                {adminName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <p className="font-semibold">Démarrez la conversation avec {adminName}</p>
                    </div>
                ) : (
                    (() => {
                        let lastDate = "";
                        return messages.map(msg => {
                            const isMe = msg.sender.role !== "ADMIN";
                            const d = new Date(msg.createdAt);
                            const dateStr = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
                            const showDate = dateStr !== lastDate;
                            lastDate = dateStr;
                            return (
                                <React.Fragment key={msg.id}>
                                    {showDate && (
                                        <div className="flex justify-center my-3">
                                            <span className="text-[11px] font-semibold text-slate-400 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full shadow-sm">
                                                {dateStr}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-0.5`}>
                                        <div className="max-w-[70%]">
                                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                                ${isMe
                                                    ? "bg-[#bca086] text-white rounded-tr-sm"
                                                    : "bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm"}`}>
                                                {renderMedia(msg, isMe)}
                                                {msg.content && <p>{msg.content}</p>}
                                            </div>
                                            <p className={`text-[10px] text-slate-400 mt-0.5 ${isMe ? "text-right" : "text-left"}`}>
                                                {formatTime(msg.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        });
                    })()
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Zone saisie */}
            <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-white/5 shrink-0">
                {isRecording && (
                    <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-2xl px-4 py-3 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        <span className="text-sm font-semibold text-rose-600">Enregistrement...</span>
                        <span className="text-sm font-mono text-rose-500 ml-auto">{fmtSecs(recordSecs)}</span>
                        <button onClick={stopRecording}
                            className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shrink-0">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><rect x="5" y="5" width="10" height="10" rx="1" /></svg>
                        </button>
                    </div>
                )}

                {showEmoji && (
                    <div className="absolute bottom-20 left-0 right-0 sm:left-auto sm:right-6 z-50 px-3 sm:px-0" onClick={e => e.stopPropagation()}>
                        <EmojiPicker onEmojiClick={onEmojiClick} height={320} width="100%" searchDisabled previewConfig={{ showPreview: false }} />
                    </div>
                )}

                <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
                    <button type="button" onClick={e => { e.stopPropagation(); setShowEmoji(v => !v); }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xl transition-colors ${showEmoji ? "bg-[#bca086]/20 text-[#bca086]" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"}`}>
                        😊
                    </button>

                    <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden"
                        accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                        onChange={handleFileChange} />

                    <div className="flex-1 bg-[#f0f2f5] dark:bg-zinc-800 rounded-full px-4 py-2.5 flex items-center">
                        <input ref={inputRef} type="text" value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Écrivez un message..."
                            disabled={isRecording}
                            className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400" />
                    </div>

                    {input.trim() ? (
                        <button type="submit" disabled={isSending}
                            className="w-10 h-10 bg-[#bca086] text-white rounded-full flex items-center justify-center hover:bg-[#a8896f] transition-all active:scale-95 disabled:opacity-50 shrink-0">
                            {isSending
                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            }
                        </button>
                    ) : (
                        <button type="button"
                            onMouseDown={startRecording}
                            onMouseUp={isRecording ? stopRecording : undefined}
                            onTouchStart={startRecording}
                            onTouchEnd={isRecording ? stopRecording : undefined}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0
                                ${isRecording ? "bg-rose-500 text-white scale-110 shadow-lg" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
