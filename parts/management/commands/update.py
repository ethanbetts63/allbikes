from django.core.management.base import BaseCommand

from parts.management.utils import update_parts, update_prices


class Command(BaseCommand):
    help = 'Update the parts catalogue from its inbox or most recent archives.'

    def add_arguments(self, parser):
        source = parser.add_mutually_exclusive_group(required=True)
        source.add_argument('--parts', action='store_true', help='Update model books and fitments.')
        source.add_argument('--prices', action='store_true', help='Update prices and availability.')
        parser.add_argument(
            '--archive',
            action='store_true',
            help='Use the newest archived source instead of consuming the inbox.',
        )

    def handle(self, *args, **options):
        if options['parts']:
            return update_parts.run(
                stdout=self.stdout,
                stderr=self.stderr,
                archive=options['archive'],
            )
        return update_prices.run(stdout=self.stdout, archive=options['archive'])
