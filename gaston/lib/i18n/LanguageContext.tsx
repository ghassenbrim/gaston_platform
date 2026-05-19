"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import translations, { Lang, TranslationKey } from "./translations";

interface LanguageContextType {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const defaultContext: LanguageContextType = {
  language: "fr",
  setLanguage: () => {},
  t: (key: TranslationKey) => key,
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Lang>("fr");
  const [mounted, setMounted] = useState(false);

  // Initialiser la langue depuis localStorage au montage du composant
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Lang | null;
    if (savedLanguage && ["fr", "en", "ar"].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
    setMounted(true);
  }, []);

  // Sauvegarder la langue dans localStorage quand elle change
  const setLanguage = (lang: Lang) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  };

  // Fonction de traduction
  const t = (key: TranslationKey): string => {
    return (translations[language][key] as string) || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage doit être utilisé dans un LanguageProvider");
  }
  return context;
}

// Alias pour une utilisation plus conventionnelle
export function useTranslation() {
  return useLanguage();
}
