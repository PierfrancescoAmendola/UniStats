import { findUniversity } from '../data/universities';
import { Bonus, Rule } from '../engine/types';
import { formatNumber, Language, Params, TKey, translateLoose } from '../i18n';

type T = (key: TKey, params?: Params) => string;

/** "Sapienza · Economia", or the localized "Standard rules" for national defaults. */
export const ruleName = (rule: Rule, t: T): string => {
    if (rule.provenance.confidence === 'default') return t('ruleNational');
    const uni = findUniversity(rule.universityId);
    const scope = rule.scopeLabel === 'Ateneo' || rule.scopeLabel === 'default' ? '' : rule.scopeLabel;
    return [uni?.name, scope].filter(Boolean).join(' · ') || t('ruleNational');
};

/** Title of a bonus line in the UI. */
export const bonusTitle = (b: Bonus, lang: Language, t: T): string => {
    if (b.kind === 'flag') return translateLoose(lang, b.label);
    return t(`bonusKind_${b.kind}` as const);
};

/** Short description of how big a bonus is, e.g. "+1", "+0.4 each", "up to +5". */
export const bonusSize = (b: Bonus, lang: Language): string => {
    const n = (v: number) => formatNumber(lang, v, v % 1 ? 2 : 0).replace(/([.,]\d)0$/, '$1');
    switch (b.kind) {
        case 'flag':
            return `+${n(b.points)}`;
        case 'lodeCount':
            return b.everyN ? `+${n(b.perLode)} / ${b.everyN}×30L` : `+${n(b.perLode)} × 30L`;
        case 'lodeCfu':
            return `+${n(b.pointsPerCfu)} / CFU`;
        case 'lodeTiers':
        case 'averageBand':
            return `+${n(Math.max(...(b.kind === 'lodeTiers' ? b.tiers : b.bands).map((x) => x.points)))}`;
        case 'averageLinear':
            return `0–${n(b.maxPoints)}`;
        case 'onTime':
            return `+${n(Math.max(...b.tiers.map((x) => x.points)))}`;
        case 'onTimePercent':
            return `+${n(Math.max(...b.tiers.map((x) => x.pct * 100)))}%`;
        case 'mobility':
            return `+${n(Math.max(...b.tiers.map((x) => x.points)))}`;
        case 'careerTable':
            return `0–${n(Math.max(...b.rows.flatMap((r) => r.points)))}`;
    }
};

export const factorText = (rule: Rule, lang: Language) =>
    Math.abs(rule.conversion.factor - 110 / 30) < 1e-6 ? '110 ÷ 30' : formatNumber(lang, rule.conversion.factor, 2);
