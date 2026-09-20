'use strict';
/**
 * بک‌اند باشگاه پلیت
 * - بدون هیچ وابستگی خارجی (فقط Node.js 18 به بالا)
 * - ثبت درخواست جلسه رایگان، با اعتبارسنجی، محدودیت تعداد درخواست و ضدربات
 * - فهرست درخواست‌ها فقط با توکن مدیر (ADMIN_TOKEN) قابل دیدن است
 *
 * متغیرهای محیطی:
 *   PORT            پورت (Railway خودش تنظیم می‌کند)
 *   ADMIN_TOKEN     رمز مدیر برای دیدن درخواست‌ها (حتماً تنظیم کنید)
 *   ALLOWED_ORIGIN  آدرس سایت فرانت، مثلاً https://plate-gym.netlify.app
 *                   (چند آدرس را با کاما جدا کنید. اگر خالی باشد همه مجازند)
 *   DATA_DIR        پوشه ذخیره‌ی داده‌ها (پیش‌فرض ./data)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'registrations.json');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const ALLOWED = (process.env.ALLOWED_ORIGIN || '*').split(',').map((s) => s.trim()).filter(Boolean);

const MAX_BODY = 10 * 1024;
const MAX_RECORDS = 5000;
const RATE_LIMIT = 5; // حداکثر درخواست ثبت از هر IP
const RATE_WINDOW = 60 * 60 * 1000; // در هر ساعت

const GOALS = ['کاهش وزن', 'حجم‌گیری', 'آمادگی جسمانی', 'بازتوانی و سلامت'];
const TIMES = ['صبح', 'ظهر', 'عصر', 'شب'];

/* ---------- ذخیره‌سازی ---------- */
let records = [];
try {
  records = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!Array.isArray(records)) records = [];
} catch (_) {
  records = [];
}

let writing = Promise.resolve();
function save() {
  // نوشتن پشت‌سرهم و اتمی: اول فایل موقت، بعد جایگزینی
  writing = writing
    .then(async () => {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      const tmp = DATA_FILE + '.tmp';
      await fs.promises.writeFile(tmp, JSON.stringify(records));
      await fs.promises.rename(tmp, DATA_FILE);
    })
    .catch((e) => console.error('ذخیره‌سازی ناموفق بود:', e.message));
  return writing;
}

/* ---------- ابزارها ---------- */
function toLatinDigits(s) {
  return String(s)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

function normalizePhone(raw) {
  let p = toLatinDigits(raw).replace(/[\s\-()]/g, '');
  if (p.startsWith('+98')) p = '0' + p.slice(3);
  else if (p.startsWith('0098')) p = '0' + p.slice(4);
  else if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2);
  return p;
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW);
  if (list.length >= RATE_LIMIT) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  return false;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, list] of hits) {
    const fresh = list.filter((t) => now - t < RATE_WINDOW);
    if (fresh.length) hits.set(ip, fresh);
    else hits.delete(ip);
  }
}, 10 * 60 * 1000).unref();

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function corsHeaders(req) {
  const origin = req.headers.origin;
  const h = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  if (ALLOWED.includes('*')) h['Access-Control-Allow-Origin'] = '*';
  else if (origin && ALLOWED.includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Vary'] = 'Origin';
  }
  return h;
}

function send(req, res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...corsHeaders(req),
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (_) {
        reject(Object.assign(new Error('bad json'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

/* ---------- مسیرها ---------- */
async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const route = url.pathname.replace(/\/+$/, '') || '/';

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders(req));
    return res.end();
  }

  if (route === '/' || route === '/api/health') {
    return send(req, res, 200, { ok: true, service: 'plate-gym-api' });
  }

  if (route === '/api/register' && req.method === 'POST') {
    const ip = clientIp(req);
    if (rateLimited(ip)) {
      return send(req, res, 429, { ok: false, error: 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.' });
    }
    const b = await readBody(req);

    // ضدربات: فیلد مخفی که آدم‌ها پر نمی‌کنند
    if (b.website) return send(req, res, 200, { ok: true });

    const name = String(b.name || '').replace(/[\u0000-\u001f<>]/g, '').trim();
    const phone = normalizePhone(b.phone || '');
    const goal = String(b.goal || '');
    const time = String(b.time || '');

    if (name.length < 2 || name.length > 60) {
      return send(req, res, 400, { ok: false, error: 'نام را کامل وارد کنید (۲ تا ۶۰ حرف).' });
    }
    if (!/^09\d{9}$/.test(phone)) {
      return send(req, res, 400, { ok: false, error: 'شماره موبایل باید مثل ۰۹۱۲۳۴۵۶۷۸۹ باشد.' });
    }
    if (!GOALS.includes(goal) || !TIMES.includes(time)) {
      return send(req, res, 400, { ok: false, error: 'هدف و زمان تمرین را از فهرست انتخاب کنید.' });
    }

    // جلوگیری از ثبت تکراری با یک شماره در ۱۰ دقیقه
    const recent = records.find((r) => r.phone === phone && Date.now() - r.createdAt < 10 * 60 * 1000);
    if (!recent) {
      records.push({ id: crypto.randomUUID(), name, phone, goal, time, createdAt: Date.now() });
      if (records.length > MAX_RECORDS) records = records.slice(-MAX_RECORDS);
      await save();
    }
    return send(req, res, 201, { ok: true });
  }

  if (route === '/api/registrations' && req.method === 'GET') {
    if (!ADMIN_TOKEN) {
      return send(req, res, 503, { ok: false, error: 'ADMIN_TOKEN روی سرور تنظیم نشده است.' });
    }
    const auth = String(req.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token || !safeEqual(token, ADMIN_TOKEN)) {
      return send(req, res, 401, { ok: false, error: 'توکن نادرست است.' });
    }
    return send(req, res, 200, { ok: true, count: records.length, items: [...records].reverse() });
  }

  return send(req, res, 404, { ok: false, error: 'پیدا نشد.' });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    if (!res.headersSent) send(req, res, status, { ok: false, error: status === 500 ? 'خطای سرور.' : 'درخواست نامعتبر است.' });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`API روی پورت ${PORT} اجرا شد`);
  if (!ADMIN_TOKEN) console.warn('هشدار: ADMIN_TOKEN تنظیم نشده؛ فهرست درخواست‌ها غیرفعال است.');
  if (ALLOWED.includes('*')) console.warn('هشدار: ALLOWED_ORIGIN تنظیم نشده؛ همه‌ی سایت‌ها مجازند.');
});

function shutdown() {
  server.close(() => writing.finally(() => process.exit(0)));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
