import os
import requests
import json
from django.core.management.base import BaseCommand
from urllib.parse import urljoin

class Command(BaseCommand):
    help = 'Downloads motorcycle images from the old Scooter Shop website.'

    BASE_URL = 'https://www.allbikesvespawarehouse.com.au/'
    MEDIA_URL_PREFIX = '/media/'
    MOTORCYCLE_JSON = 'old_archive/inventory.motorcycle.json'
    MOTORCYCLE_IMAGE_JSON = 'old_archive/inventory.motorcycleimage.json'
    OUTPUT_DIR = 'media_import'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Starting image download process..."))
        
        image_paths = self._get_image_paths()
        if not image_paths:
            self.stdout.write(self.style.WARNING("No image paths found in the JSON files."))
            return

        self.stdout.write(f"Found {len(image_paths)} unique images to download.")
        
        # Ensure the base output directory exists
        os.makedirs(self.OUTPUT_DIR, exist_ok=True)
        
        downloaded_count = 0
        failed_count = 0

        for image_path in image_paths:
            if not image_path:
                continue

            # Construct the full URL
            full_url = urljoin(self.BASE_URL, self.MEDIA_URL_PREFIX + image_path)
            
            # Construct the destination path
            destination_path = os.path.join(self.OUTPUT_DIR, image_path)
            
            # Ensure the destination directory exists
            os.makedirs(os.path.dirname(destination_path), exist_ok=True)

            self.stdout.write(f"  - Downloading {full_url}...")
            
            try:
                response = requests.get(full_url, stream=True, timeout=10)
                response.raise_for_status()

                with open(destination_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                self.stdout.write(self.style.SUCCESS(f"    Saved to {destination_path}"))
                downloaded_count += 1

            except requests.exceptions.RequestException as e:
                self.stderr.write(self.style.ERROR(f"    Failed to download {full_url}. Error: {e}"))
                failed_count += 1

        self.stdout.write(self.style.SUCCESS(f"\nDownload complete."))
        self.stdout.write(f"Successfully downloaded: {downloaded_count}")
        self.stdout.write(f"Failed to download: {failed_count}")

    def _get_image_paths(self):
        image_paths = set()

        # Extract from motorcycle.json
        try:
            with open(self.MOTORCYCLE_JSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for item in data:
                    image_path = item.get('fields', {}).get('image')
                    if image_path:
                        image_paths.add(image_path)
        except FileNotFoundError:
            self.stderr.write(self.style.WARNING(f"File not found: {self.MOTORCYCLE_JSON}"))
        except json.JSONDecodeError:
            self.stderr.write(self.style.ERROR(f"Error decoding JSON from {self.MOTORCYCLE_JSON}."))

        # Extract from motorcycleimage.json
        try:
            with open(self.MOTORCYCLE_IMAGE_JSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for item in data:
                    image_path = item.get('fields', {}).get('image')
                    if image_path:
                        image_paths.add(image_path)
        except FileNotFoundError:
            self.stderr.write(self.style.WARNING(f"File not found: {self.MOTORCYCLE_IMAGE_JSON}"))
        except json.JSONDecodeError:
            self.stderr.write(self.style.ERROR(f"Error decoding JSON from {self.MOTORCYCLE_IMAGE_JSON}."))

        return image_paths
