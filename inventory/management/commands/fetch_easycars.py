from django.core.management.base import BaseCommand

from ...utils.ftp_download import fetch_csv, fetch_images
from ...utils.csv_reader import parse_feed
from ...utils.db_importer import import_bikes, link_images, get_existing_image_paths


class Command(BaseCommand):
    help = "Download and import the EasyCars FTP feed into the database"

    def handle(self, *args, **options):
        self.stdout.write("--- Fetching CSV ---")
        csv_text = fetch_csv(self.stderr)
        if not csv_text:
            return

        self.stdout.write("--- Importing bikes ---")
        bikes = parse_feed(csv_text)
        import_bikes(self.stdout, bikes)

        self.stdout.write("--- Fetching images ---")
        stock_numbers = {b["stock_number"] for b in bikes if b.get("stock_number")}
        existing = get_existing_image_paths()
        fetch_images(self.stdout, self.stderr, stock_numbers, existing)

        self.stdout.write("--- Linking images ---")
        link_images(self.stdout, bikes)

        self.stdout.write(self.style.SUCCESS("Done."))
