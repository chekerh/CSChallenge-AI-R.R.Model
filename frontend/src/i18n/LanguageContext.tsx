import { createContext, useContext, useEffect, useState } from 'react';
import { Language, translate, detectLanguage } from './translations';

interface LanguageContextValue {
  lang: Language;
  t: (key: string) => string;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'fr',
  t: (key) => key,
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => detectLanguage());

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const t = (key: string) => translate(lang, key);

  return (
    <LanguageContext.Provider value={{ lang, t, setLang: setLangState }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang(): LanguageContextValue {
  return useContext(LanguageContext);
}
