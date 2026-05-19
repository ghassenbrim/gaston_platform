"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Playfair_Display } from "next/font/google";
import dynamic from "next/dynamic";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { usePresence } from "@/hooks/usePresence";
import { usePathname } from "next/navigation";
import { AudioPlayer } from "@/hooks/useAudioPlayer";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

interface Conversation {
    userId: string;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
    lastMessage: string;
    lastTime: string;
    unreadCount?: number;
}

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
    sender: { id: string; name: string | null; role: string; avatar?: string | null };
}

interface UserResult {
    id: string;
    name: string | null;
    email: string;
    role: string;
}

const roleLabel: Record<string, { label: string; color: string }> = {
    USER:     { label: "Client",  color: "bg-blue-100 text-blue-600" },
    EMPLOYEE: { label: "Employé", color: "bg-purple-100 text-purple-600" },
    ADMIN:    { label: "Admin",   color: "bg-slate-100 text-slate-600" },
};

const avatarPalette = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-amber-500",
    "from-rose-500 to-pink-500",
    "from-indigo-500 to-blue-500",
    "from-cyan-500 to-sky-500",
    "from-fuchsia-500 to-purple-500",
];
const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarPalette[Math.abs(hash) % avatarPalette.length];
};
const formatLastTime = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export default function AdminMessageBoxPage() {
    const [conversations,  setConversations]  = useState<Conversation[]>([]);
    const [selectedUser,   setSelectedUser]   = useState<Conversation | null>(null);
    const [messages,       setMessages]       = useState<Message[]>([]);
    const [input,          setInput]          = useState("");
    const [isSending,      setIsSending]      = useState(false);
    const [isLoadingConvs, setIsLoadingConvs] = useState(true);
    const [isLoadingMsgs,  setIsLoadingMsgs]  = useState(false);
    const [search,         setSearch]         = useState("");
    const [searchResults,  setSearchResults]  = useState<UserResult[]>([]);
    const [isSearching,    setIsSearching]    = useState(false);
    const [showEmoji,      setShowEmoji]      = useState(false);

    const messagesEndRef       = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef         = useRef<HTMLInputElement>(null);
    const searchTimer          = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef             = useRef<HTMLInputElement>(null);

    const [onlineUsers,   setOnlineUsers]   = useState<Set<string>>(new Set());
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, message: Message } | null>(null);
    const [replyTo,     setReplyTo]     = useState<Message | null>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevMsgCount = useRef(0);

    usePresence();

    const pathname = usePathname();
    useEffect(() => { setSelectedUser(null); }, [pathname]);

    // Voice Review State
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioUrl,  setAudioUrl]  = useState<string | null>(null);

    const handleVoiceStop = useCallback((file: File, url: string) => {
        setAudioFile(file);
        setAudioUrl(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const voice = useVoiceRecorder({ onStop: handleVoiceStop });
    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => messagesEndRef.current?.scrollIntoView({ behavior });
    const handleMessagesScroll = () => {
        const el = messagesContainerRef.current;
        if (!el) return;
        setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
    };


    // Refs pour accéder aux valeurs dans les callbacks
    const selectedUserRef      = useRef<typeof selectedUser>(null);
    const loadConversationsRef = useRef<(() => void) | null>(null);

    const loadConversations = useCallback(async () => {
        try {
            const res  = await fetch("/api/admin/messages", { cache: "no-store" });
            const data = await res.json();
            if (data.success) setConversations(data.data);
        } finally { setIsLoadingConvs(false); }
    }, []);
    useEffect(() => { loadConversations(); }, [loadConversations]);
    useEffect(() => { const iv = setInterval(loadConversations, 5000); return () => clearInterval(iv); }, [loadConversations]);

    // Poll for online users presence
    useEffect(() => {
        const fetchPresence = async () => {
            try {
                const res = await fetch("/api/presence");
                const data = await res.json();
                if (data.success && data.onlineIds) {
                    setOnlineUsers(new Set(data.onlineIds));
                }
            } catch (err) {
                console.error("Failed to fetch presence", err);
            }
        };
        fetchPresence();
        const iv = setInterval(fetchPresence, 15000); // Check every 15s
        return () => clearInterval(iv);
    }, []);

    /* ─── Messages ─── */
    const loadMessages = useCallback(async (userId: string) => {
        try {
            const res  = await fetch(`/api/admin/messages?userId=${userId}`, { cache: "no-store" });
            const data = await res.json();
            if (data.success) {
                setMessages(prev => JSON.stringify(prev) === JSON.stringify(data.data) ? prev : data.data);
            }
        } finally {
            setIsLoadingMsgs(false);
        }
    }, []);
    useEffect(() => {
        if (!selectedUser) return;
        setIsLoadingMsgs(true);
        loadMessages(selectedUser.userId);
    }, [selectedUser, loadMessages]);
    useEffect(() => {
        if (!selectedUser) return;
        const iv = setInterval(() => loadMessages(selectedUser.userId), 3000);
        return () => clearInterval(iv);
    }, [selectedUser, loadMessages]);

    useEffect(() => { 
        if (messages.length !== prevMsgCount.current) {
            // Scroll if new messages arrive or initial loading for this user
            if (messages.length > 0) scrollToBottom(); 
        }
        prevMsgCount.current = messages.length;
    }, [messages]);

    /* ─── Recherche (convs + nouveaux users) ─── */
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        if (!search.trim()) { setSearchResults([]); return; }
        searchTimer.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res  = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`, { cache: "no-store" });
                const data = await res.json();
                if (data.success) setSearchResults(data.data);
            } finally { setIsSearching(false); }
        }, 250);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [search]);

    const existingIds = new Set(conversations.map(c => c.userId));

    /* Tout ce qui apparaît dans la sidebar */
    const filteredConvs = search.trim()
        ? conversations.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()))
        : conversations;

    const newUsers = searchResults.filter(u => !existingIds.has(u.id));

    /* ─── Sélection d'un utilisateur ─── */
    const selectUser = (u: UserResult | Conversation) => {
        prevMsgCount.current = 0; // Reset length for new user
        const isConv = "lastMessage" in u;
        if (isConv) {
            setSelectedUser(u as Conversation);
        } else {
            setSelectedUser({
                userId:      u.id,
                name:        (u as UserResult).name || u.email,
                email:       u.email,
                role:        u.role,
                lastMessage: "",
                lastTime:    new Date().toISOString(),
            });
        }
        setSearch("");
        setSearchResults([]);
        inputRef.current?.focus();
    };

    /* ─── Envoyer texte ─── */
    const sendMessage = async (content: string, media?: { mediaUrl: string; mediaType: string; fileName?: string }) => {
        if (!selectedUser || isSending) return;
        setIsSending(true);
        const currentReplyToId = replyTo?.id ?? undefined;
        try {
            const res = await fetch("/api/admin/messages", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ receiverId: selectedUser.userId, content, ...media, replyToId: currentReplyToId }),
            });
            const data = await res.json();
            if (data.success) {
                setInput("");
                setShowEmoji(false);
                setReplyTo(null);
                await loadMessages(selectedUser.userId);
                loadConversations();
            }
        } finally { setIsSending(false); }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input.trim());
    };

    /* ─── Emoji ─── */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onEmojiClick = (emojiData: any) => {
        setInput(prev => prev + emojiData.emoji);
        inputRef.current?.focus();
    };

    /* ─── Upload fichier/image ─── */
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedUser) return;
        e.target.value = "";

        const fd = new FormData();
        fd.append("file", file);
        const res  = await fetch("/api/messages/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.success) {
            sendMessage("", { mediaUrl: data.url, mediaType: data.mediaType, fileName: data.fileName });
        }
    };

    /* ─── Enregistrement vocal — via hook ─── */
    const cancelVoice = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioFile(null);
        setAudioUrl(null);
    };

    const handleSendVoice = async () => {
        if (!audioFile || !selectedUser) return;
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

    /* ─── Helpers ─── */
    const formatTime = (iso: string) => {
        if (!iso) return "";
        const d = new Date(iso);
        if (d.toDateString() === new Date().toDateString())
            return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    };

    const fmtSecs = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    /* ─── Bubble contenu ─── */
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
        // Fichier
        return (
            <a href={msg.mediaUrl} target="_blank" rel="noreferrer"
                className={`flex items-center gap-2 text-sm font-medium underline-offset-2 hover:underline ${isMe ? "text-white/90" : "text-slate-700"}`}>
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

    /* ══════════════════════════════════════════════ RENDER ══════════════════════════════════════════════ */
    return (
        <div className="flex h-full overflow-hidden bg-[#f0f2f5] dark:bg-zinc-950" onClick={() => setShowEmoji(false)}>

            {/* ════════ SIDEBAR ════════ */}
            <aside className={`${selectedUser ? "hidden md:flex" : "flex"} w-full md:w-[340px] shrink-0 bg-white dark:bg-zinc-900 flex-col shadow-sm`}>

                {/* Header */}
                <div className="px-5 pt-5 pb-3 space-y-3">
                    <h1 onClick={() => setSelectedUser(null)} className={`${playfair.className} text-2xl italic text-slate-900 dark:text-white cursor-pointer hover:text-[#bca086] transition-colors`}>Messagerie</h1>

                    {/* Barre recherche unique */}
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher ou démarrer..."
                            className="w-full pl-9 pr-4 py-2.5 bg-[#f0f2f5] dark:bg-zinc-800 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#bca086]/30 transition-all placeholder:text-slate-400" />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#bca086]/30 border-t-[#bca086] rounded-full animate-spin" />
                        )}
                    </div>
                </div>

                {/* Liste */}
                <div className="flex-1 overflow-y-auto">
                    {isLoadingConvs ? (
                        <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-[#bca086]/30 border-t-[#bca086] rounded-full animate-spin" /></div>
                    ) : (
                        <>
                            {/* Conversations filtrées */}
                            {filteredConvs.map(conv => {
                                const rl = roleLabel[conv.role] || { label: conv.role, color: "bg-slate-100 text-slate-500" };
                                const isSelected = selectedUser?.userId === conv.userId;
                                return (
                                    <button key={conv.userId} onClick={() => selectUser(conv)}
                                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#f0f2f5] dark:hover:bg-zinc-800 transition-colors
                                            ${isSelected ? "bg-[#bca086]/10 dark:bg-[#bca086]/10" : (conv.unreadCount ?? 0) > 0 ? "bg-[#bca086]/5" : ""}`}>
                                        <div className="relative shrink-0">
                                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(conv.name || conv.email)} text-white flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden`}>
                                                {conv.avatar
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    ? <img src={conv.avatar} alt={conv.name} className="w-full h-full object-cover" />
                                                    : (conv.name || conv.email).charAt(0).toUpperCase()
                                                }
                                            </div>
                                            {onlineUsers.has(conv.userId) && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <p className={`font-semibold text-sm truncate ${(conv.unreadCount ?? 0) > 0 ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>{conv.name}</p>
                                                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ${rl.color}`}>{rl.label}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 shrink-0">{formatLastTime(conv.lastTime)}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-1">
                                                <p className={`text-xs truncate flex-1 ${(conv.unreadCount ?? 0) > 0 ? "font-medium text-slate-700 dark:text-slate-300" : "text-slate-400"}`}>{conv.lastMessage || conv.email}</p>
                                                {(conv.unreadCount ?? 0) > 0 && (
                                                    <span className="min-w-[18px] h-[18px] bg-[#bca086] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shrink-0">
                                                        {(conv.unreadCount ?? 0) > 99 ? "99+" : conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {/* Nouveaux utilisateurs trouvés */}
                            {search.trim() && newUsers.length > 0 && (
                                <>
                                    <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Démarrer une conversation
                                    </div>
                                    {newUsers.map(u => {
                                        const rl = roleLabel[u.role] || { label: u.role, color: "bg-slate-100 text-slate-500" };
                                        return (
                                            <button key={u.id} onClick={() => selectUser(u)}
                                                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#f0f2f5] dark:hover:bg-zinc-800 transition-colors">
                                                <div className="w-12 h-12 rounded-full bg-[#bca086]/20 text-[#bca086] flex items-center justify-center font-bold text-lg shrink-0">
                                                    {(u.name || u.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{u.name || u.email}</p>
                                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ${rl.color}`}>{rl.label}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </>
                            )}

                            {!search.trim() && conversations.length === 0 && (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    Aucune conversation — cherchez un utilisateur ci-dessus
                                </div>
                            )}
                        </>
                    )}
                </div>
            </aside>

            {/* ════════ ZONE CHAT ════════ */}
            <div className={`${selectedUser ? "flex" : "hidden md:flex"} flex-1 flex-col overflow-hidden`}>
                {selectedUser ? (
                    <>
                        {/* ── Header chat ── */}
                        <header className="h-[60px] px-4 bg-white dark:bg-zinc-900 border-b border-black/5 dark:border-white/5 flex items-center gap-3 shrink-0 shadow-sm">
                            <button onClick={() => setSelectedUser(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="relative shrink-0">
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(selectedUser.name)} text-white flex items-center justify-center font-bold text-base shadow overflow-hidden`}>
                                    {selectedUser.avatar
                                        // eslint-disable-next-line @next/next/no-img-element
                                        ? <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
                                        : selectedUser.name.charAt(0).toUpperCase()
                                    }
                                </div>
                                {onlineUsers.has(selectedUser.userId) && (
                                    <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-zinc-900" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-[15px] text-slate-900 dark:text-white truncate leading-tight">{selectedUser.name}</p>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${roleLabel[selectedUser.role]?.color || "bg-slate-100 text-slate-500"}`}>
                                        {roleLabel[selectedUser.role]?.label || selectedUser.role}
                                    </span>
                                </div>
                                <p className={`text-[12px] leading-tight ${onlineUsers.has(selectedUser.userId) ? "text-emerald-500 font-medium" : "text-slate-400"}`}>
                                    {onlineUsers.has(selectedUser.userId) ? "En ligne" : "Hors ligne"}
                                </p>
                            </div>
                        </header>

                        {/* ── Messages ── */}
                        <div className="relative flex-1 overflow-hidden">
                        <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="h-full overflow-y-auto py-4 px-3 bg-[#f0f2f5] dark:bg-zinc-950" onClick={() => setShowEmoji(false)}>
                            {isLoadingMsgs ? (
                                <div className="flex justify-center pt-10"><div className="w-7 h-7 border-2 border-[#bca086]/30 border-t-[#bca086] rounded-full animate-spin" /></div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center font-bold text-3xl shadow-lg overflow-hidden">
                                        {selectedUser.avatar
                                            // eslint-disable-next-line @next/next/no-img-element
                                            ? <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
                                            : selectedUser.name.charAt(0).toUpperCase()
                                        }
                                    </div>
                                    <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedUser.name}</p>
                                    <p className="text-sm text-slate-400">Démarrez la conversation</p>
                                </div>
                            ) : (
                                (() => {
                                    let lastDate = "";
                                    return messages.map((msg, index) => {
                                        const isAdmin = msg.sender.role === "ADMIN";
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

                                        const tr = isAdmin && sameAsPrev ? "rounded-tr-[5px]" : "";
                                        const br = isAdmin && sameAsNext ? "rounded-br-[5px]" : "";
                                        const tl = !isAdmin && sameAsPrev ? "rounded-tl-[5px]" : "";
                                        const bl = !isAdmin && sameAsNext ? "rounded-bl-[5px]" : "";
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
                                                <div className={`group flex ${isAdmin ? "justify-end" : "justify-start"} items-end gap-1.5 ${gap}`}>
                                                    {/* Bouton répondre — côté gauche pour mes messages (admin) */}
                                                    {isAdmin && !msg.isDeleted && (
                                                        <button onClick={() => setReplyTo(msg)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-[#bca086] hover:bg-slate-100 shrink-0 mb-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                            </svg>
                                                        </button>
                                                    )}

                                                    {/* Avatar utilisateur — visible seulement sur le dernier msg du groupe */}
                                                    {!isAdmin && (
                                                        <div className="w-7 shrink-0">
                                                            {!sameAsNext ? (
                                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-white flex items-center justify-center text-[11px] font-bold shadow-sm overflow-hidden">
                                                                    {(msg.sender.avatar || selectedUser.avatar)
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        ? <img src={(msg.sender.avatar || selectedUser.avatar)!} alt={selectedUser.name} className="w-full h-full object-cover" />
                                                                        : selectedUser.name.charAt(0).toUpperCase()
                                                                    }
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    )}

                                                    <div className={`max-w-[70%] flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                                                        {msg.isPinned && (
                                                            <div className="flex items-center gap-1 mb-1 text-[10px] font-bold text-emerald-500 uppercase px-1">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
                                                                Épinglé
                                                            </div>
                                                        )}
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
                                                                        : isAdmin
                                                                            ? "bg-[#bca086] text-white"
                                                                            : "bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 shadow-sm"
                                                                    }
                                                                    ${contextMenu?.message.id === msg.id ? "opacity-70 scale-[0.98]" : ""}`}>

                                                                {/* Preview réponse */}
                                                                {!msg.isDeleted && msg.replyTo && (
                                                                    <div className={`flex gap-1.5 mb-1.5 rounded-lg px-2 py-1.5 text-[12px] ${isAdmin ? "bg-black/10" : "bg-black/5"}`}>
                                                                        <div className={`w-0.5 rounded-full shrink-0 ${isAdmin ? "bg-white/60" : "bg-[#bca086]"}`} />
                                                                        <div className="min-w-0">
                                                                            <p className={`font-semibold text-[11px] truncate ${isAdmin ? "text-white/80" : "text-[#bca086]"}`}>
                                                                                {msg.replyTo.sender.role === "ADMIN" ? "Vous" : selectedUser?.name}
                                                                            </p>
                                                                            <p className={`truncate ${isAdmin ? "text-white/60" : "text-slate-500"}`}>
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
                                                                        {renderMedia(msg, isAdmin)}
                                                                        {msg.content && <p>{msg.content}</p>}
                                                                    </>
                                                                )}

                                                                {/* Heure + statut DANS la bulle */}
                                                                {!msg.isDeleted && (
                                                                    <div className="flex items-center justify-end gap-1 mt-1 -mb-0.5 min-w-[50px]">
                                                                        <span className={`text-[10px] leading-none ${isAdmin ? "text-white/60" : "text-slate-400"}`}>
                                                                            {formatTime(msg.createdAt)}
                                                                        </span>
                                                                        {isAdmin && (
                                                                            msg.isRead ? (
                                                                                <svg className="w-[15px] h-[15px] text-sky-200 shrink-0" viewBox="0 0 18 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <path d="M1 5.5L5 9.5L11 2"/>
                                                                                    <path d="M6 5.5L10 9.5L16 2"/>
                                                                                </svg>
                                                                            ) : (
                                                                                <svg className="w-[13px] h-[13px] text-white/60 shrink-0" viewBox="0 0 12 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <path d="M1 4.5L4.5 8L11 1"/>
                                                                                </svg>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {msg.reaction && !msg.isDeleted && (
                                                                <div className={`absolute -bottom-3 ${isAdmin ? '-right-1' : '-left-1'} bg-white dark:bg-zinc-800 rounded-full shadow-md border border-slate-100 dark:border-zinc-700 w-[22px] h-[22px] flex items-center justify-center text-xs animate-in zoom-in cursor-pointer hover:scale-110 transition-transform`}
                                                                    onClick={() => { setContextMenu({ x: 0, y: 0, message: msg }); runAction('react', msg.reaction!); }}>
                                                                    {msg.reaction}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Bouton répondre — côté droit pour messages reçus */}
                                                    {!isAdmin && !msg.isDeleted && (
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
                            <button onClick={() => scrollToBottom()} className="absolute bottom-4 right-4 z-10 w-10 h-10 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-black/5 dark:border-white/10 text-slate-500 hover:text-[#bca086] transition-all hover:scale-105 flex items-center justify-center">
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
                                    <button onClick={() => runAction('delete')} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center gap-3">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Supprimer
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ── Zone saisie ── */}
                        <div className="relative px-3 py-2 bg-[#f0f2f5] dark:bg-zinc-900 shrink-0">
                            {/* Barre répondre */}
                            {replyTo && (
                                <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-xl px-3 py-2 mb-2 border-l-4 border-[#bca086] animate-in slide-in-from-bottom-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-semibold text-[#bca086]">
                                            {replyTo.sender.role === "ADMIN" ? "Vous" : selectedUser?.name}
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

                            {voice.isRecording && (
                                <div className="flex items-center gap-3 bg-[#bca086] rounded-full px-4 py-2.5 mb-2 shadow-sm animate-in slide-in-from-bottom-2">
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                                    <span className="text-sm font-medium text-white flex-1">Enregistrement...</span>
                                    <span className="text-sm font-mono text-white/80">{voice.fmt(voice.seconds)}</span>
                                    <button type="button" onClick={voice.stop} className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors shrink-0">
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

                            {audioUrl && !voice.isRecording && (
                                <div className="flex items-center gap-2 bg-[#bca086] rounded-2xl px-3 py-2 mb-2 shadow-sm animate-in slide-in-from-bottom-2">
                                    <button type="button" onClick={cancelVoice} className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-all shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                    <div className="flex-1"><audio src={audioUrl} controls className="w-full h-8" style={{ filter: "invert(1) brightness(2)" }} /></div>
                                    <button type="button" onClick={handleSendVoice} disabled={isSending} className="w-9 h-9 bg-white text-[#bca086] rounded-full flex items-center justify-center hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50 shrink-0">
                                        {isSending ? <div className="w-4 h-4 border-2 border-[#bca086]/30 border-t-[#bca086] rounded-full animate-spin" /> :
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
                                    </button>
                                </div>
                            )}

                            {showEmoji && (
                                <div className="absolute bottom-full left-0 right-0 sm:left-3 sm:right-auto z-50 mb-2 px-3 sm:px-0" onClick={e => e.stopPropagation()}>
                                    <EmojiPicker onEmojiClick={onEmojiClick} height={320} width="100%" searchDisabled previewConfig={{ showPreview: false }} />
                                </div>
                            )}

                            <form onSubmit={handleSend} className="flex items-center gap-2">
                                <div className="flex-1 flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-full px-2 py-1.5 shadow-sm min-w-0">
                                    <button type="button" onClick={e => { e.stopPropagation(); setShowEmoji(v => !v); }}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0 transition-all ${showEmoji ? "text-[#bca086]" : "text-slate-400 hover:text-slate-500"}`}>
                                        😊
                                    </button>
                                    <input ref={inputRef} type="text" value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder={`Message à ${selectedUser.name}...`}
                                        disabled={voice.isRecording}
                                        className="flex-1 bg-transparent outline-none text-[14px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 min-w-0" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()}
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                    </button>
                                </div>
                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" onChange={handleFileChange} />

                                {input.trim() ? (
                                    <button type="submit" disabled={isSending}
                                        className="w-10 h-10 bg-[#bca086] text-white rounded-full flex items-center justify-center hover:bg-[#a8896f] transition-all active:scale-95 disabled:opacity-50 shadow-sm shrink-0">
                                        {isSending
                                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                                        }
                                    </button>
                                ) : (
                                    <button type="button" onClick={voice.toggle} disabled={!voice.isSupported}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm
                                            ${voice.isRecording ? "bg-rose-500 text-white scale-110" : "bg-white dark:bg-zinc-800 text-slate-400 hover:text-[#bca086]"}
                                            ${!voice.isSupported ? "opacity-50 cursor-not-allowed" : ""}`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    </button>
                                )}
                            </form>
                        </div>
                    </>
                ) : (
                    /* Aucune conv sélectionnée */
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 bg-[#f0f2f5] dark:bg-zinc-950">
                        <div className="w-24 h-24 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                            <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div className="text-center space-y-1">
                            <p className="font-bold text-slate-600 dark:text-slate-400">Vos messages</p>
                            <p className="text-sm opacity-70">Cherchez un nom pour démarrer une conversation</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
