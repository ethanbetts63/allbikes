import json
from django.conf import settings
from data_management.models import Brand

class BrandUpdateOrchestrator:
    def __init__(self, command):
        self.command = command

    def run(self):
        brand_file_path = settings.BASE_DIR / 'data_management' / 'data' / 'brands.jsonl'
        self.command.stdout.write(f"Importing Brands from {brand_file_path}...")

        with open(brand_file_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    brand, created = Brand.objects.update_or_create(
                        name=data['name'],
                        defaults={
                            'serviceable': data['serviceable']
                        }
                    )
                    if created:
                        self.command.stdout.write(self.command.style.SUCCESS(f"Created brand: {brand.name}"))
                    else:
                        self.command.stdout.write(self.command.style.WARNING(f"Updated brand: {brand.name}"))
                except json.JSONDecodeError:
                    self.command.stderr.write(self.command.style.ERROR(f"Skipping invalid line: {line.strip()}"))
                except KeyError as e:
                    self.command.stderr.write(self.command.style.ERROR(f"Skipping line with missing key {e}: {line.strip()}"))

        self.command.stdout.write(self.command.style.SUCCESS("Brand import complete."))
