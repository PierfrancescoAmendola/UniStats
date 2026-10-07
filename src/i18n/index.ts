import { getLocales } from 'expo-localization';
import en, { Dict, TKey } from './locales/en';
import it from './locales/it';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import pt from './locales/pt';

export type Language = 'en' | 'it' | 'es' | 'fr' | 'de' | 'pt';
export type { TKey };

export const DICTS: Record<Language, Dict> = { en, it, es, fr, de, pt };

export const LANGUAGES: { code: Language; name: string }[] = [
    { code: 'it', name: 'Italiano' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' },
];

export type Params = Record<string, string | number>;

export const translate = (lang: Language, key: TKey, params?: Params): string => {
    let s: string = DICTS[lang]?.[key] ?? en[key] ?? key;
    if (params) {
        for (const k of Object.keys(params)) s = s.split(`{${k}}`).join(String(params[k]));
    }
    return s;
};

/** Translates a dynamic key (bonus labels, sessions) and falls back to the raw text for custom labels. */
export const translateLoose = (lang: Language, key: string, params?: Params): string =>
    key in en ? translate(lang, key as TKey, params) : key;

const deviceLocale = () => {
    try {
        return getLocales()[0];
    } catch {
        return undefined;
    }
};

export const detectLanguage = (): Language => {
    const code = deviceLocale()?.languageCode as Language | undefined;
    return code && code in DICTS ? code : 'en';
};

export const localeTag = (lang: Language): string => {
    const loc = deviceLocale();
    if (loc?.languageTag && loc.languageCode === lang) return loc.languageTag;
    return lang;
};

/** Decimal separator of the language, used by animated numbers that format on the UI thread. */
export const decimalSeparator = (lang: Language): string => {
    try {
        return new Intl.NumberFormat(localeTag(lang)).format(1.5).replace(/\d/g, '') || '.';
    } catch {
        return lang === 'en' ? '.' : ',';
    }
};

export const formatNumber = (lang: Language, n: number, decimals: number): string => {
    try {
        return new Intl.NumberFormat(localeTag(lang), { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
    } catch {
        return n.toFixed(decimals);
    }
};

export const formatSigned = (lang: Language, n: number, decimals: number): string =>
    `${n >= 0 ? '+' : '−'}${formatNumber(lang, Math.abs(n), decimals)}`;

export const formatDate = (lang: Language, iso: string, style: 'short' | 'medium' | 'long' = 'medium'): string => {
    const d = new Date(`${iso}T12:00:00`);
    const opts: Intl.DateTimeFormatOptions =
        style === 'short' ? { day: 'numeric', month: 'short' } : style === 'long' ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' };
    try {
        return new Intl.DateTimeFormat(localeTag(lang), opts).format(d);
    } catch {
        return iso;
    }
};
