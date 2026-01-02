from django.core.management.base import BaseCommand
from data_management.utils.generation_utils.faq_generator import FaqUpdateOrchestrator
from data_management.utils.generation_utils.tier_generator import TierUpdateOrchestrator
from data_management.utils.generation_utils.terms_generator import TermsUpdateOrchestrator
from data_management.utils.archive_db.database_archiver import DatabaseArchiver

class Command(BaseCommand):
    help = 'Generates data for the application. Use flags to specify what to generate.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--faqs',
            action='store_true',
            help='Generate FAQs from the JSONL data file.',
        )
        parser.add_argument(
            '--tiers',
            action='store_true',
            help='Generate Tiers and Prices from the tiers.jsonl data file.',
        )
        parser.add_argument(
            '--terms',
            action='store_true',
            help='Generate Terms and Conditions from HTML data files.',
        )
        parser.add_argument(
            '--archive',
            action='store_true',
            help='Archive the current database state to JSON files.',
        )

    def handle(self, *args, **options):
        something_generated = False
        if options['faqs']:
            something_generated = True
            self.stdout.write(self.style.SUCCESS('Starting FAQ generation...'))
            orchestrator = FaqUpdateOrchestrator(command=self)
            orchestrator.run()

        if options['tiers']:
            something_generated = True
            self.stdout.write(self.style.SUCCESS('Starting Tier and Price generation...'))
            orchestrator = TierUpdateOrchestrator(command=self)
            orchestrator.run()

        if options['terms']:
            something_generated = True
            self.stdout.write(self.style.SUCCESS('Starting Terms and Conditions generation...'))
            orchestrator = TermsUpdateOrchestrator(command=self)
            orchestrator.run()
        
        if options['archive']:
            something_generated = True
            self.stdout.write(self.style.SUCCESS('Starting database archive...'))
            archiver = DatabaseArchiver(command=self)
            archiver.run()

        if not something_generated:
            self.stdout.write(self.style.WARNING(
                'No generation flag specified. Please use --faqs, --tiers, or other available options.'
            ))
