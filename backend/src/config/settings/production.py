import os

from .base import *  # noqa: F403

DEBUG = False

# ─── Security ────────────────────────────────────────────────────────────────
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = os.environ.get("SECURE_SSL_REDIRECT", "1") == "1"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", 31536000))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ─── Static Files (WhiteNoise) ────────────────────────────────────────────────
# WhiteNoise serves static files directly from gunicorn — no nginx needed on Railway.
# Insert after SecurityMiddleware (index 1) to enable compression & caching.
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")  # noqa: F405
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
STATIC_ROOT = BASE_DIR.parent / "staticfiles"  # noqa: F405

# ─── Database (Railway provides DATABASE_URL) ─────────────────────────────────
# Railway injects DATABASE_URL automatically; parse it if present.
_db_url = os.environ.get("DATABASE_URL")
if _db_url:
    import urllib.parse

    _parsed = urllib.parse.urlparse(_db_url)
    DATABASES = {  # noqa: F405
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": _parsed.path.lstrip("/"),
            "USER": _parsed.username,
            "PASSWORD": _parsed.password,
            "HOST": _parsed.hostname,
            "PORT": str(_parsed.port or 5432),
            "CONN_MAX_AGE": 60,
            "OPTIONS": {"connect_timeout": 10},
        }
    }

# ─── CORS — allow Vercel frontend ────────────────────────────────────────────
# Add the Vercel deployment URL to allowed origins via env var.
# Example: CORS_ALLOWED_ORIGINS=https://panah.vercel.app,https://panah-staging.vercel.app
_extra_cors = [
    o.strip()
    for o in os.environ.get("CORS_ALLOWED_ORIGINS_EXTRA", "").split(",")
    if o.strip()
]
if _extra_cors:
    CORS_ALLOWED_ORIGINS = list(CORS_ALLOWED_ORIGINS) + _extra_cors  # noqa: F405

# ─── REST Framework ───────────────────────────────────────────────────────────
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
]
