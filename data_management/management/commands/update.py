from django.core.management.base import BaseCommand
from data_management.utils.archive_db.load_db_from_archive import load_db_from_latest_archive
from parts.management.utils import update_curated, update_parts, update_prices

class Command(BaseCommand):
    help = 'Updates the application state. Use flags to specify what to update.'

    def add_arguments(self, parser):
        target = parser.add_mutually_exclusive_group()
        target.add_argument('--parts', action='store_true', help='Update SYM model books and fitments.')
        target.add_argument('--prices', action='store_true', help='Update parts prices and availability.')
        target.add_argument(
            '--curated',
            action='store_true',
            help='Link manually curated diagram files to their matching SYM parts sections.',
        )
        parser.add_argument(
            '--archive',
            action='store_true',
            help=(
                'With --parts/--prices, use the newest catalogue archive. '
                'Without a target, restore the entire database archive.'
            ),
        )

    def handle(self, *args, **options):
        if options['parts']:
            update_parts.run(
                stdout=self.stdout,
                stderr=self.stderr,
                archive=options['archive'],
            )
        elif options['prices']:
            update_prices.run(stdout=self.stdout, archive=options['archive'])
        elif options['curated']:
            update_curated.run(stdout=self.stdout, stderr=self.stderr)
        elif options['archive']:
            # A final, explicit confirmation from the user in the console
            confirm = input("This is a destructive action and will wipe your database. Are you sure you want to continue? (yes/no): ")
            if confirm.lower() == 'yes':
                self.stdout.write(self.style.SUCCESS('Starting database load from archive...'))
                load_db_from_latest_archive(command=self)
            else:
                self.stdout.write(self.style.WARNING('Database load cancelled.'))
        else:
            self.stdout.write(self.style.WARNING(
                'No update flag specified. Use --parts, --prices, --curated, or standalone --archive.'
            ))
