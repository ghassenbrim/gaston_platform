"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function TranslationExample() {
  const { t, language } = useTranslation();

  return (
    <div className="p-6 space-y-6">
      {/* Language Switcher */}
      <div>
        <h2 className="text-xl font-bold mb-3">
          {language === "ar"
            ? "تبديل اللغة"
            : language === "en"
              ? "Language Switcher"
              : "Sélecteur de langue"}
        </h2>
        <LanguageSwitcher />
      </div>

      {/* Examples of translations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">{t("nav_photos")}</h3>
          <p className="text-sm text-blue-700">{t("nav_photos_desc")}</p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-bold text-green-900 mb-2">{t("nav_messaging")}</h3>
          <p className="text-sm text-green-700">{t("nav_messaging_desc")}</p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-bold text-purple-900 mb-2">{t("nav_settings")}</h3>
          <p className="text-sm text-purple-700">{t("nav_settings_desc")}</p>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg">
          <h3 className="font-bold text-orange-900 mb-2">{t("settings_title")}</h3>
          <p className="text-sm text-orange-700">{t("settings_personal")}</p>
        </div>
      </div>

      {/* Common actions */}
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold mb-3">{t("language")} Current: {language}</h3>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1 bg-blue-500 text-white rounded">{t("save")}</button>
          <button className="px-3 py-1 bg-gray-400 text-white rounded">{t("cancel")}</button>
          <button className="px-3 py-1 bg-red-500 text-white rounded">{t("delete")}</button>
          <button className="px-3 py-1 bg-green-500 text-white rounded">{t("confirm")}</button>
        </div>
      </div>
    </div>
  );
}
