"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Lang } from "@/lib/i18n/translations";

const languages: { code: Lang; name: string; flag: string }[] = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm">
      <div className="flex gap-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
              language === lang.code
                ? "bg-[#bca086] text-white shadow-lg shadow-[#bca086]/30"
                : "bg-white dark:bg-zinc-800 text-slate-400 border border-slate-100 dark:border-white/5 hover:border-[#bca086]/50 hover:text-[#bca086]"
            }`}
            aria-label={`Switch to ${lang.name}`}
          >
            <span className="text-sm">{lang.flag}</span>
            <span>{lang.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function LanguageSwitcherCompact() {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as Lang)}
      className="px-4 py-2 border border-slate-100 dark:border-white/5 rounded-xl bg-white dark:bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:border-[#bca086]/50 hover:text-[#bca086] focus:outline-none focus:ring-2 focus:ring-[#bca086]/20 focus:border-[#bca086] transition-all duration-200"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.code.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
