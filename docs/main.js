// UniStats website: the app's motion language (staggered enter, springs, counting numbers) on the web.
(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fmt = (x, d = 2) => {
        const s = Math.abs(x).toFixed(d).replace('.', ',');
        const [i, f] = s.split(',');
        const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return (x < 0 ? '−' : '') + (f ? `${int},${f}` : int);
    };

    // Demo transcript, the same one used by the app's design mockups (weighted 27,36 over 66 CFU).
    const EXAMS = [
        { name: 'Fondamenti di Informatica', grade: 30, cfu: 12, lode: true },
        { name: 'Analisi Matematica I', grade: 27, cfu: 9 },
        { name: 'Fisica I', grade: 24, cfu: 9 },
        { name: 'Programmazione a Oggetti', grade: 30, cfu: 9 },
        { name: 'Basi di Dati', grade: 29, cfu: 9 },
        { name: 'Geometria e Algebra', grade: 28, cfu: 6 },
        { name: 'Architettura dei Calcolatori', grade: 26, cfu: 6 },
        { name: 'Analisi Matematica II', grade: 22, cfu: 6 },
    ];
    const SUM = EXAMS.reduce((s, e) => s + e.grade * e.cfu, 0);
    const CFU = EXAMS.reduce((s, e) => s + e.cfu, 0);
    const AVG = SUM / CFU;
    const ARITH = EXAMS.reduce((s, e) => s + e.grade, 0) / EXAMS.length;
    const tier = (g, l) => (l && g === 30 ? 't-lode' : g >= 29 ? 't-top' : g >= 26 ? 't-good' : g >= 22 ? 't-mid' : 't-low');

    // Count a number toward its value (AnimatedNumber).
    const count = (el, to, dec, ms = 900) => {
        if (reduced) { el.textContent = fmt(to, dec); return; }
        const from = parseFloat(el.dataset.from || '0');
        const t0 = performance.now();
        const step = (t) => {
            const p = Math.min(1, (t - t0) / ms);
            const e = 1 - Math.pow(1 - p, 3);
            el.textContent = fmt(from + (to - from) * e, dec);
            if (p < 1) requestAnimationFrame(step);
            else el.dataset.from = String(to);
        };
        requestAnimationFrame(step);
    };

    // Launch overlay: remove from the tree once it has played.
    const launch = document.getElementById('launch');
    const seen = (() => { try { return sessionStorage.getItem('us-launch') === '1'; } catch { return false; } })();
    if (reduced || seen) launch.remove();
    else {
        try { sessionStorage.setItem('us-launch', '1'); } catch { /* storage blocked */ }
        setTimeout(() => launch.remove(), 2100);
    }
    const startDelay = reduced || seen ? 0 : 1750;

    // Reveal on scroll + counters.
    const io = new IntersectionObserver((entries) => {
        for (const en of entries) {
            if (!en.isIntersecting) continue;
            const el = en.target;
            el.classList.add('in');
            el.querySelectorAll?.('[data-count]').forEach((c) => count(c, parseFloat(c.dataset.count), +c.dataset.dec));
            if (el.dataset.count) count(el, parseFloat(el.dataset.count), +el.dataset.dec);
            io.unobserve(el);
        }
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    setTimeout(() => {
        // Above-the-fold copy enters straight away; everything else waits for the viewport.
        document.querySelectorAll('.hero .rv').forEach((el) => el.classList.add('in'));
        document.querySelectorAll('.rv:not(.in)').forEach((el) => io.observe(el));
    }, startDelay);

    // Hero phone: numbers count up and the CFU bar grows after the launch.
    setTimeout(() => {
        document.querySelectorAll('#heroPhone [data-count]').forEach((c) => count(c, parseFloat(c.dataset.count), +c.dataset.dec, 1100));
        document.querySelectorAll('#heroPhone [data-w]').forEach((b) => { b.style.width = b.dataset.w; });
    }, startDelay + 200);

    // Nav hides on scroll down, shows on scroll up.
    const nav = document.getElementById('nav');
    let lastY = scrollY;
    addEventListener('scroll', () => {
        const y = scrollY;
        nav.classList.toggle('hide', y > lastY && y > 300);
        lastY = y;
    }, { passive: true });

    // Final mark replays the launch choreography when it scrolls into view.
    const mark = document.getElementById('finalMark');
    new IntersectionObserver(([en], o) => {
        if (en.isIntersecting) { mark.classList.add('animate'); o.disconnect(); }
    }, { threshold: 0.5 }).observe(mark);

    // ---------- Simple vs weighted ----------
    const seg = document.getElementById('seg');
    const wNum = document.getElementById('weighNum');
    const wCap = document.getElementById('weighCap');
    const wList = document.getElementById('weighList');
    const maxCfu = Math.max(...EXAMS.map((e) => e.cfu));
    wList.innerHTML = EXAMS.slice(0, 5).map((e) => `
        <div class="weigh-row">
            <span class="badge ${tier(e.grade, e.lode)}">${e.lode ? '30L' : e.grade}</span>
            <div><div class="nm">${e.name}</div><div class="w"><i data-cfu="${e.cfu}"></i></div></div>
            <span class="cfu">${e.cfu} CFU</span>
        </div>`).join('');
    wNum.dataset.from = String(AVG);
    const setSeg = (v) => {
        seg.dataset.v = v;
        seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.v === v)));
        const weighted = v === '1';
        count(wNum, weighted ? AVG : ARITH, 2, 600);
        wCap.textContent = weighted ? 'Ogni voto pesa quanto i suoi CFU' : 'Tutti gli esami pesano uguale';
        wList.querySelectorAll('.w i').forEach((i) => { i.style.width = weighted ? `${(i.dataset.cfu / maxCfu) * 100}%` : '60%'; });
    };
    seg.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => setSeg(b.dataset.v)));
    setSeg('1');

    // ---------- Graduation ----------
    const gAvg = document.getElementById('gAvg');
    const gTh = document.getElementById('gTh');
    const gOn = document.getElementById('gOn');
    const gradOut = document.getElementById('gradOut');
    const updGrad = () => {
        const avg = +gAvg.value;
        const th = +gTh.value;
        const bonus = gOn.checked ? 2 : 0;
        const base = (avg * 110) / 30;
        const raw = base + th + bonus;
        const final = Math.min(110, Math.round(raw));
        document.getElementById('gAvgL').textContent = fmt(avg, 2);
        document.getElementById('gThL').textContent = th;
        document.getElementById('gradBase').textContent = `Base ${fmt(base, 1)}`;
        document.getElementById('gradThesis').textContent = `Tesi +${th}`;
        document.getElementById('gradBonus').textContent = `Bonus +${bonus}`;
        count(gradOut, final, 0, 400);
        document.getElementById('gradLode').classList.toggle('on', raw >= 111);
    };
    gradOut.dataset.from = '105';
    [gAvg, gTh, gOn].forEach((el) => el.addEventListener('input', updGrad));

    // ---------- Needed ----------
    const nT = document.getElementById('nT');
    const nC = document.getElementById('nC');
    const needOut = document.getElementById('needOut');
    const verdict = document.getElementById('needVerdict');
    needOut.dataset.from = '29.4';
    const updNeed = () => {
        const target = +nT.value;
        const cfu = +nC.value;
        const need = (target * (CFU + cfu) - SUM) / cfu;
        document.getElementById('nTL').textContent = fmt(target, 2);
        document.getElementById('nCL').textContent = `${cfu} CFU`;
        document.getElementById('needIntro').textContent = `Per avere media ${fmt(target, 2).replace(/,00$/, '')} dopo i prossimi ${cfu} CFU ti serve in media`;
        let txt, cls;
        if (need <= 18) { txt = 'Ci sei già: basta passare gli esami.'; cls = ''; }
        else if (need <= 27) { txt = 'Alla tua portata.'; cls = ''; }
        else if (need <= 30) { txt = 'Impegnativo ma possibile.'; cls = 'hard'; }
        else { txt = 'Non basta neanche 30 in tutto: allarga l’orizzonte.'; cls = 'bad'; }
        verdict.textContent = txt;
        verdict.className = `verdict ${cls}`;
        if (need > 30) { needOut.textContent = '> 30'; needOut.dataset.from = '30'; }
        else count(needOut, Math.max(18, need), 1, 400);
    };
    [nT, nC].forEach((el) => el.addEventListener('input', updNeed));

    // ---------- What if ----------
    const grades = document.getElementById('grades');
    const wiOut = document.getElementById('wiOut');
    const wiDelta = document.getElementById('wiDelta');
    wiOut.dataset.from = String(AVG);
    [18, 21, 24, 26, 27, 28, 29, 30].forEach((g) => {
        const b = document.createElement('button');
        b.textContent = g;
        b.setAttribute('aria-label', `Voto ${g}`);
        b.addEventListener('click', () => {
            grades.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
            const next = (SUM + g * 9) / (CFU + 9);
            const d = next - AVG;
            count(wiOut, next, 2, 500);
            wiDelta.textContent = `${d >= 0 ? '▲' : '▼'} ${fmt(Math.abs(d), 2)}`;
            wiDelta.classList.toggle('neg', d < 0);
        });
        grades.appendChild(b);
    });

    // ---------- Import PDF plays when visible ----------
    const imp = document.getElementById('libretto');
    new IntersectionObserver(([en], o) => {
        if (en.isIntersecting) { imp.classList.add('play'); o.disconnect(); }
    }, { threshold: 0.35 }).observe(imp);

    // ---------- Universities marquee ----------
    const UNIS = [
        ['Sapienza Università di Roma', 'Roma'], ['Politecnico di Milano', 'Milano'], ['Università di Bologna', 'Bologna'],
        ['Università Federico II', 'Napoli'], ['Università di Padova', 'Padova'], ['Politecnico di Torino', 'Torino'],
        ['Università di Pisa', 'Pisa'], ['Università Bocconi', 'Milano'], ['Università di Firenze', 'Firenze'],
        ['Università di Torino', 'Torino'], ['Università di Trento', 'Trento'], ['Università Cattolica', 'Milano'],
        ['Università di Bari Aldo Moro', 'Bari'], ['Università di Palermo', 'Palermo'], ['Università di Genova', 'Genova'],
        ['Università Ca’ Foscari', 'Venezia'], ['Università di Pavia', 'Pavia'], ['Università Roma Tre', 'Roma'],
        ['Università di Catania', 'Catania'], ['Università della Calabria', 'Rende'], ['Università di Salerno', 'Salerno'],
        ['Università Statale di Milano', 'Milano'], ['Tor Vergata', 'Roma'], ['Università di Cagliari', 'Cagliari'],
        ['Università del Salento', 'Lecce'], ['Università di Verona', 'Verona'], ['Università di Perugia', 'Perugia'],
        ['Università di Siena', 'Siena'], ['Università dell’Aquila', 'L’Aquila'], ['Università di Parma', 'Parma'],
    ];
    const MONO = ['#FF6B57', '#FFC93C', '#1FB57A', '#B9AEFF', '#8FD3FF'];
    const initials = (n) => n.replace(/Università (di |del |della |dell’|degli Studi di )?/, '').replace(/[’']/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    const chip = ([n, c], i) => `<div class="uni"><span class="mono" style="background:${MONO[i % MONO.length]}">${initials(n)}</span><span><b>${n}</b><span>${c}</span></span></div>`;
    const half = Math.ceil(UNIS.length / 2);
    const fill = (id, list, off) => {
        const html = list.map((u, i) => chip(u, i + off)).join('');
        document.getElementById(id).innerHTML = html + html; // duplicated for a seamless loop
    };
    fill('uniA', UNIS.slice(0, half), 0);
    fill('uniB', UNIS.slice(half), 2);

    // App Store link: set when the listing is live.
    const APP_STORE_URL = '';
    document.querySelectorAll('a[href="#scarica"], #appStoreLink').forEach((a) => {
        if (APP_STORE_URL && (a.id === 'appStoreLink' || a.closest('.cta-row'))) a.href = APP_STORE_URL;
    });
})();
