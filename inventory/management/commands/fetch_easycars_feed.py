import ftplib
import os
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

INBOX_DIR = Path(__file__).resolve().parents[3] / "inbox"


class Command(BaseCommand):
    help = "Download the latest CSV from the EasyCars FTP feed into inventory/inbox"

    def handle(self, *args, **options):
        INBOX_DIR.mkdir(parents=True, exist_ok=True)

        host = settings.FTP_HOST
        user = settings.FTP_USER
        password = settings.FTP_PASS
        folder = settings.FTP_FOLDER

        self.stdout.write(f"Connecting to {host}...")

        with ftplib.FTP(host) as ftp:
            ftp.login(user=user, passwd=password)
            ftp.cwd(folder)

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
