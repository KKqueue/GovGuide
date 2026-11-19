import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { translate } from "../i18n/translations";

const LanguageContext = createContext(null);

function getInitialLang() {
  try {
    const saved = localStorage.getItem("govguide-lang");
    if (saved === "hi" || saved === "en") return saved;
  } catch {}
  return "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    try {
      localStorage.setItem("govguide-lang", newLang);
    } catch {}
    document.documentElement.lang = newLang === "hi" ? "hi" : "en";
  }, []);

  const t = useCallback((key) => translate(lang, key), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: "en",
      setLang: () => {},
      t: (key) => translate("en", key),
    };
  }
  return ctx;
}
