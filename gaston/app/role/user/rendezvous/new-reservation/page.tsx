"use client";

import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { useEffect, useMemo, useState } from "react";
import {
    getPrintUnitPrice,
    loadQuoteConfigFromStorage,
    servicePriceMap,
} from "@/lib/quoteConfig";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic", "normal"] });

const durationOptions = [
    {
        label: "Midi / après-midi",
        description: "Séance en lumière du jour",
        multiplier: 1,
        icon: "sun",
    },
    {
        label: "Soirée",
        description: "Ambiance nocturne",
        multiplier: 1,
        icon: "moon",
    },
    {
        label: "Les deux",
        description: "Jour et soirée",
        multiplier: 1.55,
        icon: "both",
    },
];

function formatPrice(value: number) {
    return `${value.toLocaleString("fr-FR", {
        minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
        maximumFractionDigits: 1,
    })} DT`;
}

function haveSameServices(first: string[], second: string[]) {
    if (first.length !== second.length) return false;
    const selected = new Set(second);
    return first.every((service) => selected.has(service));
}

function getDateAdjustment(dateValue: string) {
    if (!dateValue) return { label: "Date non sélectionnée", amount: 0 };
    const date = new Date(`${dateValue}T12:00:00`);
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;
    return isWeekend
        ? { label: "Majoration week-end", amount: 90 }
        : { label: "Jour de semaine", amount: 0 };
}

function formatDateValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function TimeSlotIcon({ type }: { type: string }) {
    if (type === "moon") {
        return (
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M21 12.8A8.4 8.4 0 1111.2 3 6.8 6.8 0 0021 12.8z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M16.5 4.5h.01M19 7h.01" />
            </svg>
        );
    }

    if (type === "both") {
        return (
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M8 12a4 4 0 118 0" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M3 17h18M5 21h14M4 12h1.5M18.5 12H20M7.2 7.2 6 6M16.8 7.2 18 6M12 5V3" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M20.5 4.8A4.8 4.8 0 0115.2 10 3.9 3.9 0 0020.5 4.8z" />
            </svg>
        );
    }

    return (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M4 18h16M6 15h12" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M8 13a4 4 0 118 0" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M12 3v2M4.9 6.9l1.4 1.4M19.1 6.9l-1.4 1.4M3 13h2M19 13h2" />
        </svg>
    );
}

