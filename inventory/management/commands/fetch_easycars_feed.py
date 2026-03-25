import ftplib
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

INBOX_DIR = Path(__file__).resolve().parents[3] / "inbox"
IMAGES_DIR = INBOX_DIR / "images"


class Command(BaseCommand):
    help = "Download the EasyCars FTP feed (CSV and/or images) into inventory/inbox"

    def add_arguments(self, parser):
        parser.add_argument("--csv", action="store_true", help="Download CSV files only")
        parser.add_argument("--images", action="store_true", help="Download images only")

    def handle(self, *args, **options):
        run_csv = options["csv"]
        run_images = options["images"]

        # If neither flag provided, run both
        if not run_csv and not run_images:
            run_csv = True
            run_images = True

        INBOX_DIR.mkdir(parents=True, exist_ok=True)
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)

        host = settings.FTP_HOST
        user = settings.FTP_USER
        password = settings.FTP_PASS
        folder = settings.FTP_FOLDER

        self.stdout.write(f"Connecting to {host}...")

        with ftplib.FTP(host) as ftp:
            ftp.login(user=user, passwd=password)
            ftp.cwd(folder)

            if run_csv:
                self._fetch_csv(ftp)

            if run_images:
                self._fetch_images(ftp)

    def _fetch_csv(self, ftp):
        files = ftp.nlst()
        csv_files = [f for f in files if f.lower().endswith(".csv")]

        if not csv_files:
            self.stderr.write("No CSV files found in remote folder.")
            return

        for filename in csv_files:
            local_path = INBOX_DIR / filename
            self.stdout.write(f"Downloading {filename}...")
            with open(local_path, "wb") as f:
                ftp.retrbinary(f"RETR {filename}", f.write)
            self.stdout.write(self.style.SUCCESS(f"Saved to {local_path}"))

    def _fetch_images(self, ftp):
        ftp.cwd("images")
        files = ftp.nlst()
        image_files = [f for f in files if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]

        if not image_files:
            self.stderr.write("No image files found in remote images folder.")
            return

        skipped = 0
        downloaded = 0

        for filename in image_files:
            local_path = IMAGES_DIR / filename
            if local_path.exists():
                skipped += 1
                continue
            self.stdout.write(f"Downloading {filename}...")
            with open(local_path, "wb") as f:
                ftp.retrbinary(f"RETR {filename}", f.write)
            downloaded += 1

        self.stdout.write(self.style.SUCCESS(f"Images: {downloaded} downloaded, {skipped} skipped (already exist)"))
