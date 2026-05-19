# 📌 Système de Traduction (i18n)

## Vue d'ensemble
Ton application supporte maintenant **3 langues** : 🇫🇷 Français, 🇬🇧 Anglais, 🇸🇦 Arabe

## 🎯 Utilisation

### 1. **Dans les composants Client**

```tsx
"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";

export function MonComposant() {
  const { t, language } = useTranslation();

  return (
    <div>
      <h1>{t("nav_photos")}</h1>
      <p>{t("nav_photos_desc")}</p>
      <p>Langue actuelle: {language}</p>
    </div>
  );
}
```

### 2. **Ajouter le Sélecteur de Langue**

```tsx
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function MonApp() {
  return (
    <div>
      <LanguageSwitcher />
      {/* ou version compacte: */}
      {/* <LanguageSwitcherCompact /> */}
    </div>
  );
}
```

### 3. **Ajouter une nouvelle Traduction**

Édite le fichier `lib/i18n/translations.ts` et ajoute ta clé pour les 3 langues:

```typescript
// Dans la section fr:
ma_nouvelle_cle: "Mon texte en français",

// Dans la section en:
ma_nouvelle_cle: "My text in English",

// Dans la section ar:
ma_nouvelle_cle: "نصي العربي",
```

## 🧩 Composants disponibles

### `LanguageSwitcher`
Boutons colorés avec drapeaux (une par langue)
```tsx
<LanguageSwitcher />
```

### `LanguageSwitcherCompact`
Menu déroulant (plus compact)
```tsx
<LanguageSwitcherCompact />
```

## 📂 Structure des fichiers

```
lib/
  i18n/
    translations.ts          ← Les 366 traductions
    LanguageContext.tsx      ← Logic du changement de langue
components/
  LanguageSwitcher.tsx       ← Boutons/sélecteur
  TranslationExample.tsx     ← Exemple d'utilisation
```

## ✨ Fonctionnalités

- ✅ **Persistance**: La langue est sauvegardée dans localStorage
- ✅ **RTL Support**: L'arabe change automatiquement en mode RTL
- ✅ **TypeScript Safe**: Les clés de traduction sont typées
- ✅ **Pas de rechargement**: Changement instantané de langue

## 🔄 Exemple complet

Voir `TranslationExample.tsx` pour un exemple fonctionnel avec toutes les traductions disponibles.
