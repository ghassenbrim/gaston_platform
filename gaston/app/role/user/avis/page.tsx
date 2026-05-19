"use client";

import React, { useState, useEffect } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "700", "900"] });
const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

interface Review {
    id: string;
    quote: string;
    rating: number;
    eventRole: string;
    isApproved: boolean;
    createdAt: string;
}

export default function AvisPage() {
    const router = useRouter();
    const [userReviews, setUserReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingNew, setIsAddingNew] = useState(false);

    const [quote, setQuote] = useState("");
    const [rating, setRating] = useState(5);
    const [eventRole, setEventRole] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const fetchReviews = async () => {
        try {
            const res = await fetch("/api/reviews");
            if (res.ok) {
                const data = await res.json();
                setUserReviews(data.reviews || []);
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quote, rating, eventRole }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Une erreur est survenue.");
            }

            setIsSuccess(true);
            
            // Re-fetch reviews
            await fetchReviews();

            setTimeout(() => {
                setIsSuccess(false);
                setIsAddingNew(false);
                setQuote("");
                setRating(5);
                setEventRole("");
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`min-h-screen bg-slate-50 dark:bg-zinc-950 ${inter.className} py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300`}>
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 flex justify-between items-center">
                    {(isAddingNew || (userReviews.length === 0 && !isLoading)) ? (
                        <button 
                            onClick={() => {
                                if (isAddingNew && userReviews.length > 0) {
                                    setIsAddingNew(false);
                                } else {
                                    router.back();
                                }
                            }} 
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Retour
                        </button>
                    ) : (
                        <div /> /* Spacer to keep the "Nouvel Avis" button on the right */
                    )}
                    
                    {!isAddingNew && !isLoading && (
                        <button
                            onClick={() => setIsAddingNew(true)}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#bca086] dark:hover:bg-[#bca086] dark:hover:text-white transition-colors shadow-sm"
                        >
                            + Nouvel Avis
                        </button>
                    )}
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-8 sm:p-12 border border-slate-100 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#bca086]/5 dark:bg-[#bca086]/10 rounded-bl-full -z-10"></div>
                    
                    <div className="text-center mb-10">
                        <h1 className={`${playfair.className} text-4xl sm:text-5xl italic text-slate-900 dark:text-white mb-4 transition-colors`}>
                            {isAddingNew || (userReviews.length === 0 && !isLoading) ? "Votre avis nous est précieux" : "Vos Témoignages"}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-light transition-colors">
                            {isAddingNew || (userReviews.length === 0 && !isLoading) 
                                ? "Partagez votre expérience avec Gaston Platform. Vos retours nous aident à sublimer chaque instant."
                                : "Retrouvez ici l'historique des avis que vous avez partagés avec nous."}
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs transition-colors">
                            Chargement...
                        </div>
                    ) : (!isAddingNew && userReviews.length > 0) ? (
                        <div className="space-y-6">
                            {userReviews.map((review) => (
                                <div key={review.id} className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-white/5 shadow-sm relative transition-colors duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex text-[#bca086]">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className={`w-4 h-4 ${review.rating > i ? "text-[#bca086]" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {review.isApproved ? (
                                                <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100 dark:border-emerald-500/20">Publié</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-100 dark:border-amber-500/20">En attente</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 italic mb-4 line-clamp-3 transition-colors">"{review.quote}"</p>
                                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 transition-colors">
                                        <span>{review.eventRole || "Gaston Platform"}</span>
                                        <span>{review.createdAt}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        isSuccess ? (
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-8 rounded-2xl text-center border border-emerald-100 dark:border-emerald-500/20 transition-colors duration-300">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold mb-2">Merci pour votre retour !</h3>
                                <p className="text-sm opacity-80">Votre avis a été soumis avec succès. Il sera publié après validation par notre équipe.</p>
                                <p className="text-xs opacity-60 mt-4">Retour à vos avis en cours...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {error && (
                                    <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-500/20 transition-colors">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4 transition-colors">
                                        Note
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <svg 
                                                    className={`w-10 h-10 transition-colors ${rating >= star ? "text-[#bca086]" : "text-slate-200 dark:text-slate-700"}`} 
                                                    fill="currentColor" 
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="eventRole" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4 transition-colors">
                                        Type d'événement
                                    </label>
                                    <select
                                        id="eventRole"
                                        value={eventRole}
                                        onChange={(e) => setEventRole(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#bca086]/50 focus:border-[#bca086] dark:focus:border-[#bca086] transition-all"
                                    >
                                        <option value="">Sélectionnez un type</option>
                                        <option value="Mariage">Mariage</option>
                                        <option value="Anniversaire">Anniversaire</option>
                                        <option value="Immobilier">Immobilier</option>
                                        <option value="Événementiel">Événementiel</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="quote" className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4 transition-colors">
                                        Votre témoignage
                                    </label>
                                    <textarea
                                        id="quote"
                                        required
                                        rows={5}
                                        value={quote}
                                        onChange={(e) => setQuote(e.target.value)}
                                        placeholder="Partagez votre expérience avec nous..."
                                        className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#bca086]/50 focus:border-[#bca086] dark:focus:border-[#bca086] transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !quote.trim()}
                                        className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                            isSubmitting || !quote.trim()
                                                ? "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                                : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-[#bca086] dark:hover:bg-[#bca086] dark:hover:text-white hover:shadow-lg hover:shadow-[#bca086]/20"
                                        }`}
                                    >
                                        {isSubmitting ? "Envoi en cours..." : "Soumettre mon avis"}
                                    </button>
                                </div>
                            </form>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
