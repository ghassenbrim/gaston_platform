"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function SignUpPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setIsMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            window.location.href = "/role/welcompage/signe_in";
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements for depth */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#bca086]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-200/50 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className={`w-full max-w-xl relative z-10 transition-all duration-1000 ease-out ${isMounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"}`}>
                {/* Brand Header */}
                <div className="text-center mb-10">
                    <Link href="/role/welcompage" className="inline-block group">
                        <div className="text-2xl font-black tracking-tighter uppercase mb-2">
                            Gaston <span className="text-[#bca086] group-hover:pl-1 transition-all">Platform</span>
                        </div>
                        <div className="w-8 h-px bg-[#bca086]/30 mx-auto transition-all group-hover:w-20"></div>
                    </Link>
                </div>

                {/* SignUp Card: Glassmorphism */}
                <div className="bg-white/90 backdrop-blur-3xl p-10 md:p-14 rounded-[2.5rem] shadow-[0_50px_120px_-20px_rgba(0,0,0,0.3)] border border-white/40">
                    <div className="mb-12 text-center">
                        <h1 className="font-serif text-5xl italic mb-4 text-slate-900 tracking-tight">Créer un compte</h1>
                        <p className="text-slate-400 text-sm font-light tracking-[0.1em] uppercase">Rejoignez l&apos;univers Gaston</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Nom complet</label>
                            <input
                                type="text" required placeholder="Ghassen Brahim"
                                className="w-full px-8 py-5 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none shadow-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Email</label>
                                <input
                                    type="email" required placeholder="votre@email.com"
                                    className="w-full px-8 py-5 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none shadow-sm"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Téléphone</label>
                                <input
                                    type="tel" required placeholder="+216 -- --- ---"
                                    className="w-full px-8 py-5 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Âge</label>
                                <input
                                    type="number" required placeholder="25"
                                    className="w-full px-8 py-5 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none shadow-sm"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Genre</label>
                                <select
                                    required
                                    className="w-full px-8 py-5 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none appearance-none shadow-sm"
                                >
                                    <option value="">Sélectionner</option>
                                    <option value="homme">Homme</option>
                                    <option value="femme">Femme</option>
                                    <option value="autre">Autre</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Mot de passe</label>
                                <input
                                    type="password" required placeholder="••••••••"
                                    className="w-full px-8 py-5 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none shadow-sm"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Confirmer</label>
                                <input
                                    type="password" required placeholder="••••••••"
                                    className="w-full px-8 py-5 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-700 flex items-center justify-center gap-4 active:scale-95 shadow-2xl ${isLoading
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
                                    "Créer mon compte"
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-xs text-slate-400 font-light tracking-wide">
                            Déjà membre ? {" "}
                            <Link href="/role/welcompage/signe_in" className="text-[#bca086] font-bold hover:underline underline-offset-4 decoration-1 transition-all">Se connecter</Link>
                        </p>
                    </div>
                </div>

                {/* Aesthetic Footer Info */}
                <div className="mt-16 text-center opacity-30">
                    <p className="text-[9px] font-bold text-slate-900 uppercase tracking-[0.5em]">Ghassen Brahim — Fine Art Photography</p>
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
