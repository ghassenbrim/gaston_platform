"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "./AuthModal";
import Image from "next/image";
import type { PortfolioItem, ServiceItem, AboutContent, ContactContent } from "@/backend/admin/homepage";
import type { Pack } from "@/lib/packs";

interface SessionInfo {
    loggedIn: boolean;
    name?: string | null;
    email?: string;
    role?: string;
    dashboard?: string;
}

const Reveal = ({ children, delay = 0, width = "fit-content" }: { children: React.ReactNode, delay?: number, width?: string }) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isVisible ? "opacity-100 translate-y-0 scale-100 blur-0" : "opacity-0 translate-y-12 scale-95 blur-sm"}`}
            style={{ transitionDelay: `${delay}ms`, width }}
        >
            {children}
        </div>
    );
};

const SERVICES_ICONS = [
    <svg key="portrait" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    <svg key="camera" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    <svg key="building" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    <svg key="map" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
];

const categories = ["TOUT", "Mariage", "Anniversaire", "Immobilier", "Evenement", "Autre"];

function getMostExpensivePackIndex(packs: Pack[]) {
    if (!packs.length) return -1;
    const highestPrice = Math.max(...packs.map((pack) => pack.priceValue ?? 0));
    return packs.findIndex((pack) => (pack.priceValue ?? 0) === highestPrice);
}

interface Props {
    portfolio: PortfolioItem[];
    services: ServiceItem[];
    about: AboutContent;
    contact: ContactContent;
    reviews?: {
        rating: number;
        quote: string;
        eventRole?: string | null;
        user?: { name?: string | null } | null;
    }[];
}

// Custom smooth scroll with ease-in-out cubic bezier
function smoothScrollTo(targetId: string) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const start = window.scrollY;
    const target = el.getBoundingClientRect().top + window.scrollY;
    const distance = target - start;
    const duration = 900;
    let startTime: number | null = null;

    const ease = (t: number) => t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function step(timestamp: number) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, start + distance * ease(progress));
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

export default function WelcomePageClient({ portfolio, services, about, contact, reviews = [] }: Props) {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState("TOUT");
    const [selectedServiceIndex, setSelectedServiceIndex] = useState<number | null>(null);
    const [headerActive, setHeaderActive] = useState(false);
    const [activeSection, setActiveSection] = useState("accueil");
    const [authModal, setAuthModal] = useState<{ isOpen: boolean; view: "login" | "signup" }>({
        isOpen: false,
        view: "login",
    });
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [showSessionWarning, setShowSessionWarning] = useState(false);

    // Vérifier la session active au chargement
    useEffect(() => {
        fetch("/api/me").then(r => r.json()).then(data => {
            setSession(data);
        }).catch(() => setSession({ loggedIn: false }));
    }, []);

    useEffect(() => {
        const handleScroll = () => setHeaderActive(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Active section detection
    useEffect(() => {
        const sectionIds = ["accueil", "portfolio", "services", "propos", "avis", "contact"];
        const observers = sectionIds.map(id => {
            const el = document.getElementById(id);
            if (!el) return null;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
                { threshold: 0.3 }
            );
            obs.observe(el);
            return obs;
        });
        return () => observers.forEach(o => o?.disconnect());
    }, []);

    const roleLabel: Record<string, string> = {
        ADMIN: "Administrateur",
        EMPLOYEE: "Employé",
        USER: "Client",
    };

    const handleLoginClick = () => {
        if (session?.loggedIn) {
            setShowSessionWarning(true);
        } else {
            setAuthModal({ isOpen: true, view: "login" });
        }
    };

    const validCategories = categories.filter(c => c !== "TOUT");
    const filteredWorks = selectedCategory === "TOUT"
        ? portfolio
        : portfolio.filter(work =>
            work.category === selectedCategory ||
            (!validCategories.includes(work.category) && selectedCategory === "Autre")
        );
    const selectedService = selectedServiceIndex !== null ? services[selectedServiceIndex] : null;
    const selectedServicePacks = selectedService?.packs ?? [];
    const featuredPackIndex = getMostExpensivePackIndex(selectedServicePacks);

    return (
        <div className="bg-white text-slate-900 selection:bg-[#bca086] selection:text-white scroll-smooth overflow-x-hidden">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] px-4 sm:px-10 py-3 sm:py-6 flex justify-between items-center ${headerActive ? "bg-white/95 backdrop-blur-xl border-b border-slate-100 py-2 sm:py-4 shadow-sm" : "bg-transparent text-white"}`}>
                <div className="text-lg sm:text-2xl font-black tracking-tighter uppercase group cursor-pointer">
                    Gaston <span className="text-[#bca086] group-hover:pl-1 transition-all">Platform</span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-12">
                    <div className="flex gap-10 text-[11px] font-bold uppercase tracking-[0.3em]">
                        {["Accueil", "Portfolio", "Services", "Propos", "Avis", "Contact"].map((item) => {
                            const id = item.toLowerCase();
                            const isActive = activeSection === id;
                            return (
                                <button
                                    key={item}
                                    onClick={() => smoothScrollTo(id)}
                                    className={`relative transition-all duration-300 group ${isActive ? "text-[#bca086]" : "opacity-80 hover:opacity-100 hover:text-[#bca086]"}`}
                                >
                                    {item}
                                    <span className={`absolute -bottom-1 left-0 h-px bg-[#bca086] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? "w-full" : "w-0 group-hover:w-full"}`} />
                                </button>
                            );
                        })}
                    </div>
                    {session?.loggedIn ? (
                        <button
                            onClick={() => router.push(session.dashboard!)}
                            className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-700 border ${headerActive
                                ? "bg-[#bca086] text-white border-[#bca086] hover:bg-[#a8896f] shadow-xl shadow-[#bca086]/20"
                                : "bg-[#bca086]/80 text-white border-[#bca086]/50 hover:bg-[#bca086]"
                                }`}
                        >
                            Mon espace
                        </button>
                    ) : (
                        <button
                            onClick={handleLoginClick}
                            className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-700 border ${headerActive
                                ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200"
                                : "bg-white/10 text-white border-white/20 hover:bg-white hover:text-black"
                                }`}
                        >
                            Se connecter
                        </button>
                    )}
                </div>

                {/* Mobile Login Button */}
                {session?.loggedIn ? (
                    <button
                        onClick={() => router.push(session.dashboard!)}
                        className={`md:hidden px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all duration-700 bg-[#bca086] text-white border border-[#bca086]`}
                    >
                        Mon espace
                    </button>
                ) : (
                    <button
                        onClick={handleLoginClick}
                        className={`md:hidden px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all duration-700 border ${headerActive
                            ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200"
                            : "bg-white/10 text-white border-white/20 hover:bg-white hover:text-black"
                            }`}
                    >
                        Connexion
                    </button>
                )}
            </nav>

            {/* ── AVERTISSEMENT SESSION ACTIVE ── */}
            {showSessionWarning && session?.loggedIn && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowSessionWarning(false)}>
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}>
                        <div className="p-8 space-y-5">
                            {/* Icône warning */}
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
                                <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="font-serif text-2xl italic text-slate-900">Session active</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Vous êtes déjà connecté en tant que{" "}
                                    <span className="font-bold text-slate-800">{session.name || session.email}</span>{" "}
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                                        {roleLabel[session.role!] || session.role}
                                    </span>
                                </p>
                                <p className="text-xs text-amber-600 font-medium bg-amber-50 px-4 py-2 rounded-xl">
                                    Se connecter avec un autre compte déconnectera la session actuelle.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    onClick={() => { setShowSessionWarning(false); router.push(session.dashboard!); }}
                                    className="w-full py-3.5 bg-[#bca086] text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:scale-[1.02] transition-all shadow-lg shadow-[#bca086]/20">
                                    Retourner à mon espace
                                </button>
                                <button
                                    onClick={() => { setShowSessionWarning(false); setAuthModal({ isOpen: true, view: "login" }); }}
                                    className="w-full py-3.5 bg-slate-100 text-slate-600 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-200 transition-all">
                                    Changer de compte (déconnecter)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <section id="accueil" className="relative h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <Image src="/portfolio/hero_bg.png" alt="Hero Background" fill priority quality={85} sizes="100vw" className="object-cover animate-slow-scale opacity-90" style={{ animationDuration: '30s', transformOrigin: 'center' }} />
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>
                <div className="relative z-10 text-center text-white px-6">
                    <Reveal delay={200}><p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.6em] mb-6 sm:mb-10 text-[#bca086]">Photographe d&apos;Art</p></Reveal>
                    <Reveal delay={400}><h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-[11rem] italic leading-none mb-8 sm:mb-12 tracking-tight">Ghassen Brahim</h1></Reveal>
                    <Reveal delay={600}><p className="max-w-3xl mx-auto text-xs sm:text-sm md:text-xl font-light leading-relaxed mb-10 sm:mb-16 opacity-80 tracking-wide">Capturer l&apos;invisible, raconter l&apos;exceptionnel. Un regard singulier sur vos plus beaux instants.</p></Reveal>
                    <Reveal delay={800}>
                        <button onClick={() => router.push("/role/welcompage/devis")} className="inline-block px-8 sm:px-14 py-4 sm:py-6 border border-white/25 rounded-full text-xs sm:text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-md hover:bg-white hover:text-black hover:border-white transition-all duration-700 shadow-2xl active:scale-95">
                            Devis en ligne
                        </button>
                    </Reveal>
                </div>
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-40">
                    <div className="w-px h-32 bg-gradient-to-b from-transparent via-white/50 to-transparent relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-white animate-scroll-line"></div>
                    </div>
                </div>
            </section>

            {/* Portfolio Section */}
            <section id="portfolio" className="py-16 sm:py-24 md:py-40">
                {/* Header */}
                <div className="px-4 sm:px-6 max-w-[1700px] mx-auto flex flex-col md:flex-row justify-between items-end mb-6 sm:mb-10 gap-6 sm:gap-12">
                    <div className="max-w-2xl">
                        <Reveal><p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.5em] text-[#bca086] mb-4 sm:mb-6">Portfolio</p></Reveal>
                        <Reveal delay={200}><h2 className="font-serif text-3xl sm:text-4xl md:text-6xl lg:text-8xl italic leading-tight">L&apos;art en sélection</h2></Reveal>
                    </div>
                    {/* Category filters */}
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`relative px-4 sm:px-6 py-2 sm:py-2.5 text-xs font-black tracking-[0.2em] uppercase rounded-full transition-all duration-300 border ${selectedCategory === cat
                                        ? "bg-[#bca086] text-white border-[#bca086]"
                                        : "bg-transparent text-slate-500 border-slate-200 hover:border-[#bca086] hover:text-[#bca086]"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile: 2 colonnes carrées style Instagram | Desktop: 4 colonnes portrait */}
                <div className="grid grid-cols-2 gap-[2px] md:grid-cols-2 md:gap-6 md:px-6 lg:grid-cols-4 lg:gap-10 lg:px-6 max-w-[1700px] md:mx-auto">
                    {filteredWorks.map((work, index) => (
                        <Reveal key={work.id} delay={index * 80} width="100%">
                            <div className="group relative overflow-hidden bg-slate-100 aspect-square md:aspect-[3.5/5] md:rounded-xl md:shadow-sm md:border md:border-slate-100">
                                <Image
                                    src={work.image}
                                    alt={work.title}
                                    fill
                                    quality={75}
                                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
                                    loading={index < 4 ? "eager" : "lazy"}
                                    className="object-cover transition-transform duration-700 group-hover:scale-105 md:duration-[1500ms]"
                                />
                                {/* Overlay mobile */}
                                <div className="md:hidden absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1 px-2">
                                    <span className="font-serif text-white text-xs italic text-center leading-tight line-clamp-2">
                                        {work.title}
                                    </span>
                                    <span className="text-[#bca086] text-[9px] font-bold uppercase tracking-widest">
                                        {work.category}
                                    </span>
                                </div>
                                {/* Overlay desktop */}
                                <div className="hidden md:flex absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-all duration-1000 flex-col justify-end p-12 backdrop-blur-[3px]">
                                    <span className="font-serif text-xs font-medium text-[#bca086] tracking-[0.3em] mb-3 translate-y-6 group-hover:translate-y-0 transition-transform duration-700 delay-100 italic">{work.category}</span>
                                    <h3 className="font-serif text-4xl italic text-white translate-y-6 group-hover:translate-y-0 transition-transform duration-700 delay-200 leading-tight">{work.title}</h3>
                                    <div className="w-12 h-px bg-[#bca086] mt-8 translate-x-[-150%] group-hover:translate-x-0 transition-transform duration-1000 delay-300"></div>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-16 sm:py-24 md:py-40 bg-slate-50/50">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16 sm:mb-24 md:mb-32">
                        <Reveal delay={200} width="100%"><h2 className="font-serif text-3xl sm:text-4xl md:text-6xl lg:text-8xl italic mb-8 sm:mb-12">Créer l&apos;impérissable</h2></Reveal>
                        <Reveal delay={400} width="100%">
                            <p className="max-w-3xl mx-auto text-slate-500 text-lg font-light leading-relaxed tracking-wide">
                                Chaque cliché est une pièce de collection. Une approche sur-mesure pour sublimer vos moments les plus précieux avec une signature intemporelle.
                            </p>
                        </Reveal>
                    </div>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
                        {services.map((service, idx) => {
                            const isSelected = selectedServiceIndex === idx;

                            return (
                                <Reveal key={idx} delay={idx * 200} width="100%">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedServiceIndex(idx)}
                                        className={`group flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] border bg-white text-center shadow-[0_22px_70px_-42px_rgba(15,23,42,0.35)] transition-all duration-700 hover:-translate-y-2 hover:border-[#bca086]/30 hover:shadow-[0_45px_100px_-45px_rgba(15,23,42,0.45)] ${isSelected ? "border-[#bca086] ring-4 ring-[#bca086]/10" : "border-slate-100"}`}
                                    >
                                        <div className="flex flex-1 flex-col items-center px-5 py-8 sm:px-7 md:px-8">
                                            <div className={`mb-8 rounded-full p-5 shadow-inner transition-all duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-110 sm:p-6 ${isSelected ? "bg-[#bca086] text-white" : "bg-[#bca086]/5 text-[#bca086] group-hover:bg-[#bca086] group-hover:text-white"}`}>
                                                {SERVICES_ICONS[idx % SERVICES_ICONS.length]}
                                            </div>
                                            <h3 className="font-serif text-3xl italic mb-4 text-slate-950">{service.title}</h3>
                                            <p className="text-sm text-slate-500 font-light leading-relaxed mb-8 tracking-wide">{service.description}</p>

                                            <div className="w-10 h-px bg-slate-200 mb-6 group-hover:w-20 group-hover:bg-[#bca086] transition-all duration-1000 mt-auto"></div>
                                            <span className={`text-[11px] font-bold uppercase tracking-[0.15em] px-6 py-3 rounded-full transition-colors whitespace-nowrap ${isSelected ? "bg-[#bca086] text-white" : "text-[#bca086] bg-[#bca086]/5 group-hover:bg-[#bca086] group-hover:text-white"}`}>
                                                {isSelected ? "Packs affichés" : "Voir les packs"}
                                            </span>
                                        </div>
                                    </button>
                                </Reveal>
                            );
                        })}
                    </div>

                    {selectedService && (
                        <Reveal key={selectedService.title} delay={120} width="100%">
                            <div className="mt-12 overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_35px_100px_-55px_rgba(15,23,42,0.45)]">
                                <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-8 sm:px-10 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#bca086]">Packs disponibles</p>
                                        <h3 className="mt-3 font-serif text-4xl italic text-slate-950 sm:text-5xl">{selectedService.title}</h3>
                                        <p className="mt-3 max-w-2xl text-sm font-light leading-7 text-slate-500">{selectedService.description}</p>
                                    </div>
                                    <span className="w-fit rounded-full bg-[#bca086]/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#bca086]">
                                        {selectedService.price}
                                    </span>
                                </div>

                                {selectedServicePacks.length > 0 ? (
                                    <div className="grid gap-4 p-5 sm:p-8 lg:grid-cols-3">
                                        {selectedServicePacks.map((pack, pIdx) => {
                                            const isFeatured = pIdx === featuredPackIndex;

                                            return (
                                                <article
                                                    key={`${selectedService.title}-${pack.name}-${pIdx}`}
                                                    className={`relative flex flex-col overflow-hidden rounded-[1.5rem] border transition-all duration-500 ${isFeatured
                                                        ? "lg:scale-[1.04] border-[#bca086]/40 bg-slate-950 p-6 text-white shadow-[0_25px_60px_-28px_rgba(15,23,42,0.8)]"
                                                        : "border-slate-100 bg-slate-50 p-5 text-slate-950"
                                                        }`}
                                                >
                                                    {isFeatured && <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-[#bca086]/15" />}
                                                    <div className="relative flex items-start justify-between gap-3">
                                                        <div>
                                                            {isFeatured && (
                                                                <span className="mb-4 inline-flex rounded-full bg-[#bca086] px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-white">
                                                                    Signature
                                                                </span>
                                                            )}
                                                            <h4 className={`font-bold ${isFeatured ? "font-serif text-3xl italic text-white" : "text-lg text-slate-950"}`}>{pack.name}</h4>
                                                        </div>
                                                        <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black tracking-widest ${isFeatured ? "bg-white text-slate-950" : "bg-[#bca086]/10 text-[#bca086]"}`}>{pack.price}</span>
                                                    </div>
                                                    <ul className="relative mt-7 space-y-3">
                                                        {pack.features.map((feature, fIdx) => (
                                                            <li key={fIdx} className={`flex items-start gap-3 text-sm leading-5 ${isFeatured ? "text-white/75" : "text-slate-500"}`}>
                                                                <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#bca086]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span>{feature}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </article>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-10 text-center text-sm font-medium text-slate-400">
                                        Aucun pack configuré pour ce service.
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    )}
                </div>
            </section>

            {/* About Section */}
            <section id="propos" className="py-16 sm:py-24 md:py-48 px-4 sm:px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 md:gap-20 lg:gap-32">
                    <div className="w-full lg:w-1/2">
                        <Reveal width="100%">
                            <div className="relative group">
                                <div className="aspect-[4/5.5] bg-slate-100 overflow-hidden rounded-2xl relative z-10 shadow-2xl border border-slate-100">
                                    <Image src={about.image || "/portfolio/photographer_portrait.png"} alt="Photographe" fill quality={80} sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-[3000ms] group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-slate-900 shadow-inner opacity-0 group-hover:opacity-10 transition-opacity duration-1000"></div>
                                </div>
                                <div className="font-serif absolute -top-8 -left-8 sm:-top-12 sm:-left-12 md:-top-20 md:-left-20 text-[5rem] sm:text-[8rem] md:text-[12rem] lg:text-[18rem] italic text-slate-100/80 -z-10 leading-none select-none mix-blend-multiply">G.</div>
                                <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-[#bca086]/10 blur-[120px] -z-10 animate-pulse"></div>
                            </div>
                        </Reveal>
                    </div>
                    <div className="w-full lg:w-1/2">
                        <Reveal width="100%"><p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.6em] text-[#bca086] mb-6 sm:mb-10 underline underline-offset-[12px] decoration-1 opacity-70">L&apos;Histoire d&apos;un Regard</p></Reveal>
                        <Reveal delay={200} width="100%"><h2 className="font-serif text-3xl sm:text-4xl md:text-6xl xl:text-9xl italic mb-8 sm:mb-12 leading-[1.1] sm:leading-[0.9] tracking-tight sm:tracking-tighter">L&apos;art de capturer l&apos;éternité</h2></Reveal>
                        <Reveal delay={400} width="100%">
                            <div className="space-y-10 text-xl text-slate-500 leading-relaxed font-light tracking-wide">
                                <p>{about.bio1}</p>
                                <p>{about.bio2}</p>
                            </div>
                        </Reveal>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12 md:gap-16 mt-12 sm:mt-16 md:mt-20 pt-12 sm:pt-16 md:pt-20 border-t border-slate-100">
                            {(about.stats ?? []).map((stat, i) => (
                                <Reveal key={i} delay={600 + (i * 100)}>
                                    <p className="font-serif text-4xl sm:text-5xl md:text-6xl italic text-slate-900 mb-2 sm:mb-3">{stat.val}</p>
                                    <p className="text-[9px] sm:text-xs font-black uppercase tracking-[0.4em] text-[#bca086] opacity-80">{stat.label}</p>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Avis Section */}
            <section id="avis" className="py-16 sm:py-24 md:py-40 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50/50 -skew-x-12 transform origin-top"></div>
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10">
                    <div className="text-center mb-16 sm:mb-24 md:mb-32">
                        <Reveal delay={200} width="100%">
                            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.6em] text-[#bca086] mb-6">Témoignages</p>
                        </Reveal>
                        <Reveal delay={400} width="100%">
                            <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl lg:text-7xl italic mb-8 sm:mb-12">
                                Ce qu&apos;ils disent de nous
                            </h2>
                        </Reveal>
                    </div>

                    <div className="flex overflow-x-auto scroll-smooth gap-6 sm:gap-8 md:gap-10 pb-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                        {reviews.length > 0 ? reviews.map((review, idx) => (
                            <div key={idx} className="min-w-[85vw] sm:min-w-[340px] lg:min-w-[400px] shrink-0 flex flex-col">
                                <Reveal delay={idx * 100} width="100%">
                                    <div className="group bg-gradient-to-br from-white to-slate-50/80 p-8 sm:p-10 border border-slate-100 hover:border-[#bca086]/30 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-15px_rgba(188,160,134,0.15)] rounded-[2rem] relative hover:-translate-y-2 transition-all duration-700 flex flex-col h-full w-full overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#bca086]/5 to-transparent rounded-bl-full pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100"></div>
                                        <div className="font-serif text-[#bca086]/10 group-hover:text-[#bca086]/20 text-9xl absolute -top-4 left-2 leading-none select-none transition-colors duration-700">
                                            &quot;
                                        </div>
                                        <div className="flex gap-1.5 mb-8 relative z-10 mt-6">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className={`w-4 h-4 transition-colors duration-500 ${review.rating > i ? "text-[#bca086]" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <p className="text-slate-600 text-lg leading-relaxed mb-10 relative z-10 font-light italic flex-1">
                                            {review.quote}
                                        </p>
                                        <div className="flex items-center gap-4 pt-6 mt-auto relative z-10">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#bca086]/20 to-[#bca086]/5 flex items-center justify-center text-[#bca086] font-black text-lg shrink-0 border border-[#bca086]/10 shadow-inner">
                                                {(review.user?.name || "C").charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-slate-900 font-bold text-[15px] truncate">{review.user?.name || "Client Anonyme"}</p>
                                                <p className="text-[9px] uppercase tracking-[0.2em] text-[#bca086] mt-1 truncate font-bold opacity-80">{review.eventRole || "Gaston Platform"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Reveal>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-12 text-slate-400 font-light italic">
                                Aucun avis publié pour le moment.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="bg-[#050505] text-white py-16 sm:py-24 md:py-48 px-4 sm:px-6">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12 sm:gap-16 md:gap-32">
                    <div className="max-w-2xl">
                        <Reveal width="100%"><h2 className="font-serif text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-[9rem] italic leading-[1.1] sm:leading-[0.9] md:leading-[0.85] mb-8 sm:mb-12 md:mb-16 tracking-tight sm:tracking-tighter">Écrivons votre histoire.</h2></Reveal>
                        <Reveal delay={200} width="100%"><p className="text-slate-400 text-base sm:text-xl md:text-2xl font-light leading-relaxed mb-12 sm:mb-16 md:mb-20 opacity-50 tracking-wide max-w-xl">Pour toute collaboration, projet ou demande spécifique, créons ensemble quelque chose d&apos;unique.</p></Reveal>
                        <Reveal delay={400} width="100%">
                            <a
                                href={`mailto:${contact.email}`}
                                className="font-serif group inline-flex items-center text-xl sm:text-2xl md:text-3xl lg:text-5xl italic hover:text-[#bca086] transition-all duration-700">
                                {contact.email}
                                <svg className="w-12 h-12 ml-8 transition-transform duration-700 group-hover:translate-x-4 text-[#bca086]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </a>
                        </Reveal>
                    </div>
                    <div className="flex flex-col gap-8 sm:gap-12 text-xs sm:text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 self-end md:self-auto text-right">
                        {[
                            { label: "Instagram", href: contact.instagram, icon: <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
                            { label: "Facebook", href: contact.facebook, icon: <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                            { label: "LinkedIn", href: contact.linkedin, icon: <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                        ].map(social => (
                            <a key={social.label} href={social.href || "#"} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-end md:justify-end gap-3 sm:gap-4 hover:text-[#bca086] transition-all">
                                <span className="group-hover:tracking-[0.8em] transition-all duration-300">{social.label}</span>
                                {social.icon}
                            </a>
                        ))}
                        <p className="mt-32 opacity-20 font-medium tracking-normal text-[11px]">© 2026 Ghassen Brahim — Fine Art Photography</p>
                    </div>
                </div>
            </footer>

            <AuthModal
                isOpen={authModal.isOpen}
                initialView={authModal.view}
                onClose={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
