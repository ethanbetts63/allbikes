from django.core.management.base import BaseCommand

from ...utils.ftp_download import fetch_csv, fetch_images
from ...utils.csv_reader import parse_feed
from ...utils.db_importer import import_bikes


class Command(BaseCommand):
    help = "Download and import the EasyCars FTP feed into the database"

    def add_arguments(self, parser):
        parser.add_argument("--csv", action="store_true", help="Download and import CSV only")
        parser.add_argument("--images", action="store_true", help="Download and import images only")

    def handle(self, *args, **options):
        run_csv = options["csv"]
        run_images = options["images"]

        if not run_csv and not run_images:
            run_csv = True
            run_images = True

        if run_csv:
            self.stdout.write("--- Fetching CSV ---")
            fetch_csv(self.stdout, self.stderr)
            self.stdout.write("--- Importing into database ---")
            bikes = parse_feed()
            import_bikes(self.stdout, bikes)

        if run_images:
            self.stdout.write("--- Fetching images ---")
            fetch_images(self.stdout, self.stderr)
