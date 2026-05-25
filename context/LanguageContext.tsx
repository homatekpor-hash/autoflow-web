"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, LANGUAGES, t as translate } from "@/lib/i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({ lang:"en", setLang:()=>{}, t:(k)=>k });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("af_lang") as Language;
    if (saved && LANGUAGES[saved]) setLangState(saved);
  }, []);

  function setLang(l: Language) {
    setLangState(l);
    localStorage.setItem("af_lang", l);
  }

  const t = (key: string) => translate(key, lang);

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
