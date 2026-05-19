"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { loginAction } from "./actions";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setIsMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await loginAction(formData);

        if (!result.success) {
            setError(result.error || "Une erreur est survenue.");
            setIsLoading(false);
            return;
        }

        // Connexion réussie - redirection vers le dashboard approprié
        console.log("[LoginPage] Connexion réussie, redirection vers:", result.dashboard);
        
        // Stocker la session en sessionStorage pour récupération d'onglets
        if (result.userId && result.role) {
            sessionStorage.setItem("gaston_tab_session", JSON.stringify({
                userId: result.userId,
                role: result.role
            }));
        }

        // Rediriger vers le dashboard
        const dashboardUrl = (result as any).dashboard || "/role/user/dashboard";
        router.push(dashboardUrl);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
            {/* Background elements for depth - hidden on small screens */}
            <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#bca086]/5 blur-[80px] sm:blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-slate-200/50 blur-[80px] sm:blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className={`w-full max-w-sm sm:max-w-md lg:max-w-xl relative z-10 transition-all duration-1000 ease-out ${isMounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"}`}>
                {/* Brand Header */}
                <div className="text-center mb-6 sm:mb-10">
                    <Link href="/role/welcompage" className="inline-block group">
                        <div className="text-lg sm:text-2xl font-black tracking-tighter uppercase mb-1 sm:mb-2">
                            Gaston <span className="text-[#bca086] group-hover:pl-1 transition-all">Platform</span>
                        </div>
                        <div className="w-6 sm:w-8 h-px bg-[#bca086]/30 mx-auto transition-all group-hover:w-16 sm:group-hover:w-20"></div>
                    </Link>
                </div>

                {/* Login Card: Glassmorphism */}
                <div className="bg-white/90 backdrop-blur-3xl p-6 sm:p-10 md:p-14 rounded-2xl sm:rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] sm:shadow-[0_50px_120px_-20px_rgba(0,0,0,0.3)] border border-white/40">
                    <div className="mb-8 sm:mb-12 text-center">
                        <h1 className="font-serif text-3xl sm:text-5xl italic mb-2 sm:mb-4 text-slate-900 tracking-tight">Bienvenue</h1>
                        <p className="text-xs sm:text-sm text-slate-400 font-light tracking-[0.05em] sm:tracking-[0.1em] uppercase">Accès Client Privé</p>
                    </div>

                    {error && (
                        <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-wider rounded-xl text-center animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
                        <div className="space-y-2 sm:space-y-3">
                            <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-slate-400 ml-1 sm:ml-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="votre@email.com"
                                className="w-full px-4 sm:px-8 py-3 sm:py-5 bg-white/50 border border-slate-100 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:ring-4 focus:ring-[#bca086]/10 transition-all outline-none shadow-sm"
                            />
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-slate-400 ml-0.5 sm:ml-1">Mot de passe</label>
                                <a href="#" className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#bca086] hover:opacity-70 transition-opacity">Oublié ?</a>
                            </div>
                            <input
                                type="password"
                                name="password"
                                required
                                placeholder="••••••••"
                                className="w-full px-4 sm:px-8 py-3 sm:py-5 bg-white/50 border border-slate-100 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:ring-4 focus:ring-[#bca086]/10 transition-all outline-none shadow-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 sm:py-6 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] transition-all duration-700 flex items-center justify-center gap-4 active:scale-95 shadow-lg sm:shadow-2xl ${isLoading
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-slate-900 text-white hover:bg-[#bca086] hover:shadow-[#bca086]/20 shadow-slate-200"
                                }`}
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                "Se connecter"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 sm:mt-12 text-center">
                        <p className="text-xs sm:text-sm text-slate-400 font-light tracking-wide">
                            Pas encore de compte ? {" "}
                            <Link href="/role/welcompage/signe_up" className="text-[#bca086] font-bold hover:underline underline-offset-4 decoration-1 transition-all">S&apos;inscrire</Link>
                        </p>
                    </div>
                </div>

                {/* Aesthetic Footer Info */}
                <div className="mt-10 sm:mt-16 text-center opacity-30">
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-900 uppercase tracking-[0.4em] sm:tracking-[0.5em]">Gaston Platform</p>
                </div>
            </div>

            <style jsx global>{`
                ::selection {
                    background: #bca086;
                    color: white;
                }
            `}</style>
        </div>
    );
}
