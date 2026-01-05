from django.core.management.base import BaseCommand
from inventory.models import Motorcycle

class Command(BaseCommand):
    help = 'Ensures all existing Motorcycle objects have a slug.'

    def handle(self, *args, **options):
        self.stdout.write('Starting to backfill slugs for all motorcycles...')
        
        motorcycles_without_slug = Motorcycle.objects.filter(slug__isnull=True)
        total_to_process = motorcycles_without_slug.count()

        if total_to_process == 0:
            self.stdout.write(self.style.SUCCESS('All motorcycles already have slugs. No action needed.'))
            return

        self.stdout.write(f'Found {total_to_process} motorcycles without a slug. Processing...')
        
        updated_count = 0
        for motorcycle in motorcycles_without_slug:
            # The custom save() method automatically generates and saves the slug.
            motorcycle.save()
            updated_count += 1
            self.stdout.write(f'  - Saved slug for: {motorcycle}')

        self.stdout.write(self.style.SUCCESS(f'Successfully updated {updated_count} motorcycles.'))
