import json
from django.core.management.base import BaseCommand
import os

class Command(BaseCommand):
    help = 'Cleans the exported motorcycle JSON data to match the new model structure.'

    def handle(self, *args, **kwargs):
        input_file_path = os.path.join('old_archive', 'inventory.motorcycle.json')
        output_file_path = os.path.join('old_archive', 'inventory.motorcycle.cleaned.json')
        
        fields_to_remove = [
            'title', 
            'quantity', 
            'vin_number', 
            'engine_number', 
            'image',
            'is_available', 
            'colors', 
            'special_text', 
            'on_special'
        ]

        self.stdout.write(f"Reading data from {input_file_path}...")

        try:
            with open(input_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"Input file not found: {input_file_path}"))
            return
        except json.JSONDecodeError:
            self.stderr.write(self.style.ERROR(f"Error decoding JSON from {input_file_path}. The file might be malformed."))
            return

        cleaned_data = []
        for item in data:
            fields = item.get('fields', {})

            # Rename 'brand' to 'make'
            if 'brand' in fields:
                fields['make'] = fields.pop('brand')

            # Remove obsolete fields
            for field in fields_to_remove:
                if field in fields:
                    del fields[field]
            
            # The model name should be 'inventory.motorcycle' which is what dumpdata produces
            # and what loaddata expects. We will ensure it is correct.
            item['model'] = 'inventory.motorcycle'
            
            cleaned_data.append(item)

        self.stdout.write(f"Writing cleaned data to {output_file_path}...")

        # Ensure the directory exists
        os.makedirs(os.path.dirname(output_file_path), exist_ok=True)

        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, indent=2)

        self.stdout.write(self.style.SUCCESS(f"Cleaning complete. Cleaned file saved as {output_file_path}"))
