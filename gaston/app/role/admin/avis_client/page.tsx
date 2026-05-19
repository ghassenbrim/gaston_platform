"use client";

import { useEffect, useState } from "react";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

interface Review {
    id: string;
    rating: number;
    quote: string;
    eventRole: string;
    isApproved: boolean;
    createdAt: string;
    user: { name: string | null; email: string };
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
    return (
        <div className={`fixed top-24 right-8 z-[300] px-7 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white text-sm font-bold ${type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
            {type === "success"
                ? <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            }
            {message}
        </div>
    );
}

export default function AdminAvisPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadReviews = async () => {
        try {
            const response = await fetch("/api/admin/reviews", { cache: "no-store" });
            if (!response.ok) throw new Error("Erreur de chargement");
            const data: Review[] = await response.json();
            setReviews(data);
        } catch {
            setReviews([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadReviews(); }, []);

    const toggleApproval = async (id: string, currentStatus: boolean) => {
        try {
            // Optimistic update
            setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: !currentStatus } : r));

            const res = await fetch("/api/admin/reviews", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isApproved: !currentStatus }),
            });
            const data = await res.json();
            if (!data.success) {
                // Rollback on error
                setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: currentStatus } : r));
                showToast(data.error || "Erreur lors de la modification.", "error");
            } else {
                showToast(`Avis ${!currentStatus ? "affiché" : "masqué"} avec succès.`, "success");
            }
        } catch {
            // Rollback on error
            setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: currentStatus } : r));
            showToast("Erreur réseau.", "error");
        }
    };

    return (
        <div className="p-6 md:p-12 lg:p-16 space-y-10">
            {toast && <Toast message={toast.message} type={toast.type} />}

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Administration</p>
                    <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-6xl italic text-slate-900 dark:text-white leading-tight`}>
                        Avis Clients
                    </h1>
                    <p className="text-lg text-slate-500 font-light leading-relaxed">
                        Gérez les témoignages à afficher sur la page d'accueil
                    </p>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm self-start md:self-auto">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        {reviews.filter(r => r.isApproved).length} avis visible{reviews.filter(r => r.isApproved).length !== 1 ? "s" : ""}
                    </span>
                </div>
            </header>

            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Header */}
                        <div className="grid grid-cols-12 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-white/5">
                            <div className="col-span-3">Client</div>
                            <div className="col-span-1 text-center">Note</div>
                            <div className="col-span-4">Avis</div>
                            <div className="col-span-2">Événement</div>
                            <div className="col-span-2 text-right">Visible (Accueil)</div>
                        </div>

                        {/* Lignes */}
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="grid grid-cols-12 px-8 py-6 border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors items-center"
                            >
                                <div className="col-span-3 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#bca086]/10 flex items-center justify-center text-sm font-black text-[#bca086] shrink-0">
                                        {(review.user?.name || "C").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white truncate">
                                            {review.user?.name || <span className="italic text-slate-400">Sans nom</span>}
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-400 truncate">{review.createdAt}</p>
                                    </div>
                                </div>

                                <div className="col-span-1 flex items-center justify-center text-[#bca086]">
                                    <span className="font-black text-lg">{review.rating}</span>
                                    <svg className="w-4 h-4 ml-1 -mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </div>

                                <div className="col-span-4 pr-6">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 italic line-clamp-3">"{review.quote}"</p>
                                </div>

                                <div className="col-span-2">
                                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-widest text-[#bca086]">
                                        {review.eventRole}
                                    </span>
                                </div>

                                <div className="col-span-2 flex justify-end">
                                    <button
                                        onClick={() => toggleApproval(review.id, review.isApproved)}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#bca086] focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${review.isApproved ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${review.isApproved ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {!isLoading && reviews.length === 0 && (
                            <div className="py-24 text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                </div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucun avis reçu</p>
                            </div>
                        )}

                        {isLoading && (
                            <div className="py-24 text-center">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement des avis...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
