import { inflate } from 'pako';

// A small PDF text extractor in plain JS, so transcripts never leave the phone.
// It covers what university portals produce (Esse3, Infostud, JasperReports/iText):
// Flate-compressed content streams, simple WinAnsi fonts and ToUnicode CMaps.
// It returns the page text as lines, grouping text runs by their baseline.

interface PdfObject {
    dict: string;
    stream?: Uint8Array;
}

const latin1 = (b: Uint8Array, from = 0, to = b.length) => {
    let s = '';
    for (let i = from; i < to; i += 8192) s += String.fromCharCode(...b.subarray(i, Math.min(to, i + 8192)));
    return s;
};

const WIN_ANSI_EXTRA: Record<number, string> = {
    0x80: '€', 0x82: '‚', 0x84: '„', 0x85: '…', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x96: '–', 0x97: '—',
};

const decodeStream = (dict: string, raw: Uint8Array): Uint8Array | undefined => {
    if (!/\/Filter\s*\[?\s*\/FlateDecode/.test(dict)) return /\/Filter/.test(dict) ? undefined : raw;
    try {
        return inflate(raw);
    } catch {
        return undefined;
    }
};

const readObjects = (bytes: Uint8Array): Map<number, PdfObject> => {
    const text = latin1(bytes);
    const objs = new Map<number, PdfObject>();
    const re = /(\d+)\s+\d+\s+obj\b/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
        const id = Number(m[1]);
        const start = m.index + m[0].length;
        const end = text.indexOf('endobj', start);
        if (end < 0) break;
        const body = text.slice(start, end);
        const sIdx = body.search(/stream\r?\n/);
        if (sIdx >= 0) {
            const dict = body.slice(0, sIdx);
            const dataStart = start + sIdx + body.slice(sIdx).match(/^stream\r?\n/)![0].length;
            const len = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict);
            let dataEnd = len ? dataStart + Number(len[1]) : text.indexOf('endstream', dataStart);
            if (dataEnd > end || dataEnd < dataStart) dataEnd = text.indexOf('endstream', dataStart);
            objs.set(id, { dict, stream: decodeStream(dict, bytes.subarray(dataStart, dataEnd)) });
        } else {
            objs.set(id, { dict: body });
        }
        re.lastIndex = end;
    }
    return objs;
};

/** Parses a ToUnicode CMap into code → text. */
const parseCMap = (src: string): { map: Map<number, string>; bytes: number } => {
    const map = new Map<number, string>();
    let bytes = 1;
    const hexToStr = (h: string) => {
        let s = '';
        for (let i = 0; i + 4 <= h.length; i += 4) s += String.fromCharCode(parseInt(h.slice(i, i + 4), 16));
        if (h.length === 2) s = String.fromCharCode(parseInt(h, 16));
        return s;
    };
    const range = /begincodespacerange([\s\S]*?)endcodespacerange/.exec(src);
    if (range) {
        const first = /<([0-9a-fA-F]+)>/.exec(range[1]);
        if (first) bytes = first[1].length / 2;
    }
    for (const block of src.match(/beginbfchar([\s\S]*?)endbfchar/g) ?? []) {
        for (const p of block.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) map.set(parseInt(p[1], 16), hexToStr(p[2]));
    }
    for (const block of src.match(/beginbfrange([\s\S]*?)endbfrange/g) ?? []) {
        for (const p of block.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<([0-9a-fA-F]+)>|\[([^\]]*)\])/g)) {
            const lo = parseInt(p[1], 16);
            const hi = parseInt(p[2], 16);
            if (p[4]) {
                const base = parseInt(p[4], 16);
                for (let c = lo; c <= hi && c - lo < 4096; c++) map.set(c, String.fromCharCode(base + (c - lo)));
            } else if (p[5]) {
                const list = [...p[5].matchAll(/<([0-9a-fA-F]+)>/g)].map((x) => hexToStr(x[1]));
                list.forEach((s, i) => map.set(lo + i, s));
            }
        }
    }
    return { map, bytes };
};

interface Font {
    cmap?: { map: Map<number, string>; bytes: number };
}

const ref = (dict: string, key: string) => {
    const m = new RegExp(`/${key}\\s+(\\d+)\\s+\\d+\\s+R`).exec(dict);
    return m ? Number(m[1]) : undefined;
};

