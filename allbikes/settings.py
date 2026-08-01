from pathlib import Path
from datetime import timedelta
import os
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

MECHANICDESK_BOOKING_TOKEN = os.environ.get("MECHANICDESK_BOOKING_TOKEN")


STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

MAILGUN_API_KEY = os.environ.get("MAILGUN_API_KEY")
MAILGUN_DOMAIN = os.environ.get("MAILGUN_DOMAIN")
MAILGUN_WEBHOOK_SIGNING_KEY = os.environ.get("MAILGUN_WEBHOOK_SIGNING_KEY")


def _email_list(value):
    if not value:
        return []
    return [email.strip() for email in value.split(",") if email.strip()]


ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
ADMIN_EMAILS = _email_list(os.environ.get("ADMIN_EMAILS")) or _email_list(ADMIN_EMAIL)


def _phone_list(value):
    if not value:
        return []
    return [phone.strip() for phone in value.split(",") if phone.strip()]


ADMIN_NUMBER = os.environ.get("ADMIN_NUMBER")
ADMIN_NUMBERS = _phone_list(os.environ.get("ADMIN_NUMBERS")) or _phone_list(ADMIN_NUMBER)
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "noreply@scootershop.com.au")

# Select Portal supplies an RRP+GST figure. This is the percentage discount
# ScooterShop receives from that figure when purchasing genuine new SYM parts.
PARTS_SUPPLIER_DISCOUNT_PERCENTAGE = os.environ.get(
    "PARTS_SUPPLIER_DISCOUNT_PERCENTAGE", "30.00"
)

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_MESSAGING_SERVICE_SID = os.environ.get("TWILIO_MESSAGING_SERVICE_SID")

SECRET_KEY = os.environ.get("SECRET_KEY")

DEBUG = os.getenv('DEBUG') == 'True'

if not DEBUG:
    required_production_secrets = {
        'SECRET_KEY': SECRET_KEY,
        'STRIPE_SECRET_KEY': STRIPE_SECRET_KEY,
        'STRIPE_WEBHOOK_SECRET': STRIPE_WEBHOOK_SECRET,
    }
    missing_production_secrets = [
        name for name, value in required_production_secrets.items() if not value
    ]
    if missing_production_secrets:
        raise ImproperlyConfigured(
            'Missing required production secrets: '
            + ', '.join(missing_production_secrets)
        )

ALLOWED_HOSTS = [
    'api.scootershop.com.au',
    'www.scootershop.com.au',
    '127.0.0.1',
    'localhost',
]

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'https://www.scootershop.com.au',
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://www.scootershop.com.au',
]
CORS_ALLOW_CREDENTIALS = True

# Production TLS/cookie hardening. Gated on DEBUG so local dev over plain HTTP
# still works. HTTP->HTTPS redirect itself is handled by PythonAnywhere's
# "Force HTTPS" toggle, so SECURE_SSL_REDIRECT is intentionally left off.
if not DEBUG:
    # PythonAnywhere terminates TLS and forwards the original scheme here, so
    # Django can tell a request was HTTPS (needed for HSTS and Secure cookies).
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 63072000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "data_management",
    "inventory",
    "service",
    "product",
    "payments",
    "notifications",
    "hire",
    "parts",
    "imagekit",
]

SITE_ID = 1

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "allbikes.middleware.NoCacheApiMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.http.ConditionalGetMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "allbikes.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "allbikes.wsgi.application"

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'allbikes_db'),
        'USER': os.environ.get('DB_USER', 'root'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '3306'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Australia/Perth"

USE_I18N = True

USE_TZ = True

STATIC_URL = "/static/"
STATICFILES_DIRS = []
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files (user-uploaded files)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'mediafiles')

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'TIMEOUT': 900,  # 15 minutes
        'OPTIONS': {
            'MAX_ENTRIES': 500
        }
    }
}

# Cookie names for JWT tokens
AUTH_COOKIE = 'access_token'
AUTH_COOKIE_REFRESH = 'refresh_token'

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,
}

# Django Rest Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'data_management.authentication.CookieJWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '250/day',
        'user': '10000/day',
        'login': '5/minute',
    }
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'plain': {
            'format': '[{levelname}] {asctime} {name}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'plain',
            'level': 'INFO',
        },
    },
    'loggers': {
        'data_management': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'service': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'notifications': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'parts': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
