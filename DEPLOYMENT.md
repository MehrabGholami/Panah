# راهنمای استقرار پناه (Panah Deployment Guide)

**Frontend** → [Vercel](https://vercel.com) | **Backend** → [Railway.app](https://railway.app)

---

## ۱. استقرار Backend روی Railway

### گام ۱: ساخت پروژه در Railway

1. به [railway.app](https://railway.app) بروید و Login کنید
2. روی **New Project** کلیک کنید
3. گزینه **Deploy from GitHub repo** را انتخاب کنید
4. Repository پروژه را انتخاب کنید

### گام ۲: اضافه کردن سرویس‌های دیتابیس

در داشبورد Railway، روی **+ New Service** کلیک کنید:

#### PostgreSQL
- **Add → PostgreSQL** را انتخاب کنید
- Railway به‌صورت خودکار `DATABASE_URL` را inject می‌کند

#### Redis
- **Add → Redis** را انتخاب کنید
- Railway به‌صورت خودکار `REDIS_URL` را inject می‌کند

### گام ۳: تنظیم Environment Variables

در تنظیمات سرویس Backend، این متغیرها را اضافه کنید:

```
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=<یک رشته تصادفی ۵۰ کاراکتری بسازید>
DEBUG=0
ALLOWED_HOSTS=<your-service>.up.railway.app
CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app
CORS_ALLOWED_ORIGINS_EXTRA=https://<your-vercel-app>.vercel.app

# اگر Railway خودکار set نکرد:
REDIS_URL=${{Redis.REDIS_URL}}
CELERY_BROKER_URL=${{Redis.REDIS_URL}}
CELERY_RESULT_BACKEND=${{Redis.REDIS_URL}}

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# Email (در صورت نیاز)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=1
DEFAULT_FROM_EMAIL=your-email@gmail.com

# Admin اولیه
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=<رمز قوی>

SECURE_SSL_REDIRECT=1
```

> **نکته**: برای SECRET_KEY می‌توانید از این دستور استفاده کنید:
> python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

### گام ۴: اجرای Celery Worker (اختیاری)

در Railway می‌توانید یک سرویس جداگانه برای Celery Worker بسازید:
- **+ New Service → GitHub Repo** (همان repo)
- **Start Command** را override کنید:
  celery -A config worker --loglevel=info
- همان Environment Variables را اضافه کنید

---

## ۲. استقرار Frontend روی Vercel

### گام ۱: ورود به Vercel

1. به [vercel.com](https://vercel.com) بروید و Login کنید
2. روی **Add New → Project** کلیک کنید
3. همان GitHub repository را import کنید

### گام ۲: تنظیم Build

| تنظیم | مقدار |
|--------|-------|
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### گام ۳: تنظیم Environment Variables در Vercel

در **Settings → Environment Variables**:

```
VITE_API_BASE_URL=https://<your-railway-service>.up.railway.app/api/v1
VITE_APP_NAME=پناه
```

### گام ۴: Deploy

روی **Deploy** کلیک کنید.

---

## ۳. اتصال Frontend به Backend

بعد از deploy شدن هر دو:

1. URL سرویس Railway را کپی کنید
2. در Vercel، VITE_API_BASE_URL را آپدیت کنید
3. URL سایت Vercel را کپی کنید
4. در Railway، CORS_ALLOWED_ORIGINS_EXTRA را آپدیت کنید
5. هر دو سرویس را Redeploy کنید

---

## ۴. چک‌لیست نهایی

- [ ] Railway: PostgreSQL و Redis اضافه شده
- [ ] Railway: تمام Environment Variables تنظیم شده
- [ ] Railway: سرویس deploy شده و health check سبز است
- [ ] Vercel: Root Directory روی frontend تنظیم شده
- [ ] Vercel: VITE_API_BASE_URL تنظیم شده
- [ ] Vercel: deploy موفق
- [ ] CORS تنظیم شده (URL Vercel در Railway)
- [ ] تست: لاگین در سایت Vercel کار می‌کند
