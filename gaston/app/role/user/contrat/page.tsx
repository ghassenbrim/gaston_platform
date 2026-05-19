"use client";

// Page de consultation des contrats de l'utilisateur.
// Récupère les contrats depuis l'API et les affiche sous forme de cartes.
// Supporte les fichiers PDF et les images, avec aperçu et téléchargement.

import React, { useState, useEffect } from "react";
import { Playfair_Display } from "next/font/google";

// Police Playfair Display pour les titres élégants
const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

// Structure d'un contrat retourné par l'API
interface Contract {
    id: string;
    url: string;     // URL du fichier (PDF ou image)
    status: string;  // Statut du contrat (ex: "ACTIVE")
    createdAt: string;
    isPdf: boolean;  // true si le fichier est un PDF, false si c'est une image
}

/**
 * Formate une date ISO en date lisible en français.
 * Exemple : "2024-01-15T10:00:00Z" → "15 janvier 2024"
 */
function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Télécharge un fichier depuis une URL et déclenche le téléchargement navigateur.
 * Utilise l'API Blob pour éviter d'ouvrir le fichier dans un nouvel onglet.
 */
async function downloadFile(url: string, filename: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    // Libère la mémoire en révoquant l'URL objet après usage
    URL.revokeObjectURL(a.href);
}

// ─── Carte contrat ────────────────────────────────────────────────────────────
// Affiche un contrat individuel avec son aperçu, son statut et ses actions
function ContractCard({ contract, index }: { contract: Contract; index: number }) {
    // État local pour désactiver le bouton pendant le téléchargement
    const [downloading, setDownloading] = useState(false);

    /**
     * Lance le téléchargement du fichier avec un nom formaté.
     * Détermine l'extension depuis l'URL ou le type de fichier.
     */
    const handleDownload = async () => {
        setDownloading(true);
        const ext = contract.url.split(".").pop() || (contract.isPdf ? "pdf" : "jpg");
        await downloadFile(contract.url, `contrat-${index + 1}.${ext}`);
        setDownloading(false);
    };

    // Ouvre le fichier dans un nouvel onglet pour consultation
    const handleView = () => {
        window.open(contract.url, "_blank");
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden hover:shadow-xl transition-all">
            {/* En-tête : icône type fichier, numéro de contrat, date et statut */}
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-zinc-800/30">
                <div className="flex items-center gap-5">
                    {/* Icône de couleur différente selon le type (PDF = rouge, image = ambre) */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${contract.isPdf
                        ? "bg-rose-100 dark:bg-rose-900/30 text-rose-500"
                        : "bg-amber-100 dark:bg-amber-900/30 text-amber-500"}`}>
                        {contract.isPdf ? (
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        ) : (
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        )}
                    </div>
                    <div>
                        {/* Numéro formaté sur 3 chiffres (ex: Contrat #001) */}
                        <h2 className={`${playfair.className} text-2xl italic text-slate-900 dark:text-white`}>
                            Contrat #{String(index + 1).padStart(3, "0")}
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">
                            Ajouté le {formatDate(contract.createdAt)} · {contract.isPdf ? "PDF" : "Image"}
                        </p>
                    </div>
                </div>
                {/* Badge de statut : style différent selon l'état ACTIVE ou autre */}
                <span className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full border shrink-0 ${contract.status === "ACTIVE"
                    ? "bg-[#bca086]/10 text-[#bca086] border-[#bca086]/20"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-white/5"}`}>
                    {contract.status === "ACTIVE" ? "Document actif" : contract.status}
                </span>
            </div>

            {/* Aperçu image cliquable (uniquement pour les fichiers image, pas PDF) */}
            {!contract.isPdf && (
                <div className="relative bg-slate-50 dark:bg-zinc-800/30 h-48 overflow-hidden cursor-pointer" onClick={handleView}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={contract.url}
                        alt={`Contrat ${index + 1}`}
                        className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                    />
                    {/* Overlay "Voir en grand" affiché au survol */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <span className="px-4 py-2 bg-black/60 text-white text-xs font-black uppercase tracking-widest rounded-xl backdrop-blur-sm">
                            Voir en grand
                        </span>
                    </div>
                </div>
            )}

            {/* Zone d'aperçu pour les fichiers PDF (sans rendu visuel natif) */}
            {contract.isPdf && (
                <div
                    className="bg-slate-50 dark:bg-zinc-800/30 h-40 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-colors"
                    onClick={handleView}
                >
                    <svg className="w-12 h-12 text-rose-300 dark:text-rose-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Cliquer pour ouvrir le PDF</p>
                </div>
            )}

            {/* Zone d'actions : Consulter (ouvrir) et Télécharger */}
            <div className="p-8 flex flex-col sm:flex-row gap-3 justify-end border-t border-slate-100 dark:border-white/5">
                <button
                    onClick={handleView}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Consulter
                </button>
                {/* Bouton de téléchargement désactivé pendant le traitement */}
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {downloading ? (
                        <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Téléchargement…</>
                    ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Télécharger</>
                    )}
                </button>
            </div>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ContractPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);

    // Chargement des contrats de l'utilisateur au montage de la page
    useEffect(() => {
        fetch("/api/user/contracts")
            .then(r => r.ok ? r.json() : [])
            .then(data => setContracts(Array.isArray(data) ? data : []))
            .catch(() => setContracts([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-6 md:p-12 lg:p-20">
            {/* En-tête de la page */}
            <header className="mb-12 space-y-4">
                <h1 className={`${playfair.className} text-4xl sm:text-5xl md:text-7xl italic text-slate-900 dark:text-white leading-tight`}>
                    Mes Contrats
                </h1>
                <p className="text-xl text-slate-500 font-light max-w-2xl leading-relaxed">
                    Consultez et téléchargez vos documents contractuels en toute transparence.
                </p>
            </header>

            {loading ? (
                // Squelettes de chargement (placeholders animés)
                <div className="space-y-6">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-slate-100 dark:bg-zinc-800/50 rounded-[2.5rem] h-64 animate-pulse" />
                    ))}
                </div>
            ) : contracts.length === 0 ? (
                // État vide : aucun contrat disponible
                <div className="border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center p-20 text-slate-400 bg-slate-50/30 dark:bg-zinc-900/10 min-h-[400px]">
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-8">
                        <svg className="w-10 h-10 opacity-30 text-[#bca086]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="text-lg font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Aucun contrat actif</p>
                    <p className="text-sm mt-3 opacity-60 text-center max-w-sm">
                        Votre contrat apparaîtra ici une fois qu&apos;il aura été validé et joint par l&apos;administration lors de la confirmation de votre réservation.
                    </p>
                </div>
            ) : (
                // Liste des contrats avec compteur
                <div className="space-y-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {contracts.length} contrat{contracts.length > 1 ? "s" : ""}
                    </p>
                    {contracts.map((c, i) => (
                        <ContractCard key={c.id} contract={c} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
}