export default function ReservationPage() {
    const [quoteConfig, setQuoteConfig] = useState(loadQuoteConfigFromStorage);
    const workTypes = Object.keys(quoteConfig.packsByCategory);
    const initialWorkType = workTypes[0] ?? "Mariage";

    const [workType, setWorkType] = useState(initialWorkType);
    const [selectedServices, setSelectedServices] = useState<string[]>(
        quoteConfig.packsByCategory[initialWorkType]?.[0]?.features ?? [],
    );
    const [selectedDate, setSelectedDate] = useState("");
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [duration, setDuration] = useState(durationOptions[0].label);
    const [eventLocation, setEventLocation] = useState("");
    const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
    const [photoPrintEnabled, setPhotoPrintEnabled] = useState(false);
    const [photoPrintCount, setPhotoPrintCount] = useState(50);
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetch("/api/quote-config")
            .then((response) => response.json())
            .then((data) => {
                setQuoteConfig(data);
                const nextWorkType = Object.keys(data.packsByCategory)[0] ?? "Mariage";
                setWorkType(nextWorkType);
                setSelectedServices(data.packsByCategory[nextWorkType]?.[0]?.features ?? []);
                setSelectedExtras((current) => current.filter((id) => data.options.some((option: { id: string }) => option.id === id)));
                window.localStorage.setItem("gaston_quote_config_v1", JSON.stringify(data));
            })
            .catch(() => {});
    }, []);

    const servicePrices = useMemo(() => servicePriceMap(quoteConfig.servicePrices), [quoteConfig.servicePrices]);
    const packs = useMemo(() => quoteConfig.packsByCategory[workType] ?? [], [quoteConfig.packsByCategory, workType]);
    const availableServices = useMemo(
        () => Array.from(new Set(packs.flatMap((pack) => pack.features))),
        [packs],
    );
    const selectedPack = useMemo(
        () => packs.find((pack) => haveSameServices(pack.features, selectedServices)),
        [packs, selectedServices],
    );
    const selectedDuration = durationOptions.find((option) => option.label === duration) ?? durationOptions[0];
    const dateAdjustment = getDateAdjustment(selectedDate);

    const selectedOptionLabels = quoteConfig.options
        .filter((option) => selectedExtras.includes(option.id))
        .map((option) => option.label);
    const extrasTotal = quoteConfig.options
        .filter((option) => selectedExtras.includes(option.id))
        .reduce((total, option) => total + option.price, 0);
    const servicesTotal = selectedServices.reduce(
        (total, service) => total + (servicePrices[service] ?? 0),
        0,
    );
    const packageSavings = selectedPack ? Math.max(0, servicesTotal - selectedPack.priceValue) : 0;
    const baseBeforeDuration = selectedPack ? selectedPack.priceValue : servicesTotal;
    const basePrice = baseBeforeDuration * selectedDuration.multiplier;
    const photoPrintUnitPrice = getPrintUnitPrice(photoPrintCount, quoteConfig.printTiers);
    const photoPrintTotal = photoPrintEnabled ? photoPrintCount * photoPrintUnitPrice : 0;
    const estimatedTotal = basePrice + dateAdjustment.amount + extrasTotal + photoPrintTotal;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const calendarYear = calendarMonth.getFullYear();
    const calendarMonthIndex = calendarMonth.getMonth();
    const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
    const firstDay = new Date(calendarYear, calendarMonthIndex, 1).getDay();
    const leadingBlanks = firstDay === 0 ? 6 : firstDay - 1;
    const calendarDays = Array.from({ length: daysInMonth }, (_, index) => index + 1);
    const calendarBlanks = Array.from({ length: leadingBlanks }, (_, index) => index);
    const canGoPreviousMonth = calendarMonth.getTime() > currentMonthStart.getTime();
    const selectedDateLabel = selectedDate
        ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : "Aucune date sélectionnée";

    const toggleExtra = (id: string) => {
        setSelectedExtras((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
    };

    const handleWorkTypeChange = (type: string) => {
        setWorkType(type);
        setSelectedServices(quoteConfig.packsByCategory[type]?.[0]?.features ?? []);
    };

    const handlePackSelect = (features: string[]) => {
        setSelectedServices(features);
    };

    const toggleService = (service: string) => {
        setSelectedServices((current) =>
            current.includes(service)
                ? current.filter((item) => item !== service)
                : [...current, service],
        );
    };

    const goToPreviousMonth = () => {
        if (!canGoPreviousMonth) return;
        setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
    };

    const handleSubmit = async () => {
        if (!selectedDate) {
            alert("Veuillez choisir une date.");
            return;
        }
        if (!eventLocation.trim()) {
            alert("Veuillez préciser le lieu de l'événement.");
            return;
        }
        if (selectedServices.length === 0) {
            alert("Veuillez choisir au moins un service ou un pack.");
            return;
        }

        setIsSubmitting(true);
        try {
            const message = [
                `Formule: ${selectedPack?.name ?? "Services à la carte"}`,
                `Durée: ${duration}`,
                `Services: ${selectedServices.join(", ")}`,
                selectedOptionLabels.length > 0 ? `Options: ${selectedOptionLabels.join(", ")}` : "Options: Non",
                `Tirage: ${photoPrintEnabled ? `${photoPrintCount} photos (${formatPrice(photoPrintTotal)})` : "Non"}`,
                `Estimation: ${formatPrice(estimatedTotal)}`,
                notes ? `Notes: ${notes}` : "",
            ].filter(Boolean).join(" | ");

            const response = await fetch("/api/user/rendezvous", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    service: workType,
                    date: new Date(`${selectedDate}T12:00:00`).toISOString(),
                    time: duration,
                    location: eventLocation,
                    latitude: null,
                    longitude: null,
                    message,
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || "Impossible d'envoyer la demande.");
            }

            alert("Demande envoyée ! L'admin va confirmer, annuler ou laisser en attente.");
            window.location.href = "/role/user/rendezvous";
        } catch (error) {
            alert(error instanceof Error ? error.message : "Une erreur est survenue.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-stone-50 text-slate-950">
            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-8 sm:px-8 lg:px-12">
                    <nav className="flex items-center justify-between gap-4">
                        <Link
                            href="/role/user/rendezvous"
                            className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 transition hover:border-[#bca086] hover:text-[#bca086]"
                        >
                            <span aria-hidden="true">←</span>
                            Mes rendez-vous
                        </Link>
                        <span className="text-[10px] font-black uppercase tracking-[0.32em] text-[#bca086]">
                            Nouvelle réservation
                        </span>
                    </nav>

                    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
                        <div className="space-y-5">
                            <h1 className={`${playfair.className} max-w-3xl text-5xl italic leading-tight text-slate-950 sm:text-7xl`}>
                                Planifiez votre séance
                            </h1>
                            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                                Choisissez le type de travail, la date, le pack et les options. Votre demande sera envoyée à l&apos;administration pour validation.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 rounded-[2rem] border border-slate-200 bg-slate-50 p-3">
                            {["Type", "Date", "Pack"].map((item, index) => (
                                <div key={item} className="rounded-2xl bg-white p-4 text-center shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Étape {index + 1}</p>
                                    <p className="mt-2 text-sm font-black text-slate-800">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-12">
                <div className="flex flex-col gap-8">
                    <div className="order-1 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                        <h2 className={`${playfair.className} text-3xl italic text-slate-950`}>Type de travail</h2>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            {workTypes.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => handleWorkTypeChange(type)}
                                    className={`rounded-2xl border px-4 py-4 text-sm font-black transition ${workType === type
                                        ? "border-[#bca086] bg-[#bca086] text-white shadow-lg shadow-[#bca086]/20"
                                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#bca086] hover:bg-white"
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="order-3 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <h2 className={`${playfair.className} text-3xl italic text-slate-950`}>Choix du pack</h2>
                            <p className="text-sm font-semibold text-slate-500">{packs.length} formules disponibles</p>
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-3">
                            {packs.map((pack) => {
                                const isSelected = selectedPack?.name === pack.name;
                                const detailTotal = pack.features.reduce(
                                    (total, service) => total + (servicePrices[service] ?? 0),
                                    0,
                                );
                                const saving = Math.max(0, detailTotal - pack.priceValue);

                                return (
                                    <button
                                        key={pack.name}
                                        type="button"
                                        onClick={() => handlePackSelect(pack.features)}
                                        className={`flex min-h-[260px] flex-col rounded-[2rem] border p-5 text-left transition ${isSelected
                                            ? "border-[#bca086] bg-[#bca086]/10 shadow-xl shadow-[#bca086]/10"
                                            : "border-slate-200 bg-slate-50 hover:border-[#bca086] hover:bg-white"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#bca086]">{pack.name}</p>
                                                <p className={`${playfair.className} mt-3 text-4xl italic text-slate-950`}>{pack.price}</p>
                                                {saving > 0 && (
                                                    <p className="mt-2 text-xs font-bold text-emerald-600">
                                                        Réduction pack : -{formatPrice(saving)}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`grid h-8 w-8 place-items-center rounded-full border-2 ${isSelected ? "border-[#bca086] bg-[#bca086] text-white" : "border-slate-300 text-transparent"}`}>
                                                ✓
                                            </span>
                                        </div>

                                        <div className="mt-6 space-y-3">
                                            {pack.features.map((feature) => (
                                                <p key={feature} className="flex gap-3 text-sm font-medium leading-6 text-slate-600">
                                                    <span className="mt-1 text-[#bca086]">✓</span>
                                                    {feature}
                                                </p>
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-5 sm:p-6">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#bca086]">Services à la carte</p>
                                    <h3 className="mt-2 text-lg font-black text-slate-900">Cochez les services souhaités</h3>
                                </div>
                                <p className="text-sm font-bold text-slate-500">
                                    Total détail : {formatPrice(servicesTotal)}
                                </p>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                                {availableServices.map((service) => {
                                    const checked = selectedServices.includes(service);

                                    return (
                                        <button
                                            key={service}
                                            type="button"
                                            onClick={() => toggleService(service)}
                                            className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${checked
                                                ? "border-[#bca086] bg-white shadow-sm"
                                                : "border-slate-200 bg-white/60 hover:border-[#bca086] hover:bg-white"
                                            }`}
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 text-xs font-black ${checked ? "border-[#bca086] bg-[#bca086] text-white" : "border-slate-300 text-transparent"}`}>
                                                    ✓
                                                </span>
                                                <span className="text-sm font-bold leading-6 text-slate-800">{service}</span>
                                            </span>
                                            <span className="shrink-0 text-sm font-black text-[#bca086]">
                                                {formatPrice(servicePrices[service] ?? 0)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-5 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600">
                                {selectedPack ? (
                                    <p>
                                        Votre sélection correspond à <span className="font-black text-slate-950">{selectedPack.name}</span> : le prix réduit du pack est appliqué automatiquement.
                                    </p>
                                ) : (
                                    <p>
                                        Sélection personnalisée : la réservation utilise la somme des services à la carte.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-8">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#bca086]">Options</p>
                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                {quoteConfig.options.map((option) => {
                                    const checked = selectedExtras.includes(option.id);

                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => toggleExtra(option.id)}
                                            className={`rounded-2xl border p-4 text-left transition ${checked
                                                ? "border-[#bca086] bg-[#bca086]/10"
                                                : "border-slate-200 bg-slate-50 hover:border-[#bca086] hover:bg-white"
                                            }`}
                                        >
                                            <span className="block text-sm font-black text-slate-900">{option.label}</span>
                                            <span className="mt-2 block text-sm font-bold text-[#bca086]">+ {formatPrice(option.price)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={`mt-8 rounded-[2rem] border p-5 transition ${photoPrintEnabled ? "border-[#bca086] bg-[#bca086]/10" : "border-slate-200 bg-slate-50"}`}>
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <button
                                    type="button"
                                    onClick={() => setPhotoPrintEnabled((current) => !current)}
                                    className="flex items-start gap-4 text-left"
                                >
                                    <span className={`mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md border-2 text-xs font-black ${photoPrintEnabled ? "border-[#bca086] bg-[#bca086] text-white" : "border-slate-300 text-transparent"}`}>
                                        ✓
                                    </span>
                                    <span>
                                        <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-[#bca086]">Tirage photo</span>
                                        <span className="mt-2 block text-lg font-black text-slate-900">Ajouter des photos imprimées</span>
                                        <span className="mt-1 block text-sm font-semibold leading-6 text-slate-500">
                                            {quoteConfig.printTiers.map((tier) => `${tier.label} : ${formatPrice(tier.unitPrice)}/photo`).join(" · ")}
                                        </span>
                                    </span>
                                </button>

                                <div className="rounded-2xl bg-white px-5 py-4 text-right shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Total tirage</p>
                                    <p className={`${playfair.className} mt-1 text-3xl italic text-slate-950`}>
                                        {formatPrice(photoPrintTotal)}
                                    </p>
                                </div>
                            </div>

                            <div className={`mt-6 grid gap-5 transition ${photoPrintEnabled ? "opacity-100" : "pointer-events-none opacity-45"} md:grid-cols-[1fr_180px] md:items-end`}>
                                <label className="space-y-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#bca086]">Nombre de photos</span>
                                    <input
                                        type="range"
                                        min="1"
                                        max="200"
                                        step="1"
                                        value={photoPrintCount}
                                        onChange={(event) => setPhotoPrintCount(Number(event.target.value))}
                                        className="w-full accent-[#bca086]"
                                    />
                                    <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                                        <span>1</span>
                                        <span className="rounded-full bg-white px-4 py-2 text-slate-900 shadow-sm">{photoPrintCount} photos</span>
                                        <span>200</span>
                                    </div>
                                </label>

                                <label className="space-y-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#bca086]">Saisie directe</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={photoPrintCount}
                                        onChange={(event) => setPhotoPrintCount(Math.max(1, Number(event.target.value) || 1))}
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-900 outline-none transition focus:border-[#bca086]"
                                    />
                                </label>
                            </div>

                            <div className={`mt-5 rounded-2xl bg-white p-4 text-center text-sm font-semibold text-slate-600 ${photoPrintEnabled ? "block" : "hidden"}`}>
                                Prix appliqué : <span className="font-black text-slate-950">{formatPrice(photoPrintUnitPrice)}</span> par photo,
                                soit <span className="font-black text-slate-950">{formatPrice(photoPrintTotal)}</span> pour {photoPrintCount} photos.
                            </div>
                        </div>
                    </div>

                    <div className="order-2 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                        <h2 className={`${playfair.className} text-3xl italic text-slate-950`}>Date et détails</h2>
                        <div className="mt-6 space-y-6">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#bca086]">Durée</span>
                                <div className="mt-4 grid gap-3 md:grid-cols-3">
                                    {durationOptions.map((option) => {
                                        const isSelected = duration === option.label;

                                        return (
                                            <button
                                                key={option.label}
                                                type="button"
                                                onClick={() => setDuration(option.label)}
                                                className={`flex min-h-[128px] flex-col items-start justify-between rounded-2xl border p-5 text-left transition ${isSelected
                                                    ? "border-[#bca086] bg-[#bca086]/10 shadow-lg shadow-[#bca086]/10"
                                                    : "border-slate-200 bg-slate-50 hover:border-[#bca086] hover:bg-white"
                                                }`}
                                            >
                                                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${isSelected ? "bg-[#bca086] text-white" : "bg-white text-[#bca086]"}`}>
                                                    <TimeSlotIcon type={option.icon} />
                                                </span>
                                                <span>
                                                    <span className="block text-sm font-black text-slate-950">{option.label}</span>
                                                    <span className="mt-1 block text-xs font-semibold text-slate-500">{option.description}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mx-auto max-w-xl space-y-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#bca086]">Date souhaitée</span>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                                        <button
                                            type="button"
                                            onClick={goToPreviousMonth}
                                            disabled={!canGoPreviousMonth}
                                            className={`grid h-9 w-9 place-items-center rounded-xl border text-base font-black transition ${canGoPreviousMonth
                                                ? "border-slate-200 bg-white text-slate-600 hover:border-[#bca086] hover:text-[#bca086]"
                                                : "border-slate-100 bg-white/50 text-slate-300"
                                            }`}
                                            aria-label="Mois précédent"
                                        >
                                            ‹
                                        </button>

                                        <div className="text-center">
                                            <p className={`${playfair.className} text-xl italic capitalize text-slate-950`}>
                                                {calendarMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                                            </p>
                                            <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                                                {selectedDateLabel}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={goToNextMonth}
                                            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-base font-black text-slate-600 transition hover:border-[#bca086] hover:text-[#bca086]"
                                            aria-label="Mois suivant"
                                        >
                                            ›
                                        </button>
                                    </div>

                                    <div className="mt-3 grid grid-cols-7 gap-1.5 text-center">
                                        {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((day) => (
                                            <div key={day} className="py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                                        {calendarBlanks.map((blank) => (
                                            <div key={`blank-${blank}`} className="aspect-square" />
                                        ))}
                                        {calendarDays.map((day) => {
                                            const date = new Date(calendarYear, calendarMonthIndex, day);
                                            const value = formatDateValue(date);
                                            const isPast = date.getTime() < today.getTime();
                                            const isSelected = selectedDate === value;
                                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    disabled={isPast}
                                                    onClick={() => setSelectedDate(value)}
                                                    className={`aspect-square rounded-xl text-xs font-black transition ${isSelected
                                                        ? "bg-[#bca086] text-white shadow-lg shadow-[#bca086]/20"
                                                        : isPast
                                                            ? "cursor-not-allowed bg-transparent text-slate-300"
                                                            : isWeekend
                                                                ? "bg-white text-[#bca086] hover:bg-[#bca086]/10"
                                                                : "bg-white text-slate-700 hover:bg-slate-950 hover:text-white"
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <label className="mx-auto block max-w-xl space-y-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#bca086]">Lieu de l&apos;événement</span>
                                <input
                                    type="text"
                                    value={eventLocation}
                                    onChange={(event) => setEventLocation(event.target.value)}
                                    placeholder="Ex : Tunis, La Marsa, salle des fêtes..."
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#bca086] focus:bg-white"
                                />
                            </label>

                            <label className="mx-auto block max-w-xl space-y-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#bca086]">Notes</span>
                                <textarea
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                    placeholder="Demandes spéciales, détails importants..."
                                    className="min-h-[120px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#bca086] focus:bg-white"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <aside className="h-fit rounded-[2rem] border border-slate-900 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300 lg:sticky lg:top-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#bca086]">Votre réservation</p>
                    <h2 className={`${playfair.className} mt-4 text-5xl italic`}>{formatPrice(estimatedTotal)}</h2>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                        Montant indicatif joint à votre demande. L&apos;administration confirmera les détails avant validation finale.
                    </p>

                    <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-slate-300">{workType} · {selectedPack?.name ?? "À la carte"}</span>
                            <strong>{formatPrice(basePrice)}</strong>
                        </div>
                        {selectedPack && packageSavings > 0 && (
                            <div className="flex items-center justify-between gap-4 text-sm text-emerald-300">
                                <span>Réduction pack appliquée</span>
                                <strong>-{formatPrice(packageSavings * selectedDuration.multiplier)}</strong>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-slate-300">{dateAdjustment.label}</span>
                            <strong>{formatPrice(dateAdjustment.amount)}</strong>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-slate-300">Options</span>
                            <strong>{formatPrice(extrasTotal)}</strong>
                        </div>
                        {photoPrintEnabled && (
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-slate-300">Tirage photo ({photoPrintCount} x {formatPrice(photoPrintUnitPrice)})</span>
                                <strong>{formatPrice(photoPrintTotal)}</strong>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 rounded-2xl bg-white/10 p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#bca086]">Récapitulatif</p>
                        <div className="mt-4 space-y-2 text-sm text-slate-200">
                            <p>Type : <strong>{workType}</strong></p>
                            <p>Formule : <strong>{selectedPack?.name ?? "Services à la carte"}</strong></p>
                            <p>Services : <strong>{selectedServices.length}</strong></p>
                            <p>Tirage : <strong>{photoPrintEnabled ? `${photoPrintCount} photos` : "Non"}</strong></p>
                            <p>Date : <strong>{selectedDate || "À choisir"}</strong></p>
                            <p>Durée : <strong>{duration}</strong></p>
                            <p>Lieu : <strong>{eventLocation || "À préciser"}</strong></p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedDate || !eventLocation.trim() || selectedServices.length === 0}
                        className="mt-6 flex w-full items-center justify-center rounded-full bg-[#bca086] px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? "Envoi..." : "Confirmer la réservation"}
                    </button>
                </aside>
            </section>
        </main>
    );
}
