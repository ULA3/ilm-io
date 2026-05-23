"use client";

import { useEffect } from "react";
import { IlmLanguageProvider } from "@/lib/ilm-language";
import { ACC_UPDATED_EVENT, applyAccSettings, getAccSettings } from "@/lib/accessibility";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyAccSettings(getAccSettings());
    const onUpdate = () => applyAccSettings(getAccSettings());
    window.addEventListener(ACC_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(ACC_UPDATED_EVENT, onUpdate);
  }, []);

  return <IlmLanguageProvider>{children}</IlmLanguageProvider>;
}
