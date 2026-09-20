'use strict';
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fa = (n) => Number(n).toLocaleString('fa-IR', { useGrouping: false });
  const toLatin = (s) => String(s)
    .replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x06f0)
    .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x0660);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- هدر و منوی موبایل ---------- */
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = $('#menuBtn');
  const navLinks = $('#navLinks');
  menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('#navLinks a').forEach((a) => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- شمارنده‌ی آمار ---------- */
  const counters = $$('[data-count]');
  function runCounter(el) {
    const target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = fa(target); return; }
    const start = performance.now();
    const dur = 1400;
    (function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fa(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { runCounter(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach((c) => io.observe(c));
  }

  /* ---------- برنامه‌ی کلاس‌ها ---------- */
  const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
  const LEVELS = { 1: 'مبتدی', 2: 'متوسط', 3: 'پیشرفته' };
  const SCHEDULE = [
    [['۰۷:۰۰', 'کراس‌فیت', 'مریم رضایی', 2], ['۱۰:۰۰', 'یوگا', 'سارا نوری', 1], ['۱۷:۳۰', 'TRX', 'امیر حسینی', 1], ['۲۰:۰۰', 'بدنسازی گروهی', 'کامران احمدی', 2]],
    [['۰۸:۰۰', 'پیلاتس', 'سارا نوری', 1], ['۱۸:۰۰', 'کراس‌فیت', 'مریم رضایی', 3], ['۲۰:۳۰', 'بوکس فیتنس', 'امیر حسینی', 2]],
    [['۰۷:۰۰', 'TRX', 'امیر حسینی', 1], ['۱۰:۳۰', 'زومبا', 'سارا نوری', 1], ['۱۹:۰۰', 'بدنسازی گروهی', 'کامران احمدی', 3]],
    [['۰۷:۳۰', 'کراس‌فیت', 'مریم رضایی', 2], ['۱۷:۰۰', 'یوگا', 'سارا نوری', 1], ['۲۰:۰۰', 'بوکس فیتنس', 'امیر حسینی', 2]],
    [['۰۸:۰۰', 'پیلاتس', 'سارا نوری', 1], ['۱۸:۳۰', 'TRX', 'امیر حسینی', 2], ['۲۰:۳۰', 'کراس‌فیت', 'مریم رضایی', 3]],
    [['۰۹:۰۰', 'بدنسازی گروهی', 'کامران احمدی', 2], ['۱۱:۰۰', 'یوگا', 'سارا نوری', 1], ['۱۸:۰۰', 'زومبا', 'سارا نوری', 1]],
    [['۰۹:۳۰', 'کراس‌فیت', 'مریم رضایی', 2], ['۱۱:۳۰', 'TRX', 'امیر حسینی', 1]]
  ];
  const tabsEl = $('#dayTabs');
  const listEl = $('#schedule');
  // شنبه=۰ ... جمعه=۶ ؛ در جاوااسکریپت یکشنبه=۰
  let current = (new Date().getDay() + 1) % 7;

  function renderDay(i, animate) {
    current = i;
    $$('.tab', tabsEl).forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    listEl.innerHTML = '';
    SCHEDULE[i].forEach(([time, name, trainer, lvl], k) => {
      const row = document.createElement('div');
      row.className = 'slot' + (animate && !reduceMotion ? ' pop' : '');
      row.style.animationDelay = (k * 0.06) + 's';
      const t = document.createElement('time'); t.textContent = time;
      const mid = document.createElement('div');
      const h = document.createElement('h3'); h.textContent = name;
      const sm = document.createElement('small'); sm.textContent = 'مربی: ' + trainer;
      mid.append(h, sm);
      const lv = document.createElement('span');
      lv.className = 'level l' + lvl; lv.textContent = LEVELS[lvl];
      row.append(t, mid, lv);
      listEl.append(row);
    });
  }
  DAYS.forEach((d, i) => {
    const b = document.createElement('button');
    b.className = 'tab'; b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = d;
    b.addEventListener('click', () => renderDay(i, true));
    b.addEventListener('keydown', (e) => {
      // در راست‌به‌چپ، فلش چپ یعنی «بعدی»
      let n = null;
      if (e.key === 'ArrowLeft') n = (i + 1) % 7;
      if (e.key === 'ArrowRight') n = (i + 6) % 7;
      if (n !== null) { e.preventDefault(); renderDay(n, true); $$('.tab', tabsEl)[n].focus(); }
    });
    tabsEl.append(b);
  });
  renderDay(current, false);

  /* ---------- BMI ---------- */
  $('#bmiForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const h = parseFloat(toLatin($('#h').value));
    const w = parseFloat(toLatin($('#w').value));
    const out = $('#bmiResult');
    out.innerHTML = '';
    const msg = (text, color) => { const p = document.createElement('p'); p.textContent = text; if (color) p.style.color = color; out.append(p); };
    if (!(h >= 100 && h <= 250) || !(w >= 25 && w <= 300)) {
      msg('قد را بین ۱۰۰ تا ۲۵۰ سانتی‌متر و وزن را بین ۲۵ تا ۳۰۰ کیلوگرم وارد کنید.', 'var(--red)');
      return;
    }
    const bmi = w / Math.pow(h / 100, 2);
    let label = 'کم‌وزن';
    if (bmi >= 30) label = 'چاقی';
    else if (bmi >= 25) label = 'اضافه‌وزن';
    else if (bmi >= 18.5) label = 'محدوده‌ی نرمال';
    const num = document.createElement('div'); num.className = 'bmi-num';     num.textContent = bmi.toFixed(1).replace(/\d/g, (d) => fa(d)).replace('.', '٫');
    const lab = document.createElement('strong'); lab.textContent = label;
    const scale = document.createElement('div'); scale.className = 'bmi-scale';
    const mark = document.createElement('i'); mark.style.right = '0%';
    scale.append(mark);
    out.append(num, lab, scale);
    const pct = Math.max(0, Math.min(1, (bmi - 15) / 25)) * 100;
    requestAnimationFrame(() => { mark.style.right = 'calc(' + pct + '% - 3px)'; });
  });

  /* ---------- اسلایدر نظرات ---------- */
  const slides = $$('.slide');
  const dotsEl = $('#dots');
  const slider = $('#slider');
  let idx = 0, timer = null;
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'dot'; d.type = 'button'; d.setAttribute('aria-label', 'نظر ' + fa(i + 1));
    d.addEventListener('click', () => { show(i); restart(); });
    dotsEl.append(d);
  });
  function show(i) {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle('active', k === idx); s.setAttribute('aria-hidden', String(k !== idx)); });
    $$('.dot', dotsEl).forEach((d, k) => d.setAttribute('aria-current', String(k === idx)));
  }
  function restart() { clearInterval(timer); if (!reduceMotion) timer = setInterval(() => show(idx + 1), 6000); }
  $('#next').addEventListener('click', () => { show(idx + 1); restart(); });
  $('#prev').addEventListener('click', () => { show(idx - 1); restart(); });
  slider.addEventListener('mouseenter', () => clearInterval(timer));
  slider.addEventListener('mouseleave', restart);
  let x0 = null;
  slider.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; clearInterval(timer); }, { passive: true });
  slider.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1)); // کشیدن به چپ = بعدی (راست‌به‌چپ)
    x0 = null; restart();
  });
  show(0); restart();

  /* ---------- فرم ثبت‌نام ---------- */
  const form = $('#joinForm');
  const msg = $('#formMsg');
  const btn = $('#submitBtn');

  function setErr(name, text) {
    const el = $('[data-for="' + name + '"]', form);
    const input = form.elements[name];
    if (el) el.textContent = text || '';
    if (input) input.setAttribute('aria-invalid', text ? 'true' : 'false');
  }
  function validate() {
    let ok = true;
    const name = form.elements.name.value.trim();
    const phone = toLatin(form.elements.phone.value).replace(/[\s\-]/g, '');
    setErr('name', ''); setErr('phone', ''); setErr('goal', ''); setErr('time', '');
    if (name.length < 2) { setErr('name', 'نام را کامل وارد کنید.'); ok = false; }
    if (!/^(\+98|0098|98|0)?9\d{9}$/.test(phone)) { setErr('phone', 'شماره موبایل باید مثل ۰۹۱۲۳۴۵۶۷۸۹ باشد.'); ok = false; }
    if (!form.elements.goal.value) { setErr('goal', 'یک هدف انتخاب کنید.'); ok = false; }
    if (!form.elements.time.value) { setErr('time', 'یک زمان انتخاب کنید.'); ok = false; }
    return ok;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'form-msg'; msg.textContent = '';
    if (!validate()) { msg.className = 'form-msg err'; msg.textContent = 'لطفاً خطاهای فرم را اصلاح کنید.'; return; }
    btn.disabled = true; btn.textContent = 'در حال ارسال...';
    const api = (window.APP_CONFIG && window.APP_CONFIG.API_URL || '').replace(/\/+$/, '');
    try {
      let res;
      if (api) {
        res = await fetch(api + '/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.elements.name.value,
            phone: form.elements.phone.value,
            goal: form.elements.goal.value,
            time: form.elements.time.value,
            website: form.elements['bot-field'].value
          })
        });
      } else {
        const data = new URLSearchParams(new FormData(form));
        data.set('phone', toLatin(form.elements.phone.value));
        res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: data.toString() });
      }
      if (!res.ok) {
        let text = 'ارسال انجام نشد. کمی بعد دوباره تلاش کنید یا تماس بگیرید.';
        try { const j = await res.json(); if (j && j.error) text = j.error; } catch (_) {}
        throw new Error(text);
      }
      form.reset();
      msg.className = 'form-msg ok';
      msg.textContent = 'درخواست شما ثبت شد. به‌زودی با شما تماس می‌گیریم.';
    } catch (err) {
      msg.className = 'form-msg err';
      msg.textContent = err instanceof TypeError ? 'اتصال برقرار نشد. اینترنت را بررسی کنید و دوباره تلاش کنید.' : err.message;
    } finally {
      btn.disabled = false; btn.textContent = 'ثبت درخواست جلسه رایگان';
    }
  });
})();
