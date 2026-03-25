import ftplib
from pathlib import Path

from django.conf import settings

INBOX_DIR = Path(__file__).resolve().parents[1] / "inbox"
IMAGES_DIR = INBOX_DIR / "images"


def fetch_csv(stdout, stderr):
    INBOX_DIR.mkdir(parents=True, exist_ok=True)
    ftp = _connect()
    with ftp:
        csv_files = [f for f in ftp.nlst() if f.lower().endswith(".csv")]
        if not csv_files:
            stderr.write("No CSV files found in remote folder.")
            return
        for filename in csv_files:
            stdout.write(f"Downloading {filename}...")
            with open(INBOX_DIR / filename, "wb") as f:
                ftp.retrbinary(f"RETR {filename}", f.write)


def fetch_images(stdout, stderr):
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    ftp = _connect()
    with ftp:
        ftp.cwd("images")
        image_files = [f for f in ftp.nlst() if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]
        if not image_files:
            stderr.write("No image files found in remote images folder.")
            return
        skipped = downloaded = 0
        for filename in image_files:
            if (IMAGES_DIR / filename).exists():
                skipped += 1
                continue
            stdout.write(f"Downloading {filename}...")
            with open(IMAGES_DIR / filename, "wb") as f:
                ftp.retrbinary(f"RETR {filename}", f.write)
            downloaded += 1
        stdout.write(f"Images: {downloaded} downloaded, {skipped} skipped")


def _connect():
    ftp = ftplib.FTP(settings.FTP_HOST)
    ftp.login(user=settings.FTP_USER, passwd=settings.FTP_PASS)
    ftp.cwd(settings.FTP_FOLDER)
    return ftp
