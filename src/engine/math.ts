import { RoundingMode } from './types';

// Values near a threshold (110.5, 111.0) must not flip because of binary floating point,
// so everything is snapped to 1e-9 before comparing or rounding.
export const snap = (x: number) => Math.round(x * 1e9) / 1e9;

export const roundWith = (x: number, mode: RoundingMode): number => {
    const v = snap(x);
    switch (mode) {
        case 'halfUp':
            return Math.floor(v + 0.5);
        case 'halfDown':
            return Math.ceil(v - 0.5);
        case 'truncate':
            return Math.floor(v);
        default:
            return v;
    }
};

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