/** Font resources of a page: resource name → decoder. */
const pageFonts = (pageDict: string, objs: Map<number, PdfObject>): Map<string, Font> => {
    const fonts = new Map<string, Font>();
    let res = pageDict;
    const resRef = ref(pageDict, 'Resources');
    if (resRef !== undefined) res = objs.get(resRef)?.dict ?? '';
    let fontDict = /\/Font\s*<<([\s\S]*?)>>/.exec(res)?.[1];
    const fontRef = ref(res, 'Font');
    if (!fontDict && fontRef !== undefined) fontDict = objs.get(fontRef)?.dict;
    if (!fontDict) return fonts;
    for (const m of fontDict.matchAll(/\/([^\s/<>\[\]()]+)\s+(\d+)\s+\d+\s+R/g)) {
        const fd = objs.get(Number(m[2]))?.dict ?? '';
        const tu = ref(fd, 'ToUnicode');
        const cm = tu !== undefined ? objs.get(tu)?.stream : undefined;
        fonts.set(m[1], { cmap: cm ? parseCMap(latin1(cm)) : undefined });
    }
    return fonts;
};

const decodeString = (raw: number[], font: Font | undefined): string => {
    if (font?.cmap && font.cmap.map.size) {
        const n = font.cmap.bytes;
        let s = '';
        for (let i = 0; i + n <= raw.length; i += n) {
            let code = 0;
            for (let k = 0; k < n; k++) code = (code << 8) | raw[i + k];
            s += font.cmap.map.get(code) ?? '';
        }
        return s;
    }
    return raw.map((c) => WIN_ANSI_EXTRA[c] ?? String.fromCharCode(c)).join('');
};

interface Run {
    x: number;
    y: number;
    text: string;
}

