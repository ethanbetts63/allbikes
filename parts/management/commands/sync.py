from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = (
        'Run the full catalogue refresh in order: scrape --parts, scrape --prices, '
        'update --parts, update --prices. Intended for a single cron entry.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Queue data already present in the archive.')
        parser.add_argument('--parts-url', help='Override the Select Portal source page URL for --parts.')
        parser.add_argument('--prices-url', help='Override the Select Portal source page URL for --prices.')

    def handle(self, *args, **options):
        scrape_ok = {}
        failures = []

        for target in ('parts', 'prices'):
            label = f'scrape --{target}'
            scrape_options = {target: True, 'force': options['force']}
            url = options.get(f'{target}_url')
            if url:
                scrape_options['url'] = url
            scrape_ok[target] = self._run('scrape', label, scrape_options, failures)

        for target in ('parts', 'prices'):
            label = f'update --{target}'
            if not scrape_ok[target]:
                self.stdout.write(self.style.WARNING(f'Skipping {label}: its scrape step failed.'))
                continue
            self._run('update', label, {target: True}, failures)

        if failures:
            raise CommandError('Sync finished with failures: ' + ', '.join(failures))

        self.stdout.write(self.style.SUCCESS('Sync complete.'))

    def _run(self, command, label, command_options, failures):
        self.stdout.write(self.style.MIGRATE_HEADING(f'==> {label}'))
        try:
            call_command(command, stdout=self.stdout, stderr=self.stderr, **command_options)
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f'{label} failed: {exc}'))
            failures.append(label)
            return False
        return True
