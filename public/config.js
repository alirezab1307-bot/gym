/*
  تنظیمات سایت
  ───────────────────────────────────────────────────────────
  APP_API_BASE : آدرس بک‌اند (Render).
     - اگر سایت را از خود Render باز می‌کنید: خالی بگذارید.
     - اگر فرانت را جای دیگری (Netlify، Cloudflare) می‌گذارید: آدرس Render را بنویسید،
       بدون / در انتها. مثال:  "https://esperlous-test.onrender.com"
  APP_CONTACT  : اطلاعات تماس دفتر که در صفحه‌ی عمومی نمایش داده می‌شود.
     - phone: شماره برای لینک تماس (بدون فاصله). whatsapp: شماره با کد کشور، مثل 989121234567
     - telegram: نام کاربری بدون @ ، هر فیلد خالی باشد نمایش داده نمی‌شود.
*/
window.APP_API_BASE = "https://gympelt.netlify.app/panel.html";

window.APP_CONTACT = {
  phone: "02100000000",
  phoneDisplay: "۰۲۱-۰۰۰۰۰۰۰۰",
  whatsapp: "",
  telegram: "",
  address: "کرمانشاه سیمتری دوم نبش خیابان شیخ بهایی",
  hours: "شنبه تا پنجشنبه، ۹ تا ۲۰"
};
