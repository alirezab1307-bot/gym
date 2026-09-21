'use strict';
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- تنظیمات (از config.js) ---------- */
  const API = String(window.APP_API_BASE || '').replace(/\/+$/, '');
  const C = Object.assign({
    phone: '02100000000', phoneDisplay: '۰۲۱-۰۰۰۰۰۰۰۰', whatsapp: '', telegram: '', instagram: '',
    address: 'تهران، خیابان نمونه، پلاک ۱۲ (آدرس واقعی را در config.js بنویسید)',
    hours: 'شنبه تا پنجشنبه، ۹ تا ۲۰'
  }, window.APP_CONTACT || {});

  /* ---------- ابزارها ---------- */
  const toFa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]).replace(/\./g, '٫');
  const toLatin = (s) => String(s)
    .replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x06f0)
    .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x0660)
    .replace(/[٫،,]/g, '.');
  const trim = (n, d = 1) => String(Number(n.toFixed(d)));
  const money = (toman) => (toman >= 1e9 ? toFa(trim(toman / 1e9)) + ' میلیارد' : toFa(trim(toman / 1e6, 0)) + ' میلیون');
  const moneyM = (m) => (m >= 1000 ? toFa(trim(m / 1000, 2)) + ' میلیارد تومان' : toFa(trim(m, 2)) + ' میلیون تومان');

  /* ---------- منوی موبایل ---------- */
  const menuBtn = $('#menuBtn'), navLinks = $('#navLinks');
  menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('#navLinks a').forEach((a) => a.addEventListener('click', () => {
    navLinks.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- پلان تعاملی ---------- */
  const cap = $('#planCap');
  const capDefault = cap.innerHTML;
  $$('.room').forEach((r) => {
    const show = () => {
      $$('.room').forEach((x) => x.classList.toggle('on', x === r));
      cap.innerHTML = '<b>' + r.dataset.name + '</b>، ' + r.dataset.area + ' متر مربع';
    };
    const hide = () => { r.classList.remove('on'); cap.innerHTML = capDefault; };
    r.addEventListener('mouseenter', show); r.addEventListener('mouseleave', hide);
    r.addEventListener('focus', show); r.addEventListener('blur', hide);
    r.addEventListener('click', show);
  });

  /* ---------- ملک‌های نمونه ---------- */
  const LISTINGS = [
    { deal: 'sale', type: 'apartment', title: 'آپارتمان نوساز', loc: 'سعادت‌آباد', area: 110, rooms: 2, floor: 5, price: 9.8e9, tags: ['پارکینگ', 'انباری', 'آسانسور'] },
    { deal: 'sale', type: 'apartment', title: 'آپارتمان دو خوابه', loc: 'پونک', area: 82, rooms: 2, floor: 3, price: 5.2e9, tags: ['پارکینگ', 'نورگیر عالی'] },
    { deal: 'sale', type: 'villa', title: 'ویلای باغ‌دار', loc: 'لواسان', area: 210, rooms: 4, floor: 2, price: 35e9, tags: ['حیاط', 'استخر', 'سند تک‌برگ'] },
    { deal: 'sale', type: 'apartment', title: 'آپارتمان سه خوابه', loc: 'شهرک غرب', area: 140, rooms: 3, floor: 7, price: 18e9, tags: ['تراس', 'پارکینگ', 'لابی'] },
    { deal: 'rent', type: 'apartment', title: 'آپارتمان دو خوابه', loc: 'ونک', area: 95, rooms: 2, floor: 4, rahn: 800e6, ejare: 12e6, tags: ['پارکینگ', 'انباری'] },
    { deal: 'rent', type: 'apartment', title: 'آپارتمان یک خوابه', loc: 'صادقیه', area: 65, rooms: 1, floor: 2, rahn: 450e6, ejare: 7e6, tags: ['نزدیک مترو'] },
    { deal: 'rent', type: 'office', title: 'واحد اداری', loc: 'ولیعصر', area: 70, rooms: 0, floor: 3, rahn: 1e9, ejare: 20e6, tags: ['آسانسور', 'پارکینگ'] },
    { deal: 'rent', type: 'apartment', title: 'آپارتمان سه خوابه', loc: 'نیاوران', area: 120, rooms: 3, floor: 5, rahn: 2e9, ejare: 25e6, tags: ['تراس', 'پارکینگ'] }
  ];
  const TYPE_LABEL = { apartment: 'آپارتمان', villa: 'ویلا', office: 'اداری' };

  // پلان کوچک برای هر ملک؛ تعداد اتاق‌ها، چیدمان را مشخص می‌کند
  function miniPlan(rooms) {
    const walls = {
      0: 'M100 10V120M10 65H100M100 65H190',
      1: 'M120 10V50M120 70V120M120 65H190',
      2: 'M110 10V45M110 65V120M110 65H190M150 65V120',
      3: 'M10 60H45M65 60H95M115 60H145M165 60H190M70 60V120M130 60V120M100 10V60',
      4: 'M10 55H35M55 55H85M105 55H135M155 55H190M57 55V120M105 55V120M152 55V120M100 10V55'
    }[Math.min(rooms, 4)];
    const tint = '<rect x="10" y="10" width="180" height="110" fill="rgba(220,196,143,.08)"/>';
    return '<svg viewBox="0 0 200 130" aria-hidden="true">' + tint +
      '<path d="M10 10H190V120H10Z" fill="none" stroke="#dcc48f" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="' + walls + '" fill="none" stroke="#b39868" stroke-width="1.6"/></svg>';
  }
  const ICON = {
    area: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 10h6v10"/></svg>',
    bed: '<svg viewBox="0 0 24 24"><path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/></svg>',
    floor: '<svg viewBox="0 0 24 24"><path d="M3 20h18M6 20V9h12v11M9 13h2M13 13h2"/></svg>'
  };

  const state = { deal: 'sale', type: 'all' };
  const track = $('#track');

  function renderListings() {
    const items = LISTINGS.filter((l) => l.deal === state.deal && (state.type === 'all' || l.type === state.type));
    if (!items.length) { track.innerHTML = '<p class="empty">ملکی با این فیلتر در نمونه‌ها نیست. نوع ملک را تغییر دهید.</p>'; updateBar(); return; }
    track.innerHTML = items.map((l) => {
      const price = l.deal === 'sale'
        ? '<div class="price">' + money(l.price) + ' <small>تومان</small></div>'
        : '<div class="price">رهن ' + money(l.rahn) + ' <small>تومان</small></div><small style="color:var(--muted)">اجاره‌ی ماهانه ' + money(l.ejare) + ' تومان</small>';
      const meta = '<span>' + ICON.area + toFa(l.area) + ' متر</span>' +
        (l.rooms ? '<span>' + ICON.bed + toFa(l.rooms) + ' خواب</span>' : '') +
        '<span>' + ICON.floor + 'طبقه ' + toFa(l.floor) + '</span>';
      return '<article class="prop"><div class="prop-plan">' + miniPlan(l.rooms) +
        '<span class="tag ' + (l.deal === 'rent' ? 'rent' : '') + '">' + (l.deal === 'sale' ? 'فروش' : 'رهن و اجاره') + '</span><span class="tag sample">نمونه</span></div>' +
        '<div class="prop-body"><h3>' + l.title + '</h3><p class="prop-loc">' + TYPE_LABEL[l.type] + '، ' + l.loc + '</p>' + price +
        '<div class="meta">' + meta + '</div><div class="meta" style="border:0;padding-top:0;margin-top:6px">' + l.tags.join(' · ') + '</div></div></article>';
    }).join('');
    track.scrollTo({ left: 0 });
    updateBar();
  }

  // نوار پیشرفت و دکمه‌های اسلایدر (در راست‌به‌چپ، «بعدی» یعنی اسکرول به چپ)
  const bar = $('#bar');
  function updateBar() {
    const max = track.scrollWidth - track.clientWidth;
    const ratio = track.scrollWidth ? track.clientWidth / track.scrollWidth : 1;
    const pos = max > 0 ? Math.min(1, Math.abs(track.scrollLeft) / max) : 0;
    const w = Math.max(12, Math.min(100, ratio * 100));
    bar.style.width = w + '%';
    bar.style.marginRight = (pos * (100 - w)) + '%';
  }
  const step = () => { const c = track.firstElementChild; return c ? c.getBoundingClientRect().width + 20 : 300; };
  $('#next').addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
  $('#prev').addEventListener('click', () => track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
  track.addEventListener('scroll', updateBar, { passive: true });
  window.addEventListener('resize', updateBar);

  function setDeal(deal) {
    state.deal = deal;
    $$('#filters .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.deal === deal)));
    $$('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.deal === deal)));
    renderListings();
  }
  $$('#filters .chip').forEach((b) => b.addEventListener('click', () => setDeal(b.dataset.deal)));
  $$('.seg button').forEach((b) => b.addEventListener('click', () => {
    state.deal = b.dataset.deal;
    $$('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  $('#finder').addEventListener('submit', (e) => {
    e.preventDefault();
    state.type = $('#finderType').value;
    setDeal(state.deal);
    $('#listings').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });
  renderListings();

  /* ---------- ماشین‌حساب تبدیل رهن به اجاره ---------- */
  const cRahn = $('#cRahn'), cConv = $('#cConv'), cRate = $('#cRate');
  function calc() {
    const rahn = parseFloat(toLatin(cRahn.value)), conv = parseFloat(toLatin(cConv.value)), rate = parseFloat(cRate.value);
    $('#cRateVal').textContent = toFa(rate.toFixed(1)) + '٪';
    if (!(rahn > 0) || !(conv >= 0)) { $('#rEjare').textContent = '—'; $('#rLeft').textContent = '—'; return; }
    const c = Math.min(conv, rahn);
    $('#rEjare').textContent = moneyM(c * rate / 100);
    $('#rLeft').textContent = moneyM(rahn - c);
  }
  [cRahn, cConv, cRate].forEach((el) => el.addEventListener('input', calc));
  calc();

  /* ---------- اسلایدر نظرات ---------- */
  const slides = $$('.rv-slide'), dotsEl = $('#dots'), rv = $('#rv');
  let idx = 0, timer = null;
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'dot'; d.type = 'button'; d.setAttribute('aria-label', 'نظر ' + toFa(i + 1));
    d.addEventListener('click', () => { show(i); restart(); });
    dotsEl.append(d);
  });
  function show(i) {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle('active', k === idx); s.setAttribute('aria-hidden', String(k !== idx)); });
    $$('.dot', dotsEl).forEach((d, k) => d.setAttribute('aria-current', String(k === idx)));
  }
  function restart() { clearInterval(timer); if (!reduce) timer = setInterval(() => show(idx + 1), 7000); }
  $('#rvNext').addEventListener('click', () => { show(idx + 1); restart(); });
  $('#rvPrev').addEventListener('click', () => { show(idx - 1); restart(); });
  rv.addEventListener('mouseenter', () => clearInterval(timer)); rv.addEventListener('mouseleave', restart);
  let x0 = null;
  rv.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; clearInterval(timer); }, { passive: true });
  rv.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    x0 = null; restart();
  });
  show(0); restart();

  /* ---------- اطلاعات تماس ---------- */
  const svg = (p) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>';
  const info = [];
  info.push('<div>' + svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>') + '<a href="tel:' + C.phone + '">' + C.phoneDisplay + '</a></div>');
  info.push('<div>' + svg('<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>') + '<span>' + C.address + '</span></div>');
  info.push('<div>' + svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>') + '<span>' + C.hours + '</span></div>');
  if (C.whatsapp) info.push('<div>' + svg('<path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8z"/>') + '<a href="https://wa.me/' + C.whatsapp + '">واتساپ</a></div>');
  if (C.telegram) info.push('<div>' + svg('<path d="M21 4 3 11l6 2 2 6 3-4 5 3z"/>') + '<a href="https://t.me/' + C.telegram + '">تلگرام</a></div>');
  $('#info').innerHTML = info.join('');
  if (C.phone) $('#fab').setAttribute('href', 'tel:' + C.phone);

  /* ---------- فرم درخواست مشاوره ---------- */
  const form = $('#leadForm'), msg = $('#leadMsg'), btn = $('#leadBtn');
  const setErr = (n, t) => {
    const el = $('[data-for="' + n + '"]', form), input = form.elements[n];
    if (el) el.textContent = t || '';
    if (input) input.setAttribute('aria-invalid', t ? 'true' : 'false');
  };
  function validate() {
    let ok = true;
    const phone = toLatin(form.elements.phone.value).replace(/[\s\-]/g, '');
    ['name', 'phone', 'kind'].forEach((n) => setErr(n, ''));
    if (form.elements.name.value.trim().length < 2) { setErr('name', 'نام را کامل وارد کنید.'); ok = false; }
    if (!/^(\+98|0098|98|0)?9\d{9}$/.test(phone)) { setErr('phone', 'شماره موبایل باید مثل ۰۹۱۲۳۴۵۶۷۸۹ باشد.'); ok = false; }
    if (!form.elements.kind.value) { setErr('kind', 'یکی از گزینه‌ها را انتخاب کنید.'); ok = false; }
    return ok;
  }
  function fallbackText() {
    const text = 'سلام، ' + form.elements.name.value.trim() + ' هستم. ' + form.elements.kind.value + '. شماره‌ی من: ' + form.elements.phone.value.trim();
    if (C.whatsapp) return ' می‌توانید مستقیم در <a href="https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(text) + '">واتساپ</a> پیام بدهید.';
    return ' می‌توانید با <a href="tel:' + C.phone + '">' + C.phoneDisplay + '</a> تماس بگیرید.';
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'form-msg'; msg.textContent = '';
    if (!validate()) { msg.className = 'form-msg err'; msg.textContent = 'لطفاً خطاهای فرم را اصلاح کنید.'; return; }
    btn.disabled = true; btn.textContent = 'در حال ارسال...';
    try {
      const res = await fetch(API + '/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.elements.name.value, phone: form.elements.phone.value, kind: form.elements.kind.value,
          note: form.elements.note.value, website: form.elements.website.value
        })
      });
      if (!res.ok) {
        let t = ''; try { t = (await res.json()).error || ''; } catch (_) {}
        throw Object.assign(new Error(t), { http: true, status: res.status });
      }
      form.reset();
      msg.className = 'form-msg ok';
      msg.textContent = 'درخواست شما ثبت شد. مشاور دفتر به‌زودی با شما تماس می‌گیرد.';
    } catch (err) {
      msg.className = 'form-msg err';
      if (err.http && err.status === 429) msg.textContent = err.message || 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.';
      else if (err.http && err.status === 400) msg.textContent = err.message || 'اطلاعات واردشده درست نیست.';
      else msg.innerHTML = 'ارسال انجام نشد.' + fallbackText();
    } finally {
      btn.disabled = false; btn.textContent = 'ثبت درخواست مشاوره';
    }
  });
})();
