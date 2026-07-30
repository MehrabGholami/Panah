<p align="center">
  <img src="docs/assets/panah-mark.svg" alt="پناه — Panah" width="112" height="112" />
</p>

<h1 align="center">پناه (Panah)</h1>

<p align="center">
  <strong>سکوی هوشمند امداد، نجات و مدیریت داوطلبان بحران</strong><br/>
  Smart rescue &amp; relief platform for volunteer coordination in emergencies
</p>

<p align="center">
  <img alt="Stack" src="https://img.shields.io/badge/stack-Django%20%7C%20React%20%7C%20PostgreSQL-0B6E4F?style=flat-square" />
  <img alt="Docker" src="https://img.shields.io/badge/runtime-Docker%20Compose-2496ED?style=flat-square&logo=docker&logoColor=white" />
  <img alt="Python" src="https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img alt="License" src="https://img.shields.io/badge/license-Proprietary-red?style=flat-square" />
</p>

<p align="center">
  Developed by <strong>Investica Group</strong>
</p>

---

## فهرست مطالب

- [درباره سامانه](#درباره-سامانه)
- [قابلیت‌های اصلی](#قابلیتهای-اصلی)
- [معماری سامانه](#معماری-سامانه)
- [چرخه عمر مأموریت](#چرخه-عمر-مأموریت)
- [نقش‌ها و دسترسی](#نقشها-و-دسترسی)
- [پشته فناوری](#پشته-فناوری)
- [پیش‌نیازها](#پیشنیازها)
- [راه‌اندازی یک‌مرحله‌ای](#راهاندازی-یکمرحلهای)
- [استفاده روزانه](#استفاده-روزانه)
- [آدرس‌ها و سرویس‌ها](#آدرسها-و-سرویسها)
- [اعتبارنامه‌های توسعه](#اعتبارنامههای-توسعه)
- [ساختار مخزن](#ساختار-مخزن)
- [عملیات و بکاپ](#عملیات-و-بکاپ)
- [استقرار تولید](#استقرار-تولید)
- [عیب‌یابی](#عیبیابی)
- [مستندات](#مستندات)
- [امنیت مخزن](#امنیت-مخزن)
- [مجوز](#مجوز)

---

## درباره سامانه

**پناه** یک سامانه وب یکپارچه برای هماهنگی نیروهای داوطلب در شرایط بحران است. ستاد عملیات (مدیر و هماهنگ‌کننده) رویداد و مأموریت تعریف می‌کند؛ داوطلبان پروفایل و مهارت ثبت می‌کنند، درخواست همکاری می‌فرستند، تخصیص را می‌پذیرند، حضور ثبت می‌کنند و گزارش می‌دهند.

از نظر معماری نرم‌افزار، پناه یک **Modular Monolith** است:

| لایه | نقش |
|------|-----|
| React SPA (RTL / فارسی) | رابط کاربری تک‌صفحه‌ای |
| Django + DRF | منطق کسب‌وکار، RBAC، قرارداد REST در `/api/v1` |
| PostgreSQL + Redis + Celery | پایداری داده، صف، کارهای پس‌زمینه |
| Nginx | دروازه وب، پروکسی معکوس، فایل‌های ایستا و رسانه |

---

## قابلیت‌های اصلی

| حوزه | شرح |
|------|-----|
| احراز هویت | ثبت‌نام، ورود JWT، تازه‌سازی توکن، پروفایل |
| RBAC | نقش‌ها و مجوزهای پایگاه‌داده‌محور (`admin` / `coordinator` / `volunteer`) |
| داوطلبان | پروفایل، مهارت‌ها، تأیید حساب |
| بحران و مأموریت | ثبت رویداد، انتشار مأموریت، کنترل مرئی‌بودن برای داوطلبان |
| درخواست و تخصیص | کارتابل درخواست، پذیرش/رد تخصیص، حضور |
| وظایف تخصیص | چک‌لیست وظیفه روی هر تخصیص (مدیریت توسط هماهنگ‌کننده، گزارش توسط داوطلب) |
| گزارش و داشبورد | گزارش مأموریت، خلاصه مأموریت پایان‌یافته، شاخص‌های نقش‌محور |
| پشتیبانی | تیکت، اعلان درون‌برنامه‌ای و ایمیل |
| حسابرسی و عملیات | Audit log، بکاپ خودکار DB/Media، پنل Ops |

---

## معماری سامانه

### نمای زمینه (Context)

بازیگران انسانی با سامانه پناه و سرویس‌های بیرونی (ایمیل و …) تعامل دارند:

<p align="center">
  <img src="VDOC/images/fig-01-context.png" alt="C4 Context — سامانه پناه" width="720" />
</p>

```mermaid
C4Context
    title Panah — System Context

    Person(volunteer, "Volunteer", "Applies, accepts assignments, reports")
    Person(coordinator, "Coordinator", "Missions, applications, assignments")
    Person(admin, "Admin", "Users, roles, audit, ops")

    System_Boundary(org, "Crisis Organization") {
        System(panah, "Panah Platform", "Crisis volunteer management")
    }

    System_Ext(smtp, "SMTP / Mailhog", "Transactional email")

    Rel(volunteer, panah, "HTTPS")
    Rel(coordinator, panah, "HTTPS")
    Rel(admin, panah, "HTTPS")
    Rel(panah, smtp, "SMTP")
```

### نمای کانتینر (C4 Container)

<p align="center">
  <img src="VDOC/images/fig-02-c4-container.png" alt="C4 Container — سامانه پناه" width="780" />
</p>

```mermaid
flowchart LR
    subgraph Clients["Clients"]
        B["Browser<br/>React SPA · MUI · RTL"]
    end

    subgraph Edge["Edge"]
        N["Nginx<br/>TLS · Reverse Proxy · Static/Media"]
    end

    subgraph App["Application"]
        API["Django + DRF<br/>JWT · RBAC · Domain Services"]
        W["Celery Worker"]
        Beat["Celery Beat"]
    end

    subgraph Data["Data & Messaging"]
        PG[(PostgreSQL 17)]
        RD[(Redis 7<br/>Cache · Broker · JWT blacklist)]
    end

    subgraph Dev["Dev utilities"]
        MH["Mailhog"]
        PGA["PgAdmin"]
    end

    B -->|HTTPS| N
    N -->|/ | B
    N -->|/api/v1| API
    API --> PG
    API --> RD
    Beat --> RD
    RD --> W
    W --> PG
    W --> MH
    API -.-> PGA
```

### استقرار Docker

<p align="center">
  <img src="VDOC/images/fig-03-docker.png" alt="Docker Compose topology" width="780" />
</p>

| Container | نقش |
|-----------|-----|
| `volunteer-management-nginx` | Reverse proxy |
| `volunteer-management-frontend` | React (Vite) |
| `volunteer-management-backend` | Django REST API |
| `volunteer-management-celery` / `-beat` | Async + scheduled jobs |
| `volunteer-management-postgres` | PostgreSQL 17 |
| `volunteer-management-redis` | Cache / broker / JWT blacklist |
| `volunteer-management-pgadmin` | DB UI (dev) |
| `volunteer-management-mailhog` | Dev SMTP inbox |

### ماژول‌های دامنه (Backend)

```text
backend/src/
├── accounts / authentication   # کاربران، نقش، JWT
├── volunteers / skills         # پروفایل و مهارت داوطلب
├── disasters / missions        # بحران و مأموریت
├── assignments                 # تخصیص + وظایف (AssignmentTask)
├── reports / dashboard         # گزارش و شاخص
├── notifications / tickets     # اعلان و پشتیبانی
├── audit_logs                  # رد حسابرسی
└── ops                         # بکاپ و عملیات
```

---

## چرخه عمر مأموریت

<p align="center">
  <img src="VDOC/images/fig-04-mission-states.png" alt="Mission state machine" width="640" />
</p>

```mermaid
stateDiagram-v2
    [*] --> draft: ایجاد
    draft --> published: انتشار
    draft --> cancelled: لغو
    published --> draft: بازگردانی
    published --> in_progress: شروع عملیات
    published --> cancelled: لغو
    in_progress --> completed: پایان میدان
    in_progress --> cancelled: توقف ایمنی
    completed --> closed: تأیید نهایی
    completed --> in_progress: بازگشایی
    closed --> [*]
    cancelled --> [*]
```

جریان عملیاتی خلاصه:

```mermaid
flowchart LR
    A[ثبت بحران] --> B[ایجاد مأموریت]
    B --> C[انتشار]
    C --> D[درخواست داوطلب]
    D --> E[بررسی / تخصیص]
    E --> F[پذیرش و حضور]
    F --> G[وظایف و گزارش]
    G --> H[بستن مأموریت]
```

---

## نقش‌ها و دسترسی

| نقش | Slug | دامنه |
|-----|------|--------|
| مدیر سامانه | `admin` | کاربران، نقش‌ها، حسابرسی، Ops، دسترسی کامل |
| هماهنگ‌کننده | `coordinator` | بحران، مأموریت، درخواست، تخصیص، وظایف تخصیص |
| داوطلب | `volunteer` | پروفایل، درخواست، پذیرش تخصیص، گزارش وضعیت وظیفه |

RBAC در پایگاه داده تعریف می‌شود (نقش + مجوز). جزئیات ماتریس دسترسی در [VDOC/md/02-system-overview.md](VDOC/md/02-system-overview.md).

---

## پشته فناوری

| لایه | فناوری |
|------|--------|
| Backend | Python 3.13 · Django 5.2 · DRF · SimpleJWT · Celery · drf-spectacular |
| Frontend | React 19 · TypeScript · Vite · MUI · Redux Toolkit · TanStack Query |
| Database | PostgreSQL 17 |
| Cache / Queue | Redis 7 |
| Proxy | Nginx |
| Runtime | Docker Compose |
| Docs API | OpenAPI / Swagger در `/api/docs/` |

قفل وابستگی‌ها:

| Stack | فایل |
|-------|------|
| Frontend | `frontend/package-lock.json` (`npm ci`) |
| Backend | `backend/requirements.lock` |

---

## پیش‌نیازها

| مورد | نسخه |
|------|------|
| Docker Desktop (یا Engine + Compose V2) | آخرین پایدار |
| سیستم‌عامل | Windows 10/11 · Ubuntu 24.04 LTS · macOS |

نصب محلی Python / Node / PostgreSQL لازم نیست.

---

## راه‌اندازی یک‌مرحله‌ای

> روی کلون تازه، فقط `docker compose up` کافی نیست — ابتدا `.env` باید ساخته شود. از `SETUP.*` استفاده کنید.

### Windows

1. Docker Desktop را نصب و اجرا کنید.
2. مخزن را کلون کنید.
3. **`SETUP.bat`** را اجرا کنید (یا `.\SETUP.ps1`).

`SETUP` این کارها را انجام می‌دهد:

1. ساخت `.env` از `.env.example` (در صورت نبود)
2. ساخت پوشه‌های `logs/`، `media/`، `static/`، `database/backups/`
3. انتخاب خودکار پورت آزاد اگر `80`/`443` اشغال باشد
4. `docker compose build` و `up -d`
5. انتظار سلامت بک‌اند، سپس `seed_data` + `seed_demo`

### Linux / macOS

```bash
chmod +x SETUP.sh Start.sh Stop.sh
./SETUP.sh
```

### مسیر دستی معادل

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec -T volunteer-management-backend python manage.py seed_data
docker compose exec -T volunteer-management-backend python manage.py seed_demo
```

---

## استفاده روزانه

| عمل | Windows | Linux / macOS |
|-----|---------|---------------|
| Start | `Start.bat` | `./Start.sh` |
| Stop | `Stop.bat` | `./Stop.sh` |

حجم‌های داده با Stop حفظ می‌شوند. پاک‌سازی کامل:

```bash
docker compose down -v
# سپس دوباره SETUP
```

### دستورات پرکاربرد

```bash
docker compose ps
docker compose logs -f volunteer-management-backend
docker compose exec volunteer-management-backend python manage.py migrate
docker compose exec volunteer-management-backend python manage.py seed_data
docker compose exec volunteer-management-backend python manage.py seed_demo
docker compose up -d --build
```

ادمین سفارشی هنگام seed:

```bash
docker compose exec volunteer-management-backend python manage.py seed_data \
  --admin-email you@example.com \
  --admin-password 'YourSecurePass123!'
```

---

## آدرس‌ها و سرویس‌ها

پورت‌ها از `.env` خوانده می‌شوند (`HTTP_PORT`، `PGADMIN_PORT`، `MAILHOG_WEB_PORT`). پیش‌فرض‌ها:

| سرویس | آدرس پیش‌فرض |
|--------|---------------|
| اپلیکیشن (Frontend via Nginx) | http://localhost |
| ورود | http://localhost/login |
| API v1 | http://localhost/api/v1/ |
| Health | http://localhost/api/v1/health/ |
| Swagger UI | http://localhost/api/docs/ |
| OpenAPI schema | http://localhost/api/schema/ |
| Django Admin | http://localhost/django-admin/ |
| PgAdmin | http://localhost:5050 |
| Mailhog | http://localhost:8025 |

اگر SETUP پورت را عوض کرده باشد (مثلاً `HTTP_PORT=8080`)، از همان پورت استفاده کنید؛ اسکریپت در پایان URL نهایی را چاپ می‌کند.

---

## اعتبارنامه‌های توسعه

> **فقط محیط محلی / دمو.** قبل از اشتراک‌گذاری یا استقرار، مقادیر `.env` را تغییر دهید.

### ورود وب (Admin)

| فیلد | مقدار (از `.env.example`) |
|------|---------------------------|
| Email | `Investicaco@gmail.com` (`ADMIN_EMAIL`) |
| Password | `ADMIN` (`ADMIN_PASSWORD`) |

### PgAdmin

| Email | Password |
|-------|----------|
| `admin@example.com` | `admin` |

### PostgreSQL (شبکه Docker)

| Host | Port | DB / User / Password |
|------|------|----------------------|
| `volunteer-management-postgres` | `5432` (به‌صورت پیش‌فرض روی host منتشر نمی‌شود) | `volunteer_management` / `volunteer_user` / `volunteer_pass` |

---

## ساختار مخزن

```text
├── SETUP.bat / Start.bat / Stop.bat
├── SETUP.sh  / Start.sh  / Stop.sh
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── backend/                 # Django API
├── frontend/                # React + MUI
├── infrastructure/          # Nginx, Postgres init, scripts
├── documentation/           # SDD, ADR, runbooks
├── VDOC/                    # SRS، دیاگرام‌ها، تصاویر معماری
├── environment/             # قالب‌های env تولید
└── database/backups/        # خروجی بکاپ (gitignored محتوا)
```

---

## عملیات و بکاپ

- بکاپ شبانه DB (`pg_dump`) + آرشیو `media/` توسط **Celery Beat** (ساعت ۰۲:۰۰ Asia/Tehran)
- نگه‌داری پیش‌فرض: ۳۰ روز
- مسیر آرتیفکت: `./database/backups/`
- UI: **بکاپ و عملیات** (`/admin/ops`)
- API: `GET /api/v1/ops/backups/status/`
- تریگر دستی:

```bash
docker compose exec volunteer-management-backend python manage.py backup_now
```

جزئیات بازیابی در [documentation/runbooks/deployment.md](documentation/runbooks/deployment.md).

---

## استقرار تولید

```bash
cp environment/.env.production.example .env
# SECRET_KEY قوی، رمز DB، ADMIN_*، ایمیل سازمانی
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Runbook کامل: [documentation/runbooks/deployment.md](documentation/runbooks/deployment.md).

---

## عیب‌یابی

| مشکل | راه‌حل |
|------|--------|
| Docker اجرا نیست | Docker Desktop را روشن کنید و SETUP را دوباره بزنید |
| `.env` نیست | `SETUP` را اجرا کنید |
| پورت ۸۰/۴۴۳ اشغال یا forbidden | SETUP پورت را عوض می‌کند؛ یا دستی `HTTP_PORT=8080` |
| Backend unhealthy | `docker logs volunteer-management-backend` |
| Frontend خالی | حدود ۳۰ ثانیه صبر؛ `docker logs volunteer-management-frontend` |
| ریست کامل | `docker compose down -v` سپس `SETUP` |

---

## مستندات

| سند | مسیر |
|-----|------|
| SRS / مشخصات | [VDOC/md/](VDOC/md/) |
| دیاگرام‌ها | [VDOC/diagrams/](VDOC/diagrams/) |
| Software Design Document | [documentation/architecture/SDD.md](documentation/architecture/SDD.md) |
| API Contracts | [documentation/architecture/api-contracts.md](documentation/architecture/api-contracts.md) |
| Deployment Runbook | [documentation/runbooks/deployment.md](documentation/runbooks/deployment.md) |
| طراحی داده (P21) | [P21.md](P21.md) |
| معماری فاز ۳ (P31) | [P31.md](P31.md) |

---

## امنیت مخزن

| بررسی | وضعیت |
|-------|--------|
| کلید/توکن تولید در سورس | **خیر** |
| Secret واقعی در git | **خیر** — `.env` در `.gitignore` |
| وابستگی قابل بازتولید | **بله** — lockfileها |
| راه‌اندازی یک‌فرمان | **بله** — `SETUP.*` |

هرگز `SECRET_KEY`، رمز DB تولید، یا کلید API شخص ثالث را commit نکنید. برای تولید از `docker-compose.prod.yml` و مقادیر قوی در `.env` استفاده کنید.

---

## مجوز

**Proprietary — Panah Platform**

Developed by **Investica Group**
