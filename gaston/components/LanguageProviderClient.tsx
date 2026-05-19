"use client";

import React, { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export function LanguageProviderClient({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
