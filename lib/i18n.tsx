import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

type Locale = "en" | "ar";

type Messages = Record<string, string>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

async function loadMessages(locale: Locale): Promise<Messages> {
  try {
    // dynamic import so Next.js can statically bundle locale files
    if (locale === "ar") {
      const mod = await import("../locales/ar.json");
      return mod.default || mod;
    }
    const mod = await import("../locales/en.json");
    return mod.default || mod;
  } catch (e) {
    console.error("Failed to load locale", locale, e);
    return {};
  }
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Always initialize to Arabic so server and the initial client render match.
  const [locale, setLocaleState] = useState<Locale>(() => "ar");

  // After the client mounts, pick up any stored locale or navigator preference.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = (localStorage.getItem("locale") as Locale) || null;
    if (stored && stored !== locale) {
      setLocaleState(stored);
      return;
    }
    const nav = navigator.language || "";
    const navLocale: Locale = nav.startsWith("en") ? "en" : "ar";
    if (navLocale !== locale) {
      setLocaleState(navLocale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  const [messages, setMessages] = useState<Messages>({});

  useEffect(() => {
    let mounted = true;
    loadMessages(locale).then((m) => {
      if (mounted) setMessages(m);
    });
    document.documentElement.lang = locale === "ar" ? "ar" : "en";
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    localStorage.setItem("locale", locale);
    return () => {
      mounted = false;
    };
  }, [locale]);

  // stable setter to avoid changing identity each render
  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  // memoize translation function so its identity only changes when messages change
  const t = useCallback(
    (key: string, fallback = "") => {
      return messages[key] ?? fallback ?? key;
    },
    [messages],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export type { Locale };
