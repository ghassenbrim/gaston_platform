"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { loginAction } from "./signe_in/actions";
import { signUpAction, sendVerificationAction, verifyCodeAction } from "./signe_up/actions";

// Sauvegarde la session dans sessionStorage (par onglet)
export function saveTabSession(data: { userId: string; role: string; name?: string | null; email?: string | null }) {
    sessionStorage.setItem("gaston_tab_session", JSON.stringify(data));
}


interface AuthModalProps {
    isOpen: boolean;
    initialView?: "login" | "signup";
    onClose: () => void;
}

export function AuthModal({ isOpen, initialView = "login", onClose }: AuthModalProps) {
    const router = useRouter();
    const [view, setView] = useState<"login" | "signup">(initialView);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Email verification
    const [signupEmail, setSignupEmail] = useState("");
    const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (countdown > 0) {
            const t = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [countdown]);

    useEffect(() => {
        setSignupEmail("");
        setDigits(["", "", "", "", "", ""]);
        setIsEmailSent(false);
        setIsEmailVerified(false);
        setCountdown(0);
        setError(null);
    }, [view]);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => { setView(initialView); setIsAnimating(true); });
            document.body.style.overflow = "hidden";
        } else {
            const t = setTimeout(() => { setIsAnimating(false); document.body.style.overflow = "unset"; }, 500);
            return () => clearTimeout(t);
        }
    }, [isOpen, initialView]);

    if (!isOpen && !isAnimating) return null;

    const handleSendCode = async () => {
        const normalizedEmail = signupEmail.trim().toLowerCase();
        if (!normalizedEmail || !normalizedEmail.includes("@")) {
            setError("Veuillez entrer une adresse email valide."); return;
        }
        setSignupEmail(normalizedEmail);
        setIsSending(true); setError(null);
        try {
            const result = await sendVerificationAction(normalizedEmail);
            if (result.success) {
                setIsEmailSent(true);
                setDigits(["", "", "", "", "", ""]);
                setCountdown(60);
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
            } else {
                setIsEmailSent(false);
                setError(result.error || "Erreur lors de l'envoi du code.");
            }
        } catch { setError("Erreur serveur."); }
        finally {
            setIsSending(false);
        }
    };

    const handleDigitChange = (i: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        setDigits(prev => { const n = [...prev]; n[i] = digit; return n; });
        if (digit && i < 5) inputRefs.current[i + 1]?.focus();
    };

    const handleDigitKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
    };

    const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (p.length === 6) { setDigits(p.split("")); inputRefs.current[5]?.focus(); }
    };

    const handleVerifyCode = async () => {
        const code = digits.join("");
        if (code.length < 6) { setError("Entrez les 6 chiffres du code."); return; }
        setIsVerifying(true); setError(null);
        const result = await verifyCodeAction(signupEmail.trim().toLowerCase(), code);
        if (result.success) {
            setIsEmailVerified(true);
        } else {
            setError(result.error || "Code incorrect ou expiré.");
            setDigits(["", "", "", "", "", ""]);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
        setIsVerifying(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true); setError(null);
        const formData = new FormData(e.currentTarget);

        if (view === "signup") {
            if (!isEmailVerified) {
                setError("Veuillez vérifier votre email avant de continuer.");
                setIsLoading(false); return;
            }
            const pwd = formData.get("password") as string;
            const confirm = formData.get("password_confirm") as string;
            if (pwd !== confirm) {
                setError("Les mots de passe ne correspondent pas.");
                setIsLoading(false); return;
            }
            const result = await signUpAction(formData);
            setIsLoading(false);
            if (result.success) { setView("login"); }
            else { setError(result.error || "Impossible de créer le compte."); }
        } else {
            const result = await loginAction(formData);
            if (result.success && 'userId' in result) {
                // Sauvegarder la session dans sessionStorage (par onglet)
                saveTabSession({
                    userId: result.userId!,
                    role:   result.role!,
                    name:   result.name,
                    email:  result.email,
                });
                // Naviguer vers le bon dashboard
                router.push(result.dashboard!);
            } else {
                setError((result as { error?: string }).error || "Email ou mot de passe incorrect.");
                setIsLoading(false);
            }
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-3 pt-4 sm:items-center sm:p-6 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md cursor-pointer" onClick={onClose} />

            <div className={`w-full max-w-sm sm:max-w-xl relative bg-white/90 backdrop-blur-3xl p-4 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-[0_50px_120px_-20px_rgba(0,0,0,0.3)] border border-white/40 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-y-auto max-h-[calc(100dvh-2rem)] ${isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-12 opacity-0"}`}>

                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors p-2 z-20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center mb-6">
                    <div className="text-xl font-black tracking-tighter uppercase mb-2">Gaston <span className="text-[#bca086]">Platform</span></div>
                    <div className="w-8 h-px bg-[#bca086]/30 mx-auto" />
                </div>

                <div className="relative">

                    {/* ── LOGIN ── */}
                    <div className={`transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${view === "login" ? "opacity-100 translate-x-0 relative z-10" : "opacity-0 -translate-x-12 absolute inset-0 pointer-events-none z-0"}`}>
                        <div className="text-center mb-8">
                            <h2 className="font-serif text-4xl sm:text-5xl italic mb-3 text-slate-900 tracking-tight">Connexion</h2>
                            <p className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase">Espace Privé</p>
                        </div>
                        {error && <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-xl text-center">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Email</label>
                                <input type="email" name="email" required placeholder="votre@email.com" className="w-full px-7 py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Mot de passe</label>
                                    <button type="button" className="text-[9px] font-bold uppercase tracking-widest text-[#bca086] hover:opacity-70 transition-opacity">Oublié ?</button>
                                </div>
                                <input type="password" name="password" required placeholder="••••••••" className="w-full px-7 py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none transition-all" />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full py-4 sm:py-5 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] sm:tracking-[0.4em] transition-all bg-slate-900 text-white hover:bg-[#bca086] shadow-xl active:scale-[0.98] flex items-center justify-center gap-3">
                                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Se connecter"}
                            </button>
                        </form>
                        <div className="mt-10 text-center pt-6 border-t border-slate-50">
                            <p className="text-[10px] text-slate-400 tracking-wide uppercase font-light">
                                Pas encore de compte ?{" "}
                                <button onClick={() => setView("signup")} className="text-[#bca086] font-bold hover:underline transition-all ml-2 tracking-[0.1em]">S&apos;inscrire</button>
                            </p>
                        </div>
                    </div>

                    {/* ── SIGNUP ── */}
                    <div className={`transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${view === "signup" ? "opacity-100 translate-x-0 relative z-10" : "opacity-0 translate-x-12 absolute inset-0 pointer-events-none z-0"}`}>
                        <div className="text-center mb-6">
                            <h2 className="font-serif text-4xl sm:text-5xl italic mb-3 text-slate-900 tracking-tight">Inscription</h2>
                            <p className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase">Espace Membre</p>
                        </div>
                        {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-xl text-center">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="hidden" name="email" value={signupEmail} />

                            {/* Nom */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Nom complet</label>
                                <input type="text" name="name" required placeholder="Jean Dupont" className="w-full px-4 sm:px-7 py-3.5 sm:py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none transition-all" />
                            </div>

                            {/* Email + OTP */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Email</label>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                                    <input
                                        type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}
                                        disabled={isEmailVerified} required placeholder="votre@email.com"
                                        className={`min-w-0 w-full px-4 sm:px-5 py-3.5 sm:py-4 border rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none transition-all ${isEmailVerified ? "bg-green-50 border-green-200 text-green-700" : "bg-white/50 border-slate-100"}`}
                                    />
                                    {!isEmailVerified && (
                                        <button type="button" onClick={handleSendCode} disabled={isSending || countdown > 0}
                                            className={`w-full sm:w-auto px-4 py-3.5 sm:py-0 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${countdown > 0 ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-white hover:bg-[#bca086]"}`}>
                                            {isSending ? "..." : countdown > 0 ? `${countdown}s` : isEmailSent ? "Renvoyer" : "Envoyer"}
                                        </button>
                                    )}
                                    {isEmailVerified && (
                                        <div className="flex items-center justify-center px-3 py-2 text-green-500">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* 6 cases OTP email */}
                                {!isEmailVerified && (
                                    <div className="space-y-2 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">
                                            {isEmailSent ? `Code envoyé à ${signupEmail}` : "Code de vérification email"}
                                        </p>
                                        <div className="grid grid-cols-6 gap-1.5 sm:flex sm:justify-center sm:gap-2">
                                            {digits.map((digit, i) => (
                                                <input key={i}
                                                    ref={(el) => { inputRefs.current[i] = el; }}
                                                    type="text" inputMode="numeric" maxLength={1} value={digit}
                                                    disabled={!isEmailSent}
                                                    onChange={(e) => handleDigitChange(i, e.target.value)}
                                                    onKeyDown={(e) => handleDigitKeyDown(i, e)}
                                                    onPaste={i === 0 ? handleDigitPaste : undefined}
                                                    className={`h-11 w-full min-w-0 sm:w-10 sm:h-12 text-center text-lg font-bold border-2 rounded-xl outline-none transition-all
                                                        ${!isEmailSent ? "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed" :
                                                          digit ? "border-[#bca086] bg-[#bca086]/10 text-slate-900" : "border-slate-200 bg-white text-slate-400"}
                                                        ${isEmailSent ? "focus:border-[#bca086] focus:ring-2 focus:ring-[#bca086]/10" : ""}`}
                                                />
                                            ))}
                                        </div>
                                        <button type="button" onClick={handleVerifyCode}
                                            disabled={!isEmailSent || isVerifying || digits.join("").length < 6}
                                            className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.18em] sm:tracking-[0.3em] transition-all
                                                ${isEmailSent && digits.join("").length === 6 && !isVerifying
                                                    ? "bg-[#bca086] text-white hover:bg-slate-900 shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                                            {isVerifying ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Vérification...
                                                </span>
                                            ) : "Vérifier le code"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Téléphone + Âge */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Téléphone</label>
                                    <input type="tel" name="phone" required placeholder="+216 -- --- ---" className="w-full px-4 sm:px-7 py-3.5 sm:py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Âge</label>
                                    <input type="number" name="age" required placeholder="25" className="w-full px-4 sm:px-7 py-3.5 sm:py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none transition-all" />
                                </div>
                            </div>

                            {/* Genre */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Genre</label>
                                <select name="gender" required className="w-full px-4 sm:px-7 py-3.5 sm:py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none appearance-none">
                                    <option value="">Sélectionner</option>
                                    <option value="homme">Homme</option>
                                    <option value="femme">Femme</option>
                                    <option value="autre">Autre</option>
                                </select>
                            </div>

                            {/* Mot de passe */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Mot de passe</label>
                                    <input type="password" name="password" required placeholder="••••••••" className="w-full px-4 sm:px-7 py-3.5 sm:py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 ml-2">Confirmer</label>
                                    <input type="password" name="password_confirm" required placeholder="••••••••" className="w-full px-4 sm:px-7 py-3.5 sm:py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-[#bca086]/10 outline-none transition-all" />
                                </div>
                            </div>

                            {/* Bouton S'inscrire */}
                            <button type="submit" disabled={isLoading || !isEmailVerified}
                                className={`w-full py-4 sm:py-5 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] sm:tracking-[0.4em] transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3
                                    ${isEmailVerified && !isLoading ? "bg-slate-900 text-white hover:bg-[#bca086]" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                                {isLoading ? <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" /> : "S'inscrire"}
                            </button>
                        </form>

                        <div className="mt-6 text-center pt-6 border-t border-slate-50">
                            <p className="text-[10px] text-slate-400 tracking-wide uppercase font-light">
                                Déjà inscrit ?{" "}
                                <button onClick={() => setView("login")} className="text-[#bca086] font-bold hover:underline transition-all ml-2 tracking-[0.1em]">Se connecter</button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
