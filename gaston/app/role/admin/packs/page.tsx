"use client";

import { useEffect, useMemo, useState } from "react";
import { Playfair_Display } from "next/font/google";
import {
    DEFAULT_QUOTE_CONFIG,
    loadQuoteConfigFromStorage,
    QUOTE_CONFIG_STORAGE_KEY,
    type QuoteConfig,
} from "@/lib/quoteConfig";
import type { Pack } from "@/lib/packs";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

function formatPrice(value: number) {
    return `${value.toLocaleString("fr-FR", {
        minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
        maximumFractionDigits: 1,
    })} DT`;
}

function makeId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function NumberField({ label, value, onChange }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{label}</span>
            <input
                type="number"
                min="0"
                step="0.5"
                value={value}
                onChange={(event) => onChange(Number(event.target.value) || 0)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[#bca086] dark:border-white/10 dark:bg-zinc-800 dark:text-white"
            />
        </label>
    );
}

function TextField({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{label}</span>
            <input
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[#bca086] dark:border-white/10 dark:bg-zinc-800 dark:text-white"
            />
        </label>
    );
}

export default function AdminPacksPage() {
    const [config, setConfig] = useState<QuoteConfig>(loadQuoteConfigFromStorage);
    const categories = Object.keys(config.packsByCategory);
    const [activeCategory, setActiveCategory] = useState(categories[0] ?? "Mariage");
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const packs = useMemo(
        () => config.packsByCategory[activeCategory] ?? [],
        [activeCategory, config.packsByCategory],
    );
    const usedServices = useMemo(
        () => Array.from(new Set(packs.flatMap((pack) => pack.features))),
        [packs],
    );

    useEffect(() => {
        const storedConfig = window.localStorage.getItem(QUOTE_CONFIG_STORAGE_KEY);
        if (storedConfig) return;

        fetch("/api/admin/quote-config")
            .then((response) => response.json())
            .then((data) => {
                setConfig(data);
                setActiveCategory(Object.keys(data.packsByCategory)[0] ?? "Mariage");
                window.localStorage.setItem(QUOTE_CONFIG_STORAGE_KEY, JSON.stringify(data));
            })
            .catch(() => {});
    }, []);

    const saveConfig = async () => {
        setSaving(true);
        try {
            const response = await fetch("/api/admin/quote-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            const data = await response.json();
            if (data.success) {
                window.localStorage.setItem(QUOTE_CONFIG_STORAGE_KEY, JSON.stringify(data.config ?? config));
                setSaved(true);
                window.setTimeout(() => setSaved(false), 2500);
            }
        } finally {
            setSaving(false);
        }
    };

    const resetConfig = async () => {
        setSaving(true);
        try {
            const response = await fetch("/api/admin/quote-config", { method: "DELETE" });
            const data = await response.json();
            const nextConfig = data.config ?? DEFAULT_QUOTE_CONFIG;
            setConfig(nextConfig);
            setActiveCategory(Object.keys(nextConfig.packsByCategory)[0] ?? "Mariage");
            window.localStorage.setItem(QUOTE_CONFIG_STORAGE_KEY, JSON.stringify(nextConfig));
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2500);
        } finally {
            setSaving(false);
        }
    };

    const updatePack = (index: number, changes: Partial<Pack>) => {
        setConfig((current) => ({
            ...current,
            packsByCategory: {
                ...current.packsByCategory,
                [activeCategory]: current.packsByCategory[activeCategory].map((pack, packIndex) =>
                    packIndex === index
                        ? {
                            ...pack,
                            ...changes,
                            price: changes.priceValue !== undefined ? `${changes.priceValue} DT` : pack.price,
                        }
                        : pack,
                ),
            },
        }));
    };

    const addPack = () => {
        setConfig((current) => ({
            ...current,
            packsByCategory: {
                ...current.packsByCategory,
                [activeCategory]: [
                    ...current.packsByCategory[activeCategory],
                    { name: `Pack ${current.packsByCategory[activeCategory].length + 1}`, price: "0 DT", priceValue: 0, features: [] },
                ],
            },
        }));
    };

    const removePack = (index: number) => {
        setConfig((current) => ({
            ...current,
            packsByCategory: {
                ...current.packsByCategory,
                [activeCategory]: current.packsByCategory[activeCategory].filter((_, packIndex) => packIndex !== index),
            },
        }));
    };

    const togglePackService = (packIndex: number, serviceName: string) => {
        const pack = packs[packIndex];
        const nextFeatures = pack.features.includes(serviceName)
            ? pack.features.filter((feature) => feature !== serviceName)
            : [...pack.features, serviceName];

        updatePack(packIndex, { features: nextFeatures });
    };

    const updateService = (index: number, field: "name" | "price", value: string | number) => {
        const previousName = config.servicePrices[index].name;

        setConfig((current) => {
            const nextServices = current.servicePrices.map((service, serviceIndex) =>
                serviceIndex === index ? { ...service, [field]: value } : service,
            );

            const nextName = field === "name" ? String(value) : previousName;

            return {
                ...current,
                servicePrices: nextServices,
                packsByCategory: Object.fromEntries(
                    Object.entries(current.packsByCategory).map(([category, categoryPacks]) => [
                        category,
                        categoryPacks.map((pack) => ({
                            ...pack,
                            features: pack.features.map((feature) => feature === previousName ? nextName : feature),
                        })),
                    ]),
                ),
            };
        });
    };

    const addService = () => {
        setConfig((current) => ({
            ...current,
            servicePrices: [...current.servicePrices, { name: "Nouveau service", price: 0 }],
        }));
    };

    const removeService = (serviceName: string) => {
        setConfig((current) => ({
            ...current,
            servicePrices: current.servicePrices.filter((service) => service.name !== serviceName),
            packsByCategory: Object.fromEntries(
                Object.entries(current.packsByCategory).map(([category, categoryPacks]) => [
                    category,
                    categoryPacks.map((pack) => ({
                        ...pack,
                        features: pack.features.filter((feature) => feature !== serviceName),
                    })),
                ]),
            ),
        }));
    };

    const updateOption = (index: number, field: "label" | "price", value: string | number) => {
        setConfig((current) => ({
            ...current,
            options: current.options.map((option, optionIndex) =>
                optionIndex === index ? { ...option, [field]: value } : option,
            ),
        }));
    };

    const addOption = () => {
        setConfig((current) => ({
            ...current,
            options: [...current.options, { id: makeId("option"), label: "Nouvelle option", price: 0 }],
        }));
    };

    const removeOption = (id: string) => {
        setConfig((current) => ({
            ...current,
            options: current.options.filter((option) => option.id !== id),
        }));
    };

    const updatePrintTier = (index: number, field: "label" | "min" | "max" | "unitPrice", value: string | number | null) => {
        setConfig((current) => ({
            ...current,
            printTiers: current.printTiers.map((tier, tierIndex) =>
                tierIndex === index ? { ...tier, [field]: value } : tier,
            ),
        }));
    };

    const addPrintTier = () => {
        setConfig((current) => ({
            ...current,
            printTiers: [...current.printTiers, { id: makeId("tier"), label: "Nouveau palier", min: 1, max: null, unitPrice: 0 }],
        }));
    };

    const removePrintTier = (id: string) => {
        setConfig((current) => ({
            ...current,
            printTiers: current.printTiers.filter((tier) => tier.id !== id),
        }));
    };

    return (
        <main className="min-h-screen bg-slate-50 p-6 text-slate-950 dark:bg-zinc-950 dark:text-white md:p-10">
            {saved && (
                <div className="fixed right-8 top-24 z-[80] rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black text-white shadow-2xl">
                    Configuration sauvegardée.
                </div>
            )}

            <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#bca086]">Administration</p>
                    <h1 className={`${playfair.className} mt-3 text-5xl italic text-slate-950 dark:text-white md:text-7xl`}>
                        Packs & tarifs
                    </h1>
                    <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-500 dark:text-slate-400">
                        Modifiez les packs par type, les services à la carte, les tarifs de tirage photo et les options du devis en ligne.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={resetConfig}
                        disabled={saving}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 transition hover:border-red-300 hover:text-red-500 dark:border-white/10 dark:bg-zinc-900"
                    >
                        Réinitialiser
                    </button>
                    <button
                        type="button"
                        onClick={saveConfig}
                        disabled={saving}
                        className="rounded-2xl bg-[#bca086] px-6 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-white shadow-xl shadow-[#bca086]/20 transition hover:scale-[1.02] active:scale-95"
                    >
                        {saving ? "Sauvegarde..." : "Sauvegarder"}
                    </button>
                </div>
            </header>

            <section className="mb-8 overflow-x-auto rounded-[2rem] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-900">
                <div className="flex min-w-max gap-2">
                    {categories.map((category) => (
                        <button
                            key={category}
                            type="button"
                            onClick={() => setActiveCategory(category)}
                            className={`rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition ${activeCategory === category
                                ? "bg-[#bca086] text-white shadow-lg shadow-[#bca086]/20"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </section>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
                <section className="space-y-8">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black">Packs de {activeCategory}</h2>
                                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Nom du pack, prix réduit et services inclus.</p>
                            </div>
                            <button
                                type="button"
                                onClick={addPack}
                                className="rounded-2xl bg-slate-950 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#bca086] dark:bg-white dark:text-slate-950"
                            >
                                Ajouter pack
                            </button>
                        </div>

                        <div className="grid gap-5">
                            {packs.map((pack, index) => {
                                const detailTotal = pack.features.reduce((total, service) => {
                                    const servicePrice = config.servicePrices.find((item) => item.name === service)?.price ?? 0;
                                    return total + servicePrice;
                                }, 0);
                                const saving = Math.max(0, detailTotal - pack.priceValue);

                                return (
                                    <article key={`${pack.name}-${index}`} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-zinc-950">
                                        <div className="grid gap-4 md:grid-cols-[1fr_160px_auto] md:items-end">
                                            <TextField
                                                label="Nom du pack"
                                                value={pack.name}
                                                onChange={(value) => updatePack(index, { name: value })}
                                            />
                                            <NumberField
                                                label="Prix pack"
                                                value={pack.priceValue}
                                                onChange={(value) => updatePack(index, { priceValue: value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removePack(index)}
                                                className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-red-500 transition hover:bg-red-500 hover:text-white dark:border-red-500/30 dark:bg-zinc-900"
                                            >
                                                Supprimer
                                            </button>
                                        </div>

                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {config.servicePrices.map((service) => {
                                                const checked = pack.features.includes(service.name);

                                                return (
                                                    <button
                                                        key={service.name}
                                                        type="button"
                                                        onClick={() => togglePackService(index, service.name)}
                                                        className={`rounded-full border px-4 py-2 text-xs font-black transition ${checked
                                                            ? "border-[#bca086] bg-[#bca086] text-white"
                                                            : "border-slate-200 bg-white text-slate-500 hover:border-[#bca086] hover:text-[#bca086] dark:border-white/10 dark:bg-zinc-900"
                                                        }`}
                                                    >
                                                        {service.name}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-5 grid gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-600 dark:bg-zinc-900 dark:text-slate-300 sm:grid-cols-3">
                                            <span>Détail : {formatPrice(detailTotal)}</span>
                                            <span>Prix pack : {formatPrice(pack.priceValue)}</span>
                                            <span className={saving > 0 ? "text-emerald-600" : ""}>Réduction : {formatPrice(saving)}</span>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black">Services à la carte</h2>
                                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Modifier le nom ou le prix met à jour les packs qui utilisent ce service.</p>
                            </div>
                            <button type="button" onClick={addService} className="rounded-2xl bg-slate-950 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#bca086] dark:bg-white dark:text-slate-950">
                                Ajouter service
                            </button>
                        </div>

                        <div className="grid gap-4">
                            {config.servicePrices.map((service, index) => (
                                <div key={`${service.name}-${index}`} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-zinc-950 md:grid-cols-[1fr_150px_auto] md:items-end">
                                    <TextField label="Nom du service" value={service.name} onChange={(value) => updateService(index, "name", value)} />
                                    <NumberField label="Prix" value={service.price} onChange={(value) => updateService(index, "price", value)} />
                                    <button
                                        type="button"
                                        onClick={() => removeService(service.name)}
                                        className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-red-500 transition hover:bg-red-500 hover:text-white dark:border-red-500/30 dark:bg-zinc-900"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <aside className="space-y-8">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                        <h2 className="text-xl font-black">Tirage photo</h2>
                        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Paliers utilisés dans le devis selon le nombre de photos.</p>

                        <div className="mt-5 space-y-4">
                            {config.printTiers.map((tier, index) => (
                                <div key={tier.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-zinc-950">
                                    <div className="space-y-4">
                                        <TextField label="Libellé" value={tier.label} onChange={(value) => updatePrintTier(index, "label", value)} />
                                        <div className="grid grid-cols-2 gap-3">
                                            <NumberField label="Min" value={tier.min} onChange={(value) => updatePrintTier(index, "min", value)} />
                                            <NumberField label="Max" value={tier.max ?? 0} onChange={(value) => updatePrintTier(index, "max", value === 0 ? null : value)} />
                                        </div>
                                        <NumberField label="Prix/photo" value={tier.unitPrice} onChange={(value) => updatePrintTier(index, "unitPrice", value)} />
                                        <button type="button" onClick={() => removePrintTier(tier.id)} className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                                            Supprimer le palier
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={addPrintTier} className="mt-5 w-full rounded-2xl border border-dashed border-[#bca086] px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#bca086] transition hover:bg-[#bca086] hover:text-white">
                            Ajouter palier
                        </button>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                        <h2 className="text-xl font-black">Options</h2>
                        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Options supplémentaires visibles dans le devis.</p>

                        <div className="mt-5 space-y-4">
                            {config.options.map((option, index) => (
                                <div key={option.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-zinc-950">
                                    <div className="space-y-4">
                                        <TextField label="Nom option" value={option.label} onChange={(value) => updateOption(index, "label", value)} />
                                        <NumberField label="Prix" value={option.price} onChange={(value) => updateOption(index, "price", value)} />
                                        <button type="button" onClick={() => removeOption(option.id)} className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                                            Supprimer option
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={addOption} className="mt-5 w-full rounded-2xl border border-dashed border-[#bca086] px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#bca086] transition hover:bg-[#bca086] hover:text-white">
                            Ajouter option
                        </button>
                    </div>

                    <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300 dark:shadow-black/30">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#bca086]">Résumé</p>
                        <div className="mt-5 space-y-3 text-sm font-bold text-slate-300">
                            <p>{categories.length} types de travail</p>
                            <p>{packs.length} packs dans {activeCategory}</p>
                            <p>{config.servicePrices.length} services configurés</p>
                            <p>{usedServices.length} services utilisés ici</p>
                            <p>{config.options.length} options</p>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
}
