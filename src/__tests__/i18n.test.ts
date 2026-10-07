import { DICTS, Language } from '../i18n';
import en from '../i18n/locales/en';
import { legalText } from '../i18n/legal';

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
const langs = Object.keys(DICTS) as Language[];

describe('translations', () => {
    it.each(langs)('%s has every key with the same placeholders as English', (lang) => {
        const dict = DICTS[lang];
        for (const key of Object.keys(en) as (keyof typeof en)[]) {
            expect(typeof dict[key]).toBe('string');
            expect([key, placeholders(dict[key])]).toEqual([key, placeholders(en[key])]);
        }
    });

    // Loanwords that are the same in English.
    const SHARED = new Set(['summerSchool']);

    it.each(langs)('%s is a real translation, not a copy of English', (lang) => {
        if (lang === 'en') return;
        const same = (Object.keys(en) as (keyof typeof en)[]).filter((k) => !SHARED.has(k) && DICTS[lang][k] === en[k] && en[k].length > 12);
        expect(same).toEqual([]);
    });

    it.each(langs)('%s has its own privacy policy and terms', (lang) => {
        const privacy = legalText(lang, 'privacy');
        const terms = legalText(lang, 'terms');
        expect(privacy.sections.length).toBeGreaterThan(3);
        expect(terms.sections.length).toBeGreaterThan(3);
        if (lang !== 'en') expect(privacy.intro).not.toBe(legalText('en', 'privacy').intro);
    });
});
