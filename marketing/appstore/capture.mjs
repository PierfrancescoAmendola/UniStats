// Captures the raw app screens used by the App Store screenshots, for every language.
//
//   1. Boot the iPhone simulator, run the dev build and start Metro (npx expo start).
//   2. node marketing/appstore/capture.mjs [lang ...]
//
// The script talks to the running app through the Metro inspector (Chrome DevTools Protocol):
// it loads the demo transcript from demo.json in the right language, then opens each screen
// with a unistats:// deep link and saves a simulator screenshot to raw/<lang>/<shot>.png.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEVICE = process.env.SIM_UDID ?? 'booted';
const LANGS = ['it', 'en', 'es', 'fr', 'de', 'pt'];
const demo = JSON.parse(readFileSync(join(HERE, 'demo.json'), 'utf8'));

// [file name, deep link, theme]
const SHOTS = [
    ['home', 'home', 'light'],
    ['grad', 'tools/grad', 'light'],
    ['needed', 'tools/needed', 'light'],
    ['whatif', 'tools/whatif', 'light'],
    ['transcript', 'transcript', 'light'],
    ['exam', 'exam/s01', 'light'],
    ['how', 'tools/how', 'light'],
    ['university', 'university', 'light'],
    ['dark', 'home', 'dark'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const simctl = (...args) => execFileSync('xcrun', ['simctl', ...args], { stdio: 'pipe' });

async function inspector() {
    const pages = await (await fetch('http://localhost:8081/json/list')).json();
    const page = pages.find((p) => (p.description ?? '').includes('Bridgeless')) ?? pages[0];
    if (!page) throw new Error('No app connected to Metro');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((ok, ko) => ((ws.onopen = ok), (ws.onerror = ko)));
    let id = 0;
    const waiting = new Map();
    ws.onmessage = (m) => {
        const d = JSON.parse(m.data);
        if (waiting.has(d.id)) waiting.get(d.id)(d.result);
    };
    const evaluate = (expression) =>
        new Promise((ok) => {
            waiting.set(++id, ok);
            ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
        });
    return { evaluate, close: () => ws.close() };
}

// Walks the React tree from the DevTools hook; `body` runs with `fibers` (all fibers) and `ctx` (the AppStore value).
const inApp = (body) => `(function () {
    const hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    const fibers = [];
    hook.renderers.forEach((_, rid) => hook.getFiberRoots(rid).forEach((root) => {
        const walk = (f) => { for (let n = f; n; n = n.sibling) { fibers.push(n); if (n.child) walk(n.child); } };
        walk(root.current);
    }));
    const holder = fibers.find((f) => f.memoizedProps && f.memoizedProps.value && f.memoizedProps.value.state && f.memoizedProps.value.state.exams);
    const ctx = holder && holder.memoizedProps.value;
    ${body}
})()`;

// Hides the dev-only LogBox toast so it never ends up in a screenshot.
const DISMISS_LOGBOX = inApp(`fibers.forEach((f) => f.memoizedProps && typeof f.memoizedProps.onPressDismiss === 'function' && f.memoizedProps.onPressDismiss()); return 'ok';`);

const seed = (lang) => {
    const person = demo.people[lang];
    const exams = demo.exams.map((e) => ({ ...e, name: e.name[lang] }));
    return inApp(`
        ctx.reset();
        ctx.setProfile(${JSON.stringify({ ...demo.profile, ...person })});
        ctx.addExams(${JSON.stringify(exams)});
        ctx.setOnboarded(true);
        ctx.setLanguage(${JSON.stringify(lang)});
        ctx.setTheme('light');
        return 'seeded';`);
};

const app = await inspector();
for (const lang of process.argv.slice(2).length ? process.argv.slice(2) : LANGS) {
    const out = join(HERE, 'raw', lang);
    mkdirSync(out, { recursive: true });
    await app.evaluate(seed(lang));
    await sleep(800);
    let theme = 'light';
    for (const [name, link, wanted] of SHOTS) {
        if (wanted !== theme) {
            await app.evaluate(inApp(`ctx.setTheme(${JSON.stringify(wanted)}); return 'ok';`));
            theme = wanted;
            await sleep(900);
        }
        simctl('openurl', DEVICE, `unistats://${link}`);
        await sleep(1800);
        await app.evaluate(DISMISS_LOGBOX);
        await sleep(400);
        simctl('io', DEVICE, 'screenshot', '--type=png', join(out, `${name}.png`));
        console.log(lang, name);
    }
    await app.evaluate(inApp(`ctx.setTheme('light'); return 'ok';`));
    await sleep(600);
}
app.close();
