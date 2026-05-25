"use client";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGES, Language } from "@/lib/i18n";
import { useState } from "react";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={()=>setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-ink-ghost px-2.5 py-1.5 text-xs font-medium text-ink-subtle hover:bg-ink-paper transition">
        <span>{LANGUAGES[lang].flag}</span>
        <span className="hidden sm:block">{LANGUAGES[lang].label}</span>
        <span className="text-ink-faint">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 rounded-xl border border-ink-ghost bg-white shadow-lg z-50 overflow-hidden min-w-32">
          {(Object.keys(LANGUAGES) as Language[]).map(l=>(
            <button key={l} onClick={()=>{setLang(l);setOpen(false);}}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-ink-paper transition text-left ${lang===l?"font-semibold text-orange-600":""}`}>
              <span>{LANGUAGES[l].flag}</span>
              <span>{LANGUAGES[l].label}</span>
              {lang===l && <span className="ml-auto text-orange-500">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
