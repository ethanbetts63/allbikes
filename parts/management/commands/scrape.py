from django.core.management.base import BaseCommand, CommandError

from parts.management.utils import scrape_parts, scrape_prices


class Command(BaseCommand):
    help = 'Scrape SYM model books or pricing into the parts archive and inbox.'

    def add_arguments(self, parser):
        source = parser.add_mutually_exclusive_group(required=True)
        source.add_argument('--parts', action='store_true', help='Scrape SYM model books.')
        source.add_argument('--prices', action='store_true', help='Scrape Price & Availability.')
        parser.add_argument('--url', help='Override the Select Portal source page URL.')
        parser.add_argument('--force', action='store_true', help='Queue data already present in the archive.')

    def handle(self, *args, **options):
        try:
            if options['parts']:
                scrape_parts.run(
                    stdout=self.stdout,
                    stderr=self.stderr,
                    url=options.get('url'),
                    force=options['force'],
                )
            else:
                scrape_prices.run(
                    stdout=self.stdout,
                    url=options.get('url'),
                    force=options['force'],
                )
        except RuntimeError as exc:
            raise CommandError(str(exc)) from exc
