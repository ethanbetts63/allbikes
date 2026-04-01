import ftplib
import io
from contextlib import contextmanager
from pathlib import Path

from django.conf import settings


@contextmanager
def ftp_connection():
    ftp = ftplib.FTP(settings.FTP_HOST)
    ftp.login(user=settings.FTP_USER, passwd=settings.FTP_PASS)
    ftp.cwd(settings.FTP_FOLDER)
    try:
        yield ftp
    finally:
        ftp.quit()


def fetch_csv(ftp, stderr):
    csv_files = [f for f in ftp.nlst() if f.lower().endswith(".csv")]
    if not csv_files:
        stderr.write("No CSV files found in remote folder.")
        return None
    buf = io.BytesIO()
    ftp.retrbinary(f"RETR {csv_files[0]}", buf.write)
    return buf.getvalue().decode("utf-8-sig")


def fetch_images(ftp, stdout, stderr, stock_numbers, existing_images):
    media_dir = Path(settings.MEDIA_ROOT) / "motorcycles" / "additional"
    media_dir.mkdir(parents=True, exist_ok=True)

    ftp.cwd("images")
    all_files = ftp.nlst()
    image_files = [
        f for f in all_files
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
        and _stock_number_from_filename(f) in stock_numbers
    ]

    if not image_files:
        stderr.write("No matching image files found.")
        return

    skipped = downloaded = 0
    for filename in image_files:
        relative = f"motorcycles/additional/{filename}"
        if relative in existing_images:
            skipped += 1
            continue
        stdout.write(f"Downloading {filename}...")
        with open(media_dir / filename, "wb") as f:
            ftp.retrbinary(f"RETR {filename}", f.write)
        downloaded += 1

    stdout.write(f"Images: {downloaded} downloaded, {skipped} skipped")


def _stock_number_from_filename(filename):
    return filename.rsplit("_", 1)[0]
