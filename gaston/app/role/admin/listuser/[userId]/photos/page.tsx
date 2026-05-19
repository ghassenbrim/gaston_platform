"use client";

import React, { useEffect, useRef, useState } from "react";
import { Playfair_Display } from "next/font/google";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

const CATEGORIES = ["Mariage", "Anniversaire", "Immobilier", "Evenement", "Autre", "Général"];

interface Photo {
    id: string;
    url: string;
    category: string;
    createdAt: string;
    mediaType: "image" | "video";
    aspectRatio?: "16:9" | "9:16" | null;
}

function isVideoFile(file: File) {
    return file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
}

function isVideoUrl(url: string) {
    return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
}

function isVideo(photo: Photo) {
    return photo.mediaType === "video" || isVideoUrl(photo.url);
}

function getVideoAspectRatio(file: File): Promise<"16:9" | "9:16" | null> {
    return new Promise((resolve) => {
        const video = document.createElement("video");
        const objectUrl = URL.createObjectURL(file);
        video.preload = "metadata";
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(objectUrl);
            const ratio = video.videoWidth / video.videoHeight;
            if (Math.abs(ratio - 16 / 9) <= 0.08) resolve("16:9");
            else if (Math.abs(ratio - 9 / 16) <= 0.08) resolve("9:16");
            else resolve(video.videoWidth >= video.videoHeight ? "16:9" : "9:16");
        };
        video.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(null);
        };
        video.src = objectUrl;
    });
}

