"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Playfair_Display } from "next/font/google";
import dynamic from "next/dynamic";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { usePresence } from "@/hooks/usePresence";
import { AudioPlayer } from "@/hooks/useAudioPlayer";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

interface ReplyPreview {
    id: string;
    content: string;
    mediaType?: string | null;
    sender: { name: string | null; role: string };
}

interface Message {
    id: string;
    content: string;
    mediaUrl?: string | null;
    mediaType?: string | null;
    fileName?: string | null;
    isPinned?: boolean;
    isDeleted?: boolean;
    isRead?: boolean;
    reaction?: string | null;
    replyTo?: ReplyPreview | null;
    createdAt: string;
    sender: { id: string; name: string | null; role: string };
}

export default function MessageBoxPage() {
    const [messages,    setMessages]    = useState<Message[]>([]);
    const [adminName,   setAdminName]   = useState("Administration");
    const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
    const [input,       setInput]       = useState("");
    const [isSending,   setIsSending]   = useState(false);
    const [isLoading,   setIsLoading]   = useState(true);
    const [showEmoji,   setShowEmoji]   = useState(false);
    const [adminId,     setAdminId]     = useState<string | null>(null);
    const [isAdminOnline, setIsAdminOnline] = useState(false);

    usePresence();

    // Voice Review State
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioUrl,  setAudioUrl]  = useState<string | null>(null);

    const messagesEndRef       = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef         = useRef<HTMLInputElement>(null);
    const inputRef             = useRef<HTMLInputElement>(null);

    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const handleMessagesScroll = () => {
        const el = messagesContainerRef.current;
        if (!el) return;
        setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
    };

    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, message: Message } | null>(null);
    const [replyTo,     setReplyTo]     = useState<Message | null>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevMsgCount = useRef(0);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    const handleVoiceStop = useCallback((file: File, url: string) => {
        setAudioFile(file);
        setAudioUrl(url);
    }, []);

    const voice = useVoiceRecorder({ onStop: handleVoiceStop });

    const loadMessages = useCallback(async () => {
        try {
            const res  = await fetch("/api/user/messages", { cache: "no-store" });
            const data = await res.json();
            if (data.success) {
                setMessages(prev => JSON.stringify(prev) === JSON.stringify(data.messages) ? prev : data.messages);
                setAdminName(data.adminName || "Administration");
                if (data.adminId) setAdminId(data.adminId);
                if (data.adminAvatar) setAdminAvatar(data.adminAvatar);
                
                // Marquer comme lu
                const unreadIds = data.messages.filter((m: Message) => !m.isRead && m.sender.role === "ADMIN").map((m: Message) => m.id);
                if (unreadIds.length > 0) {
                    fetch("/api/messages/read", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unreadIds }) });
                }
            }
        } finally { setIsLoading(false); }
    }, []);

    useEffect(() => { loadMessages(); }, [loadMessages]);
    useEffect(() => { const iv = setInterval(loadMessages, 3000); return () => clearInterval(iv); }, [loadMessages]);
    useEffect(() => { 
        if (messages.length > prevMsgCount.current) {
            scrollToBottom(); 
        }
        prevMsgCount.current = messages.length;
    }, [messages]);

    useEffect(() => {
        if (!adminId) return;
        const fetchPresence = async () => {
            try {
                const res = await fetch("/api/presence");
                const data = await res.json();
                if (data.success && data.onlineIds) {
                    setIsAdminOnline(data.onlineIds.includes(adminId));
                }
            } catch (err) { }
        };
        fetchPresence();
        const iv = setInterval(fetchPresence, 15000);
        return () => clearInterval(iv);
    }, [adminId]);

    const sendMessage = async (content: string, media?: { mediaUrl: string; mediaType: string; fileName?: string }) => {
        if (isSending) return;
        setIsSending(true);
        const currentReplyToId = replyTo?.id ?? undefined;
        try {
            const res  = await fetch("/api/user/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, ...media, replyToId: currentReplyToId }),
            });
            const data = await res.json();
            if (data.success) { setInput(""); setShowEmoji(false); setReplyTo(null); await loadMessages(); }
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

    const cancelVoice = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioFile(null);
        setAudioUrl(null);
    };

    const handleSendVoice = async () => {
        if (!audioFile) return;
        try {
            const fd = new FormData();
            fd.append("file", audioFile);
            const res  = await fetch("/api/messages/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (data.success) {
                await sendMessage("", { mediaUrl: data.url, mediaType: "audio", fileName: data.fileName });
                cancelVoice();
            }
        } catch (err) {
            console.error("Erreur envoi vocal:", err);
        }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        if (d.toDateString() === new Date().toDateString())
            return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    };

    const renderMedia = (msg: Message, isMe: boolean) => {
        if (msg.isDeleted) return null;
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
            return <AudioPlayer src={msg.mediaUrl} isMe={isMe} />;
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

    /* ─── INTERACTIONS ─── */
    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent, message: Message) => {
        if (message.isDeleted) return;
        const startX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const startY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        if (pressTimer.current) clearTimeout(pressTimer.current);
        pressTimer.current = setTimeout(() => { setContextMenu({ x: startX, y: startY, message }); }, 500);
    };

    const handleTouchEnd = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };

    const handleContextMenu = (e: React.MouseEvent, message: Message) => {
        if (message.isDeleted) return;
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, message });
    };

    const runAction = async (action: 'pin' | 'delete' | 'copy' | 'react', emoji?: string) => {
        if (!contextMenu) return;
        const { message } = contextMenu;
        setContextMenu(null);

        if (action === 'copy') {
            if (message.content) navigator.clipboard.writeText(message.content);
            return;
        }

        const prevMsgs = [...messages];
        if (action === 'pin') {
            const newPinned = !message.isPinned;
            setMessages(m => m.map(x => x.id === message.id ? { ...x, isPinned: newPinned } : x));
            await fetch(`/api/messages/${message.id}`, { method: 'PATCH', body: JSON.stringify({ isPinned: newPinned }) });
        } else if (action === 'delete') {
            setMessages(m => m.map(x => x.id === message.id ? { ...x, isDeleted: true } : x));
            await fetch(`/api/messages/${message.id}`, { method: 'DELETE' });
        } else if (action === 'react' && emoji) {
            const currentReaction = message.reaction;
            const newReaction = currentReaction === emoji ? null : emoji;
            setMessages(m => m.map(x => x.id === message.id ? { ...x, reaction: newReaction } : x));
            await fetch(`/api/messages/${message.id}`, { method: 'PATCH', body: JSON.stringify({ reaction: newReaction }) });
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-zinc-950" onClick={() => setShowEmoji(false)}>

            {/* ── Header ── */}
            <header className="h-[60px] px-4 bg-white dark:bg-zinc-900 border-b border-black/5 dark:border-white/5 flex items-center gap-3 shrink-0 shadow-sm">
                <div className="relative shrink-0">
                    {adminAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={adminAvatar} alt={adminName} className="w-10 h-10 rounded-full object-cover shadow" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#bca086] to-[#8c6b50] text-white flex items-center justify-center font-bold text-base shadow">
                            {adminName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    {isAdminOnline && (
                        <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-zinc-900" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] text-slate-900 dark:text-white truncate leading-tight">{adminName}</p>
                    <p className={`text-[12px] leading-tight ${isAdminOnline ? "text-emerald-500 font-medium" : "text-slate-400"}`}>
                        {isAdminOnline ? "En ligne" : "Hors ligne"}
                    </p>
                </div>
            </header>

            {/* ── Messages ── */}
            <div className="relative flex-1 overflow-hidden">
            <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="h-full overflow-y-auto py-4 px-3">
                {isLoading ? (
                    <div className="flex justify-center pt-10">
                        <div className="w-7 h-7 border-2 border-[#bca086]/30 border-t-[#bca086] rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
                        {adminAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={adminAvatar} alt={adminName} className="w-20 h-20 rounded-full object-cover shadow-lg" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#bca086] to-[#8c6b50] text-white flex items-center justify-center font-bold text-3xl shadow-lg">
                                {adminName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{adminName}</p>
                        <p className="text-sm text-slate-400">Démarrez la conversation</p>
                    </div>
                ) : (
                    (() => {
                        let lastDate = "";
                        return messages.map((msg, index) => {
                            const isMe = msg.sender.role !== "ADMIN";
                            const d = new Date(msg.createdAt);
                            const dateStr = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
                            const showDate = dateStr !== lastDate;
                            lastDate = dateStr;

                            const prev = messages[index - 1];
                            const next = messages[index + 1];
                            const prevDateStr = prev ? new Date(prev.createdAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "";
                            const nextDateStr = next ? new Date(next.createdAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "";
                            const sameAsPrev = !showDate && !!prev && prev.sender.role === msg.sender.role && prevDateStr === dateStr;
                            const sameAsNext = !!next && next.sender.role === msg.sender.role && nextDateStr === dateStr;

                            // WhatsApp-style corner radius
                            const tr = isMe && sameAsPrev ? "rounded-tr-[5px]" : "";
                            const br = isMe && sameAsNext ? "rounded-br-[5px]" : "";
                            const tl = !isMe && sameAsPrev ? "rounded-tl-[5px]" : "";
                            const bl = !isMe && sameAsNext ? "rounded-bl-[5px]" : "";
                            const bubbleRadius = `rounded-[18px] ${tr} ${br} ${tl} ${bl}`;
                            const hasReaction = !!(msg.reaction && !msg.isDeleted);
                            const gap = hasReaction ? "mb-5" : sameAsNext ? "mb-[2px]" : "mb-[6px]";

                            return (
                                <React.Fragment key={msg.id}>
                                    {showDate && (
                                        <div className="flex justify-center my-4">
                                            <span className="text-[11px] font-medium text-slate-500 bg-white/90 dark:bg-zinc-800/90 px-3 py-1 rounded-full shadow-sm">
                                                {dateStr}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`group flex ${isMe ? "justify-end" : "justify-start"} items-end gap-1.5 ${gap}`}>
                                        {/* Bouton répondre — côté gauche pour mes messages */}
                                        {isMe && !msg.isDeleted && (
                                            <button onClick={() => setReplyTo(msg)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-[#bca086] hover:bg-slate-100 shrink-0 mb-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                </svg>
                                            </button>
                                        )}

                                        {/* Avatar reçu — visible seulement sur le dernier msg du groupe */}
                                        {!isMe && (
                                            <div className="w-7 shrink-0">
                                                {!sameAsNext ? (
                                                    adminAvatar ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={adminAvatar} alt={adminName} className="w-7 h-7 rounded-full object-cover shadow-sm" />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#bca086] to-[#8c6b50] text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                                                            {adminName.charAt(0).toUpperCase()}
                                                        </div>
                                                    )
                                                ) : null}
                                            </div>
                                        )}

                                        <div className={`max-w-[72%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                            {msg.isPinned && (
                                                <div className="flex items-center gap-1 mb-1 text-[10px] font-bold text-emerald-500 uppercase px-1">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
                                                    Épinglé
                                                </div>
                                            )}

                                            {/* Bulle + réaction */}
                                            <div className="relative">
                                                <div
                                                    onContextMenu={(e) => handleContextMenu(e, msg)}
                                                    onTouchStart={(e) => handleTouchStart(e, msg)}
                                                    onTouchEnd={handleTouchEnd}
                                                    onTouchMove={handleTouchEnd}
                                                    onMouseDown={(e) => handleTouchStart(e, msg)}
                                                    onMouseUp={handleTouchEnd}
                                                    onMouseLeave={handleTouchEnd}
                                                    className={`px-3.5 py-2 text-[14px] leading-relaxed cursor-pointer select-text transition-opacity
                                                        ${bubbleRadius}
                                                        ${msg.isDeleted
                                                            ? "bg-transparent border border-slate-200 dark:border-zinc-700 text-slate-400 italic text-[13px]"
                                                            : isMe
                                                                ? "bg-[#bca086] text-white"
                                                                : "bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 shadow-sm"
                                                        }
                                                        ${contextMenu?.message.id === msg.id ? "opacity-70 scale-[0.98]" : ""}`}>

                                                    {/* Preview réponse */}
                                                    {!msg.isDeleted && msg.replyTo && (
                                                        <div className={`flex gap-1.5 mb-1.5 rounded-lg px-2 py-1.5 text-[12px] ${isMe ? "bg-black/10" : "bg-black/5"}`}>
                                                            <div className={`w-0.5 rounded-full shrink-0 ${isMe ? "bg-white/60" : "bg-[#bca086]"}`} />
                                                            <div className="min-w-0">
                                                                <p className={`font-semibold text-[11px] truncate ${isMe ? "text-white/80" : "text-[#bca086]"}`}>
                                                                    {msg.replyTo.sender.role === "ADMIN" ? adminName : "Vous"}
                                                                </p>
                                                                <p className={`truncate ${isMe ? "text-white/60" : "text-slate-500"}`}>
                                                                    {msg.replyTo.content || (msg.replyTo.mediaType === "audio" ? "🎙️ Vocal" : msg.replyTo.mediaType === "image" ? "🖼️ Image" : "📎 Fichier")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {msg.isDeleted ? (
                                                        <div className="flex items-center gap-1.5 text-[13px]">
                                                            <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                                                            </svg>
                                                            Message supprimé
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {renderMedia(msg, isMe)}
                                                            {msg.content && <p>{msg.content}</p>}
                                                        </>
                                                    )}

                                                    {/* Heure + statut DANS la bulle (style WhatsApp) */}
                                                    {!msg.isDeleted && (
                                                        <div className={`flex items-center justify-end gap-1 mt-1 -mb-0.5 min-w-[50px]`}>
                                                            <span className={`text-[10px] leading-none ${isMe ? "text-white/60" : "text-slate-400"}`}>
                                                                {formatTime(msg.createdAt)}
                                                            </span>
                                                            {isMe && (
                                                                msg.isRead ? (
                                                                    /* Double check bleu = Vu */
                                                                    <svg className="w-[15px] h-[15px] text-sky-200 shrink-0" viewBox="0 0 18 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M1 5.5L5 9.5L11 2"/>
                                                                        <path d="M6 5.5L10 9.5L16 2"/>
                                                                    </svg>
                                                                ) : (
                                                                    /* Simple check blanc = Envoyé */
                                                                    <svg className="w-[13px] h-[13px] text-white/60 shrink-0" viewBox="0 0 12 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M1 4.5L4.5 8L11 1"/>
                                                                    </svg>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Réaction collée au coin */}
                                                {msg.reaction && !msg.isDeleted && (
                                                    <div className={`absolute -bottom-3 ${isMe ? '-right-1' : '-left-1'} bg-white dark:bg-zinc-800 rounded-full shadow-md border border-slate-100 dark:border-zinc-700 w-[22px] h-[22px] flex items-center justify-center text-xs animate-in zoom-in cursor-pointer hover:scale-110 transition-transform`}
                                                        onClick={() => { setContextMenu({ x: 0, y: 0, message: msg }); runAction('react', msg.reaction!); }}>
                                                        {msg.reaction}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bouton répondre — côté droit pour messages reçus */}
                                        {!isMe && !msg.isDeleted && (
                                            <button onClick={() => setReplyTo(msg)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-[#bca086] hover:bg-slate-100 shrink-0 mb-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                        });
                    })()
                )}
                <div ref={messagesEndRef} />
            </div>
            {showScrollBtn && (
                <button onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })} className="absolute bottom-4 right-4 z-10 w-10 h-10 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-black/5 dark:border-white/10 text-slate-500 hover:text-[#bca086] transition-all hover:scale-105 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
            )}
            </div>

            {/* ── Menu Contextuel ── */}
            {contextMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={(e) => { e.stopPropagation(); setContextMenu(null); }}
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
                        onTouchStart={(e) => { e.stopPropagation(); setContextMenu(null); }}
                    />
                    <div
                        className="fixed z-50 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl shadow-black/15 dark:shadow-black/50 border border-black/5 dark:border-white/10 py-2 w-52 animate-in zoom-in-95 fade-in duration-150"
                        style={{ left: Math.min(contextMenu.x, window.innerWidth - 220), top: Math.min(contextMenu.y, window.innerHeight - 260) }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-around px-4 pb-3 mb-1 border-b border-black/5 dark:border-white/10 text-xl">
                            {['👍', '❤️', '😂', '😮', '😢', '👏'].map(emoji => (
                                <button key={emoji} onClick={() => runAction('react', emoji)} className="hover:scale-125 transition-transform active:scale-90">
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        {contextMenu.message.content && (
                            <button onClick={() => runAction('copy')} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors flex items-center gap-3">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                Copier
                            </button>
                        )}
                        <button onClick={() => runAction('pin')} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors flex items-center gap-3">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                            {contextMenu.message.isPinned ? "Désépingler" : "Épingler"}
                        </button>
                        {contextMenu.message.sender.role !== 'ADMIN' && (
                            <button onClick={() => runAction('delete')} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center gap-3">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Supprimer
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* ── Zone saisie ── */}
            <div className="relative px-3 py-2 bg-[#f0f2f5] dark:bg-zinc-900 shrink-0">
                {/* Enregistrement */}
                {voice.isRecording && (
                    <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 rounded-full px-4 py-2.5 mb-2 shadow-md border border-slate-100 dark:border-zinc-700 animate-in slide-in-from-bottom-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">Enregistrement...</span>
                        <span className="text-sm font-mono text-rose-500">{voice.fmt(voice.seconds)}</span>
                        <button type="button" onClick={voice.stop} className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shrink-0">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><rect x="5" y="5" width="10" height="10" rx="1" /></svg>
                        </button>
                    </div>
                )}

                {/* Erreur vocal */}
                {voice.error && (
                    <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl px-3 py-2 mb-2 animate-in slide-in-from-bottom-2">
                        <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-sm text-rose-700 dark:text-rose-300 flex-1">{voice.error}</span>
                        <button type="button" onClick={voice.clearError} className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-500 flex items-center justify-center hover:bg-rose-200 dark:hover:bg-rose-800 transition-colors shrink-0">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                {/* Preview vocal */}
                {audioUrl && !voice.isRecording && (
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-2xl px-3 py-2 mb-2 shadow-md border border-slate-100 dark:border-zinc-700 animate-in slide-in-from-bottom-2">
                        <button type="button" onClick={cancelVoice} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-700 text-slate-500 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="flex-1"><audio src={audioUrl} controls className="w-full h-8" /></div>
                        <button type="button" onClick={handleSendVoice} disabled={isSending} className="w-9 h-9 bg-[#bca086] text-white rounded-full flex items-center justify-center hover:bg-[#a8896f] transition-all active:scale-95 disabled:opacity-50 shrink-0">
                            {isSending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
                        </button>
                    </div>
                )}

                {/* Barre répondre */}
                {replyTo && (
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-xl px-3 py-2 mb-2 border-l-4 border-[#bca086] animate-in slide-in-from-bottom-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-[#bca086]">
                                {replyTo.sender.role === "ADMIN" ? adminName : "Vous"}
                            </p>
                            <p className="text-[12px] text-slate-500 truncate">
                                {replyTo.content || (replyTo.mediaType === "audio" ? "🎙️ Vocal" : replyTo.mediaType === "image" ? "🖼️ Image" : "📎 Fichier")}
                            </p>
                        </div>
                        <button onClick={() => setReplyTo(null)} className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                {/* Emoji picker */}
                {showEmoji && (
                    <div className="absolute bottom-full left-0 right-0 sm:left-3 sm:right-auto z-50 mb-2 px-3 sm:px-0" onClick={e => e.stopPropagation()}>
                        <EmojiPicker onEmojiClick={onEmojiClick} height={320} width="100%" searchDisabled previewConfig={{ showPreview: false }} />
                    </div>
                )}

                {/* Barre de saisie */}
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    {/* Pill input avec emoji + attach dedans */}
                    <div className="flex-1 flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-full px-2 py-1.5 shadow-sm min-w-0">
                        <button type="button" onClick={e => { e.stopPropagation(); setShowEmoji(v => !v); }}
                            className={`w-9 h-9 md:w-8 md:h-8 rounded-full flex items-center justify-center text-lg shrink-0 transition-all ${showEmoji ? "text-[#bca086]" : "text-slate-400 hover:text-slate-500"}`}>
                            😊
                        </button>
                        <input
                            ref={inputRef} type="text" value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Message..."
                            disabled={voice.isRecording}
                            className="flex-1 bg-transparent outline-none text-[14px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 min-w-0"
                        />
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="w-9 h-9 md:w-8 md:h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" onChange={handleFileChange} />

                    {/* Bouton envoi / micro */}
                    {input.trim() ? (
                        <button type="submit" disabled={isSending}
                            className="w-11 h-11 md:w-10 md:h-10 bg-[#bca086] text-white rounded-full flex items-center justify-center hover:bg-[#a8896f] transition-all active:scale-95 disabled:opacity-50 shadow-sm shrink-0">
                            {isSending
                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                            }
                        </button>
                    ) : (
                        <button type="button" onClick={voice.toggle} disabled={!voice.isSupported}
                            className={`w-11 h-11 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm
                                ${voice.isRecording ? "bg-rose-500 text-white scale-110" : "bg-white dark:bg-zinc-800 text-slate-400 hover:text-[#bca086]"}
                                ${!voice.isSupported ? "opacity-50 cursor-not-allowed" : ""}`}>
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
