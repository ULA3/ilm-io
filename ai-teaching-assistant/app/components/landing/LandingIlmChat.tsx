"use client";

import { StudentIlmChat } from "@/app/components/StudentIlmChat";
import { useIlmLanguage } from "@/lib/ilm-language";

/** Ilm on home page — chat works even before upload */
export function LandingIlmChat() {
  const { lang } = useIlmLanguage();
  return <StudentIlmChat fileId={null} pockets={null} mood="okay" lang={lang} landingMode />;
}
