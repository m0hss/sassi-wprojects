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
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Default to Arabic on the server to ensure SSR uses Arabic by default.
    if (typeof window === "undefined") return "ar";
    // On the client prefer an explicit user setting stored in localStorage.
    const stored = (localStorage.getItem("locale") as Locale) || null;
    if (stored) return stored;
    // If navigator explicitly indicates English, allow that; otherwise default to Arabic.
    const nav = navigator.language || "";
    if (nav.startsWith("en")) return "en";
    return "ar";
  });

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
