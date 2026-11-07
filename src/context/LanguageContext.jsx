import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('ermi_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ermi_lang', lang);
    } catch {
      // ignore
    }
    document.documentElement.lang = lang === 'am' ? 'am' : 'en';
  }, [lang]);

  const toggle = () => setLang((prev) => (prev === 'en' ? 'am' : 'en'));

  const t = (key) => {
    const dict = translations[lang] || translations.en;
    return dict[key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}