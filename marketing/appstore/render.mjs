// Renders the App Store assets with one headless Chrome driven over the DevTools protocol.
//
//   node marketing/appstore/render.mjs [screens|creative] [lang ...]
//
// screens  -> iphone-6.9/<lang>/01.png ... 08.png (1320 x 2868) from raw/<lang>/*.png (see capture.mjs)
// creative -> creative/<lang>/header-3840x1646.png and search-3840x2560.png
//             (iOS 27 product page header and App Store search results assets)
//
// Pages set document.title = 'ready' once fonts and images are in place. flatten.py stitches the
// captured bands and saves RGB PNGs, because App Store Connect rejects images with an alpha channel.
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LANGS = ['it', 'en', 'es', 'fr', 'de', 'pt'];
const SHOTS = ['home', 'grad', 'needed', 'whatif', 'transcript', 'exam', 'how', 'dark'];
// 3840 px wide at most: headless Chrome stalls on the 5244 x 2950 universal canvas.
const CREATIVE = { header: [3840, 1646], search: [3840, 2560] };
const PORT = 9333;

const args = process.argv.slice(2);
const kind = ['screens', 'creative'].includes(args[0]) ? args.shift() : null;
const langs = args.length ? args : LANGS;

const jobs = [];
for (const lang of langs) {
    if (kind !== 'creative')
        SHOTS.forEach((shot, i) => jobs.push({ page: 'screenshot.html', query: { lang, shot }, size: [1320, 2868], out: join(HERE, 'iphone-6.9', lang, `${String(i + 1).padStart(2, '0')}.png`) }));
    if (kind !== 'screens')
        for (const [fmt, size] of Object.entries(CREATIVE)) jobs.push({ page: 'creative.html', query: { lang, fmt }, size, out: join(HERE, 'creative', lang, `${fmt}-${size[0]}x${size[1]}.png`) });
}

// Own throwaway profile: never touches a Chrome window the user has open.
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'unistats-chrome-'))}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 50 && !target; i++) {
    try {
        target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page');
    } catch {
        await sleep(200);
    }
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((ok) => (ws.onopen = ok));
let seq = 0;
const pending = new Map();
ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (pending.has(d.id)) pending.get(d.id)(d);
};
const send = (method, params = {}) => new Promise((ok) => (pending.set(++seq, ok), ws.send(JSON.stringify({ id: seq, method, params }))));
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value;

try {
    for (const job of jobs) {
        const [width, height] = job.size;
        // Software rendering stalls above ~7 MP: big canvases are shot in horizontal bands and stitched.
        const bands = Math.ceil((width * height) / 7e6);
        const band = Math.ceil(height / bands);
        await send('Emulation.setDeviceMetricsOverride', { width, height: band, deviceScaleFactor: 1, mobile: false });
        const url = `${pathToFileURL(join(HERE, job.page))}?${new URLSearchParams(job.query)}`;
        await send('Page.navigate', { url });
        for (let i = 0; i < 100 && (await evaluate('document.title')) !== 'ready'; i++) await sleep(100);
        await sleep(150);
        const parts = [];
        for (let b = 0; b < bands; b++) {
            await evaluate(`document.body.style.transform = 'translateY(-${b * band}px)'`);
            await sleep(100);
            const shot = await send('Page.captureScreenshot', { format: 'png' });
            const part = `${job.out}.part${b}.png`;
            mkdirSync(dirname(job.out), { recursive: true });
            writeFileSync(part, Buffer.from(shot.result.data, 'base64'));
            parts.push(part);
        }
        execFileSync('python3', [join(HERE, 'flatten.py'), '--stitch', job.out, String(width), String(height), ...parts], { stdio: 'inherit' });
        console.log(job.out.replace(HERE + '/', ''));
    }
} finally {
    ws.close();
    chrome.kill();
}
