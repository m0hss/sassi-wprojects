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
  // Initialize from build-time env default (NEXT_PUBLIC_DEFAULT_LOCALE) if provided,
  // otherwise fall back to Arabic. This ensures SSR uses the intended default.
  const initialLocale: Locale = "ar";
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale);

  // After the client mounts, pick up any stored locale or navigator preference.
  // Behavior change: if a build-time env default (NEXT_PUBLIC_DEFAULT_LOCALE) exists,
  // prefer it over browser/navigator language and previously stored locale so the
  // app always starts with the deploy/build default. The user's stored preference
  // is still respected for subsequent visits only when they explicitly set it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Prefer an explicit user choice stored in localStorage when available.
    // Keep NEXT_PUBLIC_DEFAULT_LOCALE as the SSR/build-time initial value only.
    const stored = (localStorage.getItem("locale") as Locale) || null;
    if (stored) {
      if (stored !== locale) setLocaleState(stored);
      return;
    }

    // If no stored preference, fall back to navigator language, then build default.
    /* const nav = navigator.language || "";
    const navLocale: Locale = nav.startsWith("ar") ? "ar" : "en";
 */
  /*   if (navLocale !== locale) {
      setLocaleState(navLocale);
      return;
    } */
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
      return messages[key] ?? (fallback || key);
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
