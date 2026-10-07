// Design tokens from the UniStats 2.0 canvas: flat saturated surfaces, big numbers, no heavy shadows.
//
// Two palettes share the same keys. `C` is a live object: applyScheme() swaps its values and the app
// remounts its navigation tree, so every inline `C.x` and every `themed()` stylesheet re-reads them.
// Roles: `fog` = screen background, `surface` = cards, `text` = primary text on neutral surfaces.
// `ink`, `white` and the saturated brand colours stay dark/light in both schemes (text on sun, coral...).

const LIGHT = {
    violet: '#5A3FFF',
    violetDeep: '#3E25D9',
    violetSoft: '#E6E1FF',
    violetGlow: '#7A63FF',
    violetMuted: '#8E7BFF',
    sun: '#FFC93C',
    sunDeep: '#F5B000',
    sunSoft: '#FFF1C7',
    coral: '#FF6B57',
    coralSoft: '#FFE1DC',
    mint: '#1FB57A',
    mintBright: '#3FD196',
    mintSoft: '#D3F5E5',
    mintPop: '#8EF0C4',
    ink: '#14141F',
    inkSoft: '#2A2A3A',
    inkLine: '#2E2E40',
    fog: '#F3F2F8',
    fogDeep: '#E4E2EE',
    track: '#E9E8F2',
    line: '#EEEDF4',
    white: '#FFFFFF',
    text2: '#45455A',
    text3: '#5C5C70',
    text4: '#B9B8CC',
    onDark2: '#DDDCEA',
    redText: '#B3261E',
    redDeep: '#5A0F08',
    redPop: '#FFB4A8',
    amberText: '#7A5200',
    amberDeep: '#4A3200',
    greenText: '#0B6B45',
    greenDeep: '#08291C',
    sky: '#8FD3FF',
    lilac: '#B9AEFF',
    surface: '#FFFFFF',
    text: '#14141F',
    progTrack: '#DDDBE8',
    /** Selected chip background (text on it stays white). */
    sel: '#14141F',
    segTrack: '#E4E2EE',
    segInd: '#FFFFFF',
};

export type Palette = typeof LIGHT;

const DARK: Palette = {
    ...LIGHT,
    violetDeep: '#C3B8FF',
    violetSoft: '#2A2357',
    sunSoft: '#3A3115',
    coralSoft: '#3E1D19',
    mintSoft: '#0F3324',
    ink: '#1A1A28',
    inkSoft: '#2E2E42',
    inkLine: '#383850',
    fog: '#0C0C13',
    fogDeep: '#232333',
    track: '#262636',
    line: '#232332',
    surface: '#1A1A26',
    text: '#F4F3FA',
    text2: '#C9C8D9',
    text3: '#9C9BB0',
    text4: '#7D7C92',
    redText: '#FF9C8E',
    amberText: '#FFD978',
    greenText: '#7BE8B8',
    progTrack: '#2C2C3E',
    sel: '#5A3FFF',
    segTrack: '#13131C',
    segInd: '#2C2C40',
};

export type Scheme = 'light' | 'dark';

export const C: Palette = { ...LIGHT };
/** Fixed light palette for brand screens (intro, ready, milestone) that look the same in both schemes. */
export const L: Readonly<Palette> = Object.freeze({ ...LIGHT });
export const PALETTES: Record<Scheme, Palette> = { light: LIGHT, dark: DARK };

let version = 0;
let current: Scheme = 'light';
export const currentScheme = () => current;

export const applyScheme = (s: Scheme) => {
    if (s === current && version > 0) return;
    current = s;
    Object.assign(C, PALETTES[s]);
    version++;
};

/** A lazily rebuilt object (usually a StyleSheet) that follows the active palette. */
export function themed<T extends object>(build: () => T): T {
    let cache: T | null = null;
    let at = -1;
    const get = () => {
        if (at !== version || !cache) {
            cache = build();
            at = version;
        }
        return cache;
    };
    return new Proxy({} as T, {
        get: (_, k) => (get() as Record<string | symbol, unknown>)[k],
        has: (_, k) => k in get(),
        ownKeys: () => Reflect.ownKeys(get()),
        getOwnPropertyDescriptor: (_, k) => Object.getOwnPropertyDescriptor(get(), k),
    });
}


export const F = {
    display: 'BricolageGrotesque_800ExtraBold',
    displaySemi: 'BricolageGrotesque_600SemiBold',
    body: 'Figtree_400Regular',
    medium: 'Figtree_500Medium',
    semi: 'Figtree_600SemiBold',
    bold: 'Figtree_700Bold',
};

export const R = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, sheet: 32 };

export type GradeTier = 'low' | 'mid' | 'good' | 'top' | 'lode' | 'passFail';

export const tierOf = (grade: number | null, lode: boolean): GradeTier => {
    if (grade === null) return 'passFail';
    if (lode && grade === 30) return 'lode';
    if (grade >= 29) return 'top';
    if (grade >= 26) return 'good';
    if (grade >= 22) return 'mid';
    return 'low';
};

export const TIER_COLORS: Record<GradeTier, { bg: string; fg: string }> = themed(() => ({
    low: { bg: C.coralSoft, fg: C.redText },
    mid: { bg: C.sunSoft, fg: C.amberText },
    good: { bg: C.violetSoft, fg: C.violetDeep },
    top: { bg: C.mintSoft, fg: C.greenText },
    lode: { bg: '#14141F', fg: C.sun },
    passFail: { bg: C.track, fg: C.text2 },
}));

/** Logo colours for university monograms, cycled by index for variety. */
export const MONO_COLORS = ['#FF6B57', '#FFC93C', '#1FB57A', '#B9AEFF', '#8FD3FF'];
