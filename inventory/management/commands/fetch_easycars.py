from django.core.management.base import BaseCommand

from ...utils.ftp_download import fetch_csv, fetch_images
from ...utils.csv_reader import parse_feed
from ...utils.db_importer import import_bikes


class Command(BaseCommand):
    help = "Download and import the EasyCars FTP feed into the database"

    def handle(self, *args, **options):
        self.stdout.write("--- Fetching CSV ---")
        fetch_csv(self.stdout, self.stderr)

        self.stdout.write("--- Importing into database ---")
        bikes = parse_feed()
        import_bikes(self.stdout, bikes)

        self.stdout.write("--- Fetching images ---")
        fetch_images(self.stdout, self.stderr)
