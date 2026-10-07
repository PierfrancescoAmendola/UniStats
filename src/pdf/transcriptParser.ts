// Turns transcript lines (from the PDF extractor or pasted text) into exams.
// A line is an exam when it has a date and a result; CFU are the number that follows the
// result. Lines without a date right after an exam continue its name (long names wrap).

export interface ParsedExam {
    key: string;
    name: string;
    date: string;
    grade: number | null;
    lode: boolean;
    cfu: number;
    /** True when the CFU could not be read and must be checked. */
    uncertain: boolean;
}

const DATE = /\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})\b|\b(\d{4})-(\d{2})-(\d{2})\b/;
const PASS = /^(idoneo|idonea|idoneità|idoneita|ido|id|approvato|approvata|appr|superato|superata|pass|passed|ok)$/i;
const SMALL = new Set(['di', 'e', 'ed', 'del', 'della', 'dello', 'delle', 'dei', 'degli', 'a', 'al', 'alla', 'alle', 'ai', 'agli', 'per', 'in', 'con', 'su', 'da', 'dal', 'nel', 'nella', 'tra', 'the', 'of', 'and', 'for', 'to']);
const ROMAN = /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i;
const HEADER = /^(insegnamento|esame|corso|data|voto|cfu|ateneo|ssd|pagina|matricola|totale|media|anno|esito)\b/i;

/** "BASI DI DATI I" → "Basi di Dati I"; mixed-case names stay as they are. */
export const prettyName = (s: string): string => {
    const clean = s.replace(/\s+/g, ' ').trim();
    if (clean !== clean.toUpperCase()) return clean;
    return clean
        .toLowerCase()
        .split(' ')
        .map((w, i) => {
            if (ROMAN.test(w)) return w.toUpperCase();
            if (i > 0 && SMALL.has(w)) return w;
            return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(' ')
        .replace(/\b(\w)'(\w)/g, (_, a, b) => `${a}'${b.toUpperCase()}`);
};

const isoOf = (m: RegExpExecArray): string => {
    if (m[4]) return `${m[4]}-${m[5]}-${m[6]}`;
    return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
};

type Result = { grade: number | null; lode: boolean; len: number };

/** Reads a result at the start of `tokens`: "28", "30L", "30 e lode", "30/30", "Idoneo". */
const readResult = (tokens: string[]): Result | null => {
    const [a, b, c] = tokens;
    if (!a) return null;
    if (PASS.test(a)) return { grade: null, lode: false, len: 1 };
    const m = /^(1[89]|2\d|30)(?:\/30)?(l|lode|\+)?$/i.exec(a);
    if (!m) return null;
    const g = Number(m[1]);
    if (m[2]) return { grade: g, lode: g === 30, len: 1 };
    if (g === 30 && b && /^(e|con|cum)$/i.test(b) && c && /^(lode|laude)$/i.test(c)) return { grade: 30, lode: true, len: 3 };
    if (g === 30 && b && /^(l|lode)$/i.test(b)) return { grade: 30, lode: true, len: 2 };
    return { grade: g, lode: false, len: 1 };
};

const isCfu = (t: string | undefined) => !!t && /^\d{1,2}([.,]\d)?$/.test(t) && Number(t.replace(',', '.')) > 0 && Number(t.replace(',', '.')) <= 30;

const parseLine = (line: string): Omit<ParsedExam, 'key'> | null => {
    const dm = DATE.exec(line);
    if (!dm) return null;
    const before = line.slice(0, dm.index).trim();
    const after = line.slice(dm.index + dm[0].length).trim().split(/\s+/).filter(Boolean);

    let res = readResult(after);
    let cfu: number | null = null;
    let nameSrc = before;
    if (res) {
        const next = after[res.len];
        if (isCfu(next)) cfu = Number(next.replace(',', '.'));
    } else {
        // Result and CFU may come before the date: "... 9 28 12/02/2025".
        const toks = before.split(/\s+/);
        for (let k = toks.length - 1; k >= Math.max(1, toks.length - 4); k--) {
            const r = readResult(toks.slice(k));
            if (r) {
                res = r;
                if (isCfu(toks[k - 1])) {
                    cfu = Number(toks[k - 1].replace(',', '.'));
                    nameSrc = toks.slice(0, k - 1).join(' ');
                } else nameSrc = toks.slice(0, k).join(' ');
                break;
            }
        }
    }
    if (!res) return null;
    // Leading exam code ("U2356", "00105", "IN0-3") is not part of the name.
    const words = nameSrc.split(/\s+/).filter(Boolean);
    if (words.length > 1 && /\d/.test(words[0]) && words[0].length <= 8) words.shift();
    const name = words.join(' ');
    if (!name || HEADER.test(name)) return null;
    return { name, date: isoOf(dm), grade: res.grade, lode: res.lode, cfu: cfu ?? 0, uncertain: cfu === null };
};

export const parseTranscript = (lines: string[]): ParsedExam[] => {
    const out: ParsedExam[] = [];
    let last: ParsedExam | null = null;
    for (const raw of lines) {
        const line = raw.replace(/\s+/g, ' ').trim();
        if (!line) continue;
        const p = parseLine(line);
        if (p) {
            last = { ...p, key: `${p.name}|${p.date}|${out.length}` };
            out.push(last);
            continue;
        }
        // A short upper-case line right after an exam is the rest of its name.
        if (last && line.length <= 40 && line === line.toUpperCase() && /^[A-Z][A-Z0-9 '’.,()\-/]+$/.test(line) && !HEADER.test(line)) {
            last.name = `${last.name} ${line}`;
        } else {
            last = null;
        }
    }
    // The same exam can appear twice (plan + results): keep the dated result once.
    const seen = new Set<string>();
    out.forEach((e) => (e.name = prettyName(e.name)));
    return out.filter((e) => {
        const k = `${e.name.toLowerCase()}|${e.date}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
};

/** Course year of an exam from its date and the enrolment year (academic years start in September). */
export const yearFromDate = (iso: string, cohort: number, maxYear: number): number => {
    const d = new Date(`${iso}T12:00:00`);
    const academicStart = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
    return Math.max(1, Math.min(maxYear, academicStart - cohort + 1));
};