/** Walks a content stream and collects positioned text runs. */
const runsOf = (content: string, fonts: Map<string, Font>): Run[] => {
    const runs: Run[] = [];
    const stack: (number | string | number[][])[] = [];
    let font: Font | undefined;
    let tm = [1, 0, 0, 1, 0, 0];
    let lm = [1, 0, 0, 1, 0, 0];
    let leading = 0;
    let i = 0;
    const n = content.length;
    const emit = (raw: number[]) => {
        const text = decodeString(raw, font);
        if (text.trim()) runs.push({ x: tm[4], y: tm[5], text });
    };
    const moveTo = (tx: number, ty: number) => {
        lm = [lm[0], lm[1], lm[2], lm[3], lm[4] + tx * lm[0] + ty * lm[2], lm[5] + tx * lm[1] + ty * lm[3]];
        tm = [...lm];
    };
    const readLiteral = (): number[] => {
        const out: number[] = [];
        let depth = 1;
        i++;
        while (i < n && depth > 0) {
            const c = content[i];
            if (c === '\\') {
                const nx = content[i + 1];
                const esc: Record<string, number> = { n: 10, r: 13, t: 9, b: 8, f: 12 };
                if (nx in esc) {
                    out.push(esc[nx]);
                    i += 2;
                } else if (/[0-7]/.test(nx)) {
                    const oct = /^[0-7]{1,3}/.exec(content.slice(i + 1, i + 4))![0];
                    out.push(parseInt(oct, 8) & 255);
                    i += 1 + oct.length;
                } else if (nx === '\r' || nx === '\n') {
                    i += content[i + 2] === '\n' && nx === '\r' ? 3 : 2;
                } else {
                    out.push(nx.charCodeAt(0));
                    i += 2;
                }
                continue;
            }
            if (c === '(') depth++;
            if (c === ')') depth--;
            if (depth > 0) out.push(c.charCodeAt(0));
            i++;
        }
        return out;
    };
    const readHex = (): number[] => {
        const end = content.indexOf('>', i);
        const h = content.slice(i + 1, end).replace(/\s/g, '');
        i = end + 1;
        const out: number[] = [];
        for (let k = 0; k < h.length; k += 2) out.push(parseInt(h.slice(k, k + 2).padEnd(2, '0'), 16));
        return out;
    };

    while (i < n) {
        const c = content[i];
        if (/\s/.test(c)) {
            i++;
        } else if (c === '%') {
            while (i < n && content[i] !== '\n' && content[i] !== '\r') i++;
        } else if (c === '(') {
            stack.push([readLiteral()]);
        } else if (c === '<' && content[i + 1] === '<') {
            // Inline dictionary (marked content properties): skip it.
            let depth = 0;
            while (i < n) {
                if (content.startsWith('<<', i)) {
                    depth++;
                    i += 2;
                } else if (content.startsWith('>>', i)) {
                    depth--;
                    i += 2;
                    if (depth === 0) break;
                } else i++;
            }
        } else if (c === '<') {
            stack.push([readHex()]);
        } else if (c === '[') {
            // TJ array: strings and kerning numbers. Big negative kerning means a visible gap.
            i++;
            const parts: number[][] = [];
            while (i < n && content[i] !== ']') {
                const d = content[i];
                if (d === '(') parts.push(readLiteral());
                else if (d === '<') parts.push(readHex());
                else if (/[-+.\d]/.test(d)) {
                    const num = /^[-+]?[\d.]+/.exec(content.slice(i, i + 20))![0];
                    if (Number(num) < -250) parts.push([32]);
                    i += num.length;
                } else i++;
            }
            i++;
            stack.push(parts);
        } else if (c === '/') {
            const name = /^\/[^\s/<>\[\]()]+/.exec(content.slice(i, i + 128))![0];
            stack.push(name.slice(1));
            i += name.length;
        } else if (/[-+.\d]/.test(c)) {
            const num = /^[-+]?(\d+\.?\d*|\.\d+)/.exec(content.slice(i, i + 24));
            if (!num) {
                i++;
                continue;
            }
            stack.push(Number(num[0]));
            i += num[0].length;
        } else {
            const op = /^[A-Za-z'"*]+/.exec(content.slice(i, i + 4))?.[0] ?? c;
            i += op.length;
            const nums = () => stack.filter((x): x is number => typeof x === 'number');
            switch (op) {
                case 'BT':
                    tm = [1, 0, 0, 1, 0, 0];
                    lm = [1, 0, 0, 1, 0, 0];
                    break;
                case 'Tf': {
                    const name = stack.find((x): x is string => typeof x === 'string');
                    font = name ? fonts.get(name) : undefined;
                    break;
                }
                case 'TL':
                    leading = nums().pop() ?? leading;
                    break;
                case 'Tm': {
                    const v = nums().slice(-6);
                    if (v.length === 6) {
                        tm = v;
                        lm = [...v];
                    }
                    break;
                }
                case 'Td': {
                    const v = nums().slice(-2);
                    if (v.length === 2) moveTo(v[0], v[1]);
                    break;
                }
                case 'TD': {
                    const v = nums().slice(-2);
                    if (v.length === 2) {
                        leading = -v[1];
                        moveTo(v[0], v[1]);
                    }
                    break;
                }
                case 'T*':
                    moveTo(0, -leading);
                    break;
                case 'Tj': {
                    const s = stack[stack.length - 1];
                    if (Array.isArray(s)) emit(s[0]);
                    break;
                }
                case "'":
                case '"': {
                    moveTo(0, -leading);
                    const s = stack[stack.length - 1];
                    if (Array.isArray(s)) emit(s[0]);
                    break;
                }
                case 'TJ': {
                    const s = stack[stack.length - 1];
                    if (Array.isArray(s)) emit(s.flat());
                    break;
                }
                default:
                    break;
            }
            stack.length = 0;
        }
    }
    return runs;
};

/** Groups runs that share a baseline into lines, top to bottom, left to right. */
const toLines = (runs: Run[]): string[] => {
    const rows: { y: number; runs: Run[] }[] = [];
    for (const r of runs) {
        const row = rows.find((x) => Math.abs(x.y - r.y) < 2.5);
        if (row) row.runs.push(r);
        else rows.push({ y: r.y, runs: [r] });
    }
    rows.sort((a, b) => b.y - a.y);
    return rows.map((row) =>
        row.runs
            .sort((a, b) => a.x - b.x)
            .map((r) => r.text.trim())
            .join('   ')
            .trim(),
    );
};

/** Extracts the text of every page as lines. */
export const extractPdfLines = (bytes: Uint8Array): string[] => {
    const objs = readObjects(bytes);
    const lines: string[] = [];
    const pages = [...objs.entries()].filter(([, o]) => /\/Type\s*\/Page\b(?!s)/.test(o.dict)).sort((a, b) => a[0] - b[0]);
    for (const [, page] of pages) {
        const fonts = pageFonts(page.dict, objs);
        const contents: number[] = [];
        const arr = /\/Contents\s*\[([^\]]*)\]/.exec(page.dict);
        if (arr) for (const m of arr[1].matchAll(/(\d+)\s+\d+\s+R/g)) contents.push(Number(m[1]));
        else {
            const one = ref(page.dict, 'Contents');
            if (one !== undefined) contents.push(one);
        }
        const content = contents.map((id) => objs.get(id)?.stream).filter((s): s is Uint8Array => !!s).map((s) => latin1(s)).join('\n');
        lines.push(...toLines(runsOf(content, fonts)));
    }
    return lines;
};

export const base64ToBytes = (b64: string): Uint8Array => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lookup = new Uint8Array(256);
    for (let k = 0; k < alphabet.length; k++) lookup[alphabet.charCodeAt(k)] = k;
    const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
    const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
    let o = 0;
    for (let k = 0; k < clean.length; k += 4) {
        const a = lookup[clean.charCodeAt(k)];
        const b = lookup[clean.charCodeAt(k + 1)];
        const c = lookup[clean.charCodeAt(k + 2)];
        const d = lookup[clean.charCodeAt(k + 3)];
        out[o++] = (a << 2) | (b >> 4);
        if (k + 2 < clean.length) out[o++] = ((b & 15) << 4) | (c >> 2);
        if (k + 3 < clean.length) out[o++] = ((c & 3) << 6) | d;
    }
    return out.subarray(0, o);
};