function MediaPreview({ photo }: { photo: Photo }) {
    if (isVideo(photo)) {
        return (
            <video
                src={photo.url}
                className="h-full w-full object-cover"
                controls
                playsInline
                preload="metadata"
            />
        );
    }

    return <Image src={photo.url} alt={photo.category} fill className="object-cover" />;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: "success" | "error" }) {
    return (
        <div className={`fixed top-24 right-8 z-[100] px-7 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white text-sm font-bold ${type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
            {type === "success"
                ? <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            }
            {message}
        </div>
    );
}

// ─── Modal suppression média ──────────────────────────────────────────────────
function ConfirmDeleteModal({ onConfirm, onCancel, deleting }: {
    onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-2xl p-8 w-full max-w-sm">
                <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h2 className={`${playfair.className} text-2xl italic text-center text-slate-900 dark:text-white mb-2`}>Supprimer ce média ?</h2>
                <p className="text-center text-slate-500 text-sm mb-7">Cette action est <span className="text-red-500 font-bold">irréversible</span>.</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} disabled={deleting} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all">
                        Annuler
                    </button>
                    <button onClick={onConfirm} disabled={deleting} className={`flex-1 py-3 rounded-2xl bg-red-500 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${deleting ? "opacity-70 cursor-not-allowed" : "hover:bg-red-600 active:scale-95"}`}>
                        {deleting && <svg className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" viewBox="0 0 24 24" />}
                        {deleting ? "..." : "Supprimer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminUserPhotosPage() {
    const { userId } = useParams<{ userId: string }>();
    const router = useRouter();

    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("");

    // Upload
    const [newCategory, setNewCategory] = useState("Général");
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Suppression
    const [toDelete, setToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Filtre
    const [filterCat, setFilterCat] = useState("Tous");

    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        Promise.all([
            fetch(`/api/admin/photos?userId=${userId}`).then(r => r.json()),
            fetch(`/api/admin/listuser`).then(r => r.json()),
        ]).then(([photosData, usersData]) => {
            setPhotos(photosData);
            const found = usersData.find((u: { id: string; name: string | null; email: string }) => u.id === userId);
            setUserName(found?.name || found?.email || "Utilisateur");
        }).catch(() => showToast("Erreur de chargement.", "error"))
          .finally(() => setLoading(false));
    }, [userId]);

    // Upload + save
    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        let successCount = 0;
        for (const file of Array.from(files)) {
            try {
                const mediaType = isVideoFile(file) ? "video" : "image";
                const aspectRatio = mediaType === "video" ? await getVideoAspectRatio(file) : null;

                // 1. Upload fichier
                const form = new FormData();
                form.append("file", file);
                const upRes = await fetch("/api/admin/upload", { method: "POST", body: form });
                const upData = await upRes.json();
                if (!upData.success) { showToast(upData.error || "Erreur upload.", "error"); continue; }

                // 2. Sauvegarder en DB
                const dbRes = await fetch("/api/admin/photos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, url: upData.path, category: newCategory, mediaType, aspectRatio }),
                });
                const dbData = await dbRes.json();
                if (dbData.success) {
                    setPhotos(prev => [{
                        id: dbData.photo.id,
                        url: upData.path,
                        category: newCategory,
                        mediaType,
                        aspectRatio,
                        createdAt: new Date().toLocaleDateString("fr-FR"),
                    }, ...prev]);
                    successCount++;
                } else {
                    showToast(dbData.error || "Fichier uploadé, mais sauvegarde galerie impossible.", "error");
                }
            } catch { showToast("Erreur réseau.", "error"); }
        }
        if (successCount > 0) showToast(`${successCount} média${successCount > 1 ? "s" : ""} ajouté${successCount > 1 ? "s" : ""} avec succès.`, "success");
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleDelete = async () => {
        if (!toDelete) return;
        setDeleting(true);
        try {
            const res = await fetch("/api/admin/photos", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photoId: toDelete }),
            });
            const data = await res.json();
            if (data.success) {
                setPhotos(prev => prev.filter(p => p.id !== toDelete));
                showToast("Média supprimé.", "success");
            } else {
                showToast(data.error || "Erreur.", "error");
            }
        } catch { showToast("Erreur réseau.", "error"); }
        finally { setDeleting(false); setToDelete(null); }
    };

    const filtered = filterCat === "Tous" ? photos : photos.filter(p => p.category === filterCat);
    const allCats = ["Tous", ...CATEGORIES];

    return (
        <div className="p-6 md:p-10 lg:p-14 space-y-8 relative">
            {toast && <Toast message={toast.message} type={toast.type} />}
            {toDelete && <ConfirmDeleteModal onConfirm={handleDelete} onCancel={() => setToDelete(null)} deleting={deleting} />}

            {/* Header */}
            <header className="space-y-3">
                <button
                    onClick={() => router.back()}
                    className="group inline-flex items-center gap-2 text-slate-400 hover:text-[#bca086] font-black uppercase text-[10px] tracking-[0.3em] transition-all mb-2"
                >
                    <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Retour
                </button>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Gestion des médias</p>
                <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white`}>
                    {userName}
                </h1>
                <p className="text-base text-slate-500 font-light">
                    {photos.length} média{photos.length !== 1 ? "s" : ""} dans la galerie
                </p>
            </header>

            {/* Zone d'ajout */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#bca086]/10 text-[#bca086] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.25 5.25 0 011.023 10.34" /></svg>
                    </div>
                    <h2 className="font-black text-slate-900 dark:text-white text-base">Ajouter des photos ou vidéos</h2>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    {/* Sélecteur de catégorie */}
                    <div className="space-y-1.5 w-full md:w-52 shrink-0">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catégorie</label>
                        <select
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-[#bca086]/20 appearance-none transition"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Zone drop */}
                    <div
                        onClick={() => !uploading && inputRef.current?.click()}
                        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                        onDragOver={e => e.preventDefault()}
                        className={`flex-1 w-full border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 py-5 px-6 cursor-pointer transition-all group
                            ${uploading ? "border-[#bca086] bg-[#bca086]/5 cursor-wait" : "border-slate-200 dark:border-white/10 hover:border-[#bca086] hover:bg-[#bca086]/5"}`}
                    >
                        {uploading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-[#bca086]" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span className="text-sm font-bold text-[#bca086]">Upload en cours...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6 text-slate-400 group-hover:text-[#bca086] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                                <div>
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-[#bca086] transition-colors">
                                        Cliquez ou glissez des photos ou vidéos ici
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP, MP4, WebM, MOV — vidéos 16:9 ou 9:16</p>
                                </div>
                            </>
                        )}
                    </div>
                    <input ref={inputRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                </div>
            </div>

            {/* Filtres */}
            {photos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {allCats.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCat(cat)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterCat === cat ? "bg-[#bca086] text-white shadow-lg shadow-[#bca086]/20" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-700"}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Galerie */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem] flex flex-col items-center justify-center py-24 text-slate-400">
                    <svg className="w-14 h-14 opacity-30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <p className="text-[11px] font-black uppercase tracking-widest">Aucun média {filterCat !== "Tous" ? `dans "${filterCat}"` : ""}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filtered.map(photo => (
                        <div key={photo.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                            <MediaPreview photo={photo} />
                            {isVideo(photo) && (
                                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-xl bg-black/55 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    {photo.aspectRatio ?? "Vidéo"}
                                </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">
                                {/* Bouton supprimer */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setToDelete(photo.id)}
                                        className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all hover:scale-110 active:scale-95 shadow-lg"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Infos bas */}
                                <div>
                                    <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-[9px] font-black uppercase tracking-widest text-white mb-1">
                                        {photo.category}
                                    </span>
                                    <p className="text-[10px] text-white/60">{photo.createdAt}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
