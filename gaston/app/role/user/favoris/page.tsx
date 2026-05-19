"use client";

import React, { useState, useCallback } from "react";
import { Playfair_Display } from "next/font/google";
import Image from "next/image";
import { useFavorites, FavoritePhoto } from "../context/FavoritesContext";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

function isVideo(photo: FavoritePhoto) {
    return photo.mediaType === "video" || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(photo.url);
}

function MediaPreview({ photo, contain = false }: { photo: FavoritePhoto; contain?: boolean }) {
    if (isVideo(photo)) {
        return (
            <video
                src={photo.url}
                className={`h-full w-full ${contain ? "object-contain" : "object-cover"}`}
                controls
                muted={!contain}
                playsInline
                preload="metadata"
            />
        );
    }

    return <Image src={photo.url} alt={photo.category} fill className={contain ? "object-contain" : "object-cover transition-transform duration-700 group-hover:scale-105"} />;
}

// ─── Téléchargement ───────────────────────────────────────────────────────────
async function downloadPhoto(url: string, filename: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

// ─── Partage ──────────────────────────────────────────────────────────────────
function ShareMenu({ url, onClose }: { url: string; onClose: () => void }) {
    const fullUrl = `${window.location.origin}${url}`;
    const [copied, setCopied] = useState(false);

    const copyLink = async () => {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => { setCopied(false); onClose(); }, 1500);
    };

    const nativeShare = async () => {
        if (navigator.share) {
            await navigator.share({ title: "Mon média", url: fullUrl });
            onClose();
        }
    };

    const socials = [
        {
            label: "WhatsApp",
            color: "bg-[#25D366]",
            href: `https://wa.me/?text=${encodeURIComponent(fullUrl)}`,
            icon: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M12 0C5.373 0 0 5.373 0 12c0 2.118.549 4.103 1.51 5.83L0 24l6.33-1.487A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />,
        },
        {
            label: "Facebook",
            color: "bg-[#1877F2]",
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
            icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
        },
        {
            label: "Twitter / X",
            color: "bg-black",
            href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}`,
            icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
        },
    ];

    return (
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-2xl p-6 w-full max-w-sm space-y-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className={`${playfair.className} text-2xl italic text-slate-900 dark:text-white`}>Partager</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 hover:text-slate-700 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {socials.map(s => (
                        <a
                            key={s.label}
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onClose}
                            className={`${s.color} flex flex-col items-center justify-center gap-2 py-4 rounded-2xl text-white hover:opacity-90 active:scale-95 transition-all`}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">{s.icon}</svg>
                            <span className="text-[9px] font-black uppercase tracking-wide">{s.label}</span>
                        </a>
                    ))}
                </div>

                {typeof navigator !== "undefined" && "share" in navigator && (
                    <button
                        onClick={nativeShare}
                        className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        Partager via…
                    </button>
                )}

                <button
                    onClick={copyLink}
                    className={`w-full py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${copied ? "bg-emerald-500 text-white" : "border border-slate-200 dark:border-white/10 text-slate-500 hover:border-[#bca086] hover:text-[#bca086]"}`}
                >
                    {copied
                        ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>Lien copié !</>
                        : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copier le lien</>
                    }
                </button>
            </div>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function FavorisPage() {
    const { favoritePhotos, toggleFavorite } = useFavorites();
    const [filterCat, setFilterCat] = useState("Tous");
    const [preview, setPreview] = useState<FavoritePhoto | null>(null);
    const [sharePhoto, setSharePhoto] = useState<FavoritePhoto | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);

    const handleDownload = useCallback(async (photo: FavoritePhoto, e: React.MouseEvent) => {
        e.stopPropagation();
        setDownloading(photo.id);
        const ext = photo.url.split(".").pop() || "jpg";
        await downloadPhoto(photo.url, `favori-${photo.category}-${photo.id.slice(0, 6)}.${ext}`);
        setDownloading(null);
    }, []);

    // Catégories uniquement pour les photos favorites
    const usedCats = ["Tous", ...Array.from(new Set(favoritePhotos.map(p => p.category))).filter(Boolean)];
    const filtered = filterCat === "Tous" ? favoritePhotos : favoritePhotos.filter(p => p.category === filterCat);

    return (
        <div className="p-6 md:p-12 lg:p-20">
            {sharePhoto && <ShareMenu url={sharePhoto.url} onClose={() => setSharePhoto(null)} />}

            {/* Lightbox */}
            {preview && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 md:p-8" onClick={() => setPreview(null)}>
                    {/* Barre haute */}
                    <div className="w-full flex items-center justify-between" onClick={e => e.stopPropagation()}>
                        <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-[10px] font-black uppercase tracking-widest">{preview.category}</span>
                        <div className="flex items-center gap-2">
                            {/* Retirer des favoris */}
                            <button
                                onClick={() => { toggleFavorite(preview); setPreview(null); }}
                                className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 hover:scale-110 active:scale-95 transition-all"
                                title="Retirer des favoris"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </button>
                            {/* Télécharger */}
                            <button
                                onClick={e => handleDownload(preview, e)}
                                className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 hover:scale-110 active:scale-95 transition-all"
                                title="Télécharger"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                            {/* Partager */}
                            <button
                                onClick={e => { e.stopPropagation(); setSharePhoto(preview); }}
                                className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 hover:scale-110 active:scale-95 transition-all"
                                title="Partager"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            </button>
                            {/* Fermer */}
                            <button onClick={() => setPreview(null)} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all ml-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="relative flex-1 w-full max-w-4xl my-4" onClick={e => e.stopPropagation()}>
                        <MediaPreview photo={preview} contain />
                    </div>

                    <p className="text-white/30 text-xs">{new Date(preview.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
            )}

            {/* Header */}
            <header className="mb-12 space-y-4">
                <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-7xl italic text-slate-900 dark:text-white`}>
                    Mes Favoris
                </h1>
                <p className="text-xl text-slate-500 font-light max-w-2xl leading-relaxed">
                    Retrouvez ici toutes les photos et vidéos que vous avez marquées comme favorites.
                </p>
            </header>

            {favoritePhotos.length === 0 ? (
                <div className="border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center p-20 text-slate-400 bg-slate-50/30 dark:bg-zinc-900/10 min-h-[400px]">
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-8">
                        <svg className="w-10 h-10 opacity-30 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </div>
                    <p className="text-lg font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Aucun favori pour le moment.</p>
                    <p className="text-sm mt-3 opacity-60 text-center max-w-sm">Marquez vos médias préférés d&apos;un cœur pour les retrouver ici dans votre galerie privée.</p>
                </div>
            ) : (
                <>
                    {/* Filtres */}
                    {usedCats.length > 1 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                            {usedCats.map(cat => (
                                <button key={cat} onClick={() => setFilterCat(cat)}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterCat === cat ? "bg-[#bca086] text-white shadow-lg shadow-[#bca086]/20" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-700"}`}>
                                    {cat}
                                    {cat !== "Tous" && (
                                        <span className="ml-1.5 opacity-60">({favoritePhotos.filter(p => p.category === cat).length})</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                        {filtered.length} média{filtered.length !== 1 ? "s" : ""}
                    </p>

                    {/* Grille */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filtered.map(photo => {
                            const dlding = downloading === photo.id;
                            return (
                                <div
                                    key={photo.id}
                                    onClick={() => setPreview(photo)}
                                    className="group relative aspect-square rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-zinc-800 cursor-pointer shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
                                >
                                    <MediaPreview photo={photo} />
                                    {isVideo(photo) && (
                                        <div className="absolute left-3 top-12 flex items-center gap-1.5 rounded-xl bg-black/55 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                                            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                            {photo.aspectRatio ?? "Vidéo"}
                                        </div>
                                    )}

                                    {/* Badge favori permanent */}
                                    <div className="absolute top-3 left-3 w-7 h-7 rounded-xl bg-rose-500 flex items-center justify-center shadow-lg z-10">
                                        <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                    </div>

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        {/* Actions haut droite */}
                                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                                            {/* Retirer des favoris */}
                                            <button
                                                onClick={e => { e.stopPropagation(); toggleFavorite(photo); }}
                                                className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 hover:scale-110 active:scale-95 transition-all shadow-lg"
                                                title="Retirer des favoris"
                                            >
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                            </button>
                                            {/* Télécharger */}
                                            <button
                                                onClick={e => handleDownload(photo, e)}
                                                disabled={dlding}
                                                className="w-9 h-9 rounded-xl bg-white/90 text-slate-600 flex items-center justify-center hover:bg-[#bca086] hover:text-white transition-all hover:scale-110 active:scale-95 shadow-lg disabled:opacity-60"
                                                title="Télécharger"
                                            >
                                                {dlding
                                                    ? <svg className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" viewBox="0 0 24 24" />
                                                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                }
                                            </button>
                                            {/* Partager */}
                                            <button
                                                onClick={e => { e.stopPropagation(); setSharePhoto(photo); }}
                                                className="w-9 h-9 rounded-xl bg-white/90 text-slate-600 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-lg"
                                                title="Partager"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                            </button>
                                        </div>

                                        {/* Catégorie bas */}
                                        <div className="absolute bottom-3 left-3">
                                            <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-[9px] font-black uppercase tracking-widest text-white">{photo.category}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
