from django.core.management.base import BaseCommand
from data_management.utils.archive_db.load_db_from_archive import load_db_from_latest_archive

class Command(BaseCommand):
    help = 'Updates the application state. Use flags to specify what to update.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--archive',
            action='store_true',
            help='Loads the database from the latest archive, overwriting current data.',
        )

    def handle(self, *args, **options):
        if options['archive']:
            # A final, explicit confirmation from the user in the console
            confirm = input("This is a destructive action and will wipe your database. Are you sure you want to continue? (yes/no): ")
            if confirm.lower() == 'yes':
                self.stdout.write(self.style.SUCCESS('Starting database load from archive...'))
                load_db_from_latest_archive(command=self)
            else:
                self.stdout.write(self.style.WARNING('Database load cancelled.'))
        else:
            self.stdout.write(self.style.WARNING('No update flag specified. Please use --archive or other available options.'))
