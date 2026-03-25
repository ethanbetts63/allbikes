import ftplib
from pathlib import Path

from django.conf import settings


INBOX_DIR = Path(__file__).resolve().parents[1] / "inbox"
IMAGES_DIR = INBOX_DIR / "images"


def fetch_csv(stdout, stderr):
    ftp = _connect()
    with ftp:
        files = ftp.nlst()
        csv_files = [f for f in files if f.lower().endswith(".csv")]

        if not csv_files:
            stderr.write("No CSV files found in remote folder.")
            return

        for filename in csv_files:
            local_path = INBOX_DIR / filename
            stdout.write(f"Downloading {filename}...")
            with open(local_path, "wb") as f:
                ftp.retrbinary(f"RETR {filename}", f.write)
            stdout.write(f"Saved to {local_path}")


def fetch_images(stdout, stderr):
    ftp = _connect()
    with ftp:
        ftp.cwd("images")
        files = ftp.nlst()
        image_files = [f for f in files if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]

        if not image_files:
            stderr.write("No image files found in remote images folder.")
            return

        skipped = 0
        downloaded = 0

        for filename in image_files:
            local_path = IMAGES_DIR / filename
            if local_path.exists():
                skipped += 1
                continue
            stdout.write(f"Downloading {filename}...")
            with open(local_path, "wb") as f:
                ftp.retrbinary(f"RETR {filename}", f.write)
            downloaded += 1

        stdout.write(f"Images: {downloaded} downloaded, {skipped} skipped (already exist)")


def _connect():
    ftp = ftplib.FTP(settings.FTP_HOST)
    ftp.login(user=settings.FTP_USER, passwd=settings.FTP_PASS)
    ftp.cwd(settings.FTP_FOLDER)
    return ftp
