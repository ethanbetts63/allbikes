import os
import json
import shutil
from django.core.management.base import BaseCommand
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Organizes downloaded motorcycle images into a structured directory for the frontend.'

    def handle(self, *args, **kwargs):
        # --- Configuration ---
        motorcycle_details_file = 'data_management/data/archive/db_backups/2026-01-02/inventory.motorcycle.json'
        # We need the original motorcycle dump to get the main 'image' field
        original_motorcycle_file = 'old_archive/inventory.motorcycle.json'
        motorcycle_images_file = 'old_archive/inventory.motorcycleimage.json'
        source_media_dir = 'media_import'
        target_assets_dir = os.path.join('frontend', 'src', 'assets', 'motorcycle_images')

        self.stdout.write(self.style.SUCCESS("Starting image organization process..."))

        # --- 1. Load all data into memory ---
        try:
            with open(motorcycle_details_file, 'r', encoding='utf-8') as f:
                motorcycles_details = json.load(f)
            with open(original_motorcycle_file, 'r', encoding='utf-8') as f:
                original_motorcycles = json.load(f)
            with open(motorcycle_images_file, 'r', encoding='utf-8') as f:
                motorcycle_images = json.load(f)
        except FileNotFoundError as e:
            self.stderr.write(self.style.ERROR(f"Error: A required JSON file was not found. {e}"))
            return
        except json.JSONDecodeError as e:
            self.stderr.write(self.style.ERROR(f"Error: Could not decode JSON from a file. {e}"))
            return
            
        # --- 2. Create a comprehensive map of motorcycles and their images ---
        
        # Map pk to make, model, year
        motorcycle_map = {
            item['pk']: item['fields'] for item in motorcycles_details
        }
        
        # Map pk to a list of all associated image paths
        image_map = {}
        # Add main images from original dump
        for item in original_motorcycles:
            pk = item['pk']
            image_path = item.get('fields', {}).get('image')
            if pk not in image_map:
                image_map[pk] = []
            if image_path:
                image_map[pk].append(image_path)
                
        # Add additional images
        for item in motorcycle_images:
            pk = item.get('fields', {}).get('motorcycle')
            image_path = item.get('fields', {}).get('image')
            if pk is not None and pk not in image_map:
                image_map[pk] = []
            if pk is not None and image_path:
                image_map[pk].append(image_path)

        # --- 3. Iterate, create directories, and copy files ---
        os.makedirs(target_assets_dir, exist_ok=True)
        copied_count = 0
        skipped_count = 0

        for pk, details in motorcycle_map.items():
            make = details.get('make', 'unknown')
            model = details.get('model', 'unknown')
            year = details.get('year')
            
            # Create a clean directory name
            dir_name = slugify(f"{make}-{model}-{year}" if year else f"{make}-{model}")
            target_dir = os.path.join(target_assets_dir, dir_name)
            os.makedirs(target_dir, exist_ok=True)
            
            # Get the list of images for this motorcycle
            images_to_copy = image_map.get(pk, [])
            
            if not images_to_copy:
                self.stdout.write(self.style.WARNING(f"No images found for {dir_name} (PK: {pk})"))
                continue

            self.stdout.write(f"  - Organizing images for {dir_name}...")
            
            for image_path in images_to_copy:
                source_path = os.path.join(source_media_dir, image_path)
                file_name = os.path.basename(image_path)
                destination_path = os.path.join(target_dir, file_name)
                
                if os.path.exists(source_path):
                    try:
                        shutil.copy2(source_path, destination_path)
                        copied_count += 1
                    except Exception as e:
                        self.stderr.write(self.style.ERROR(f"    Could not copy {source_path}. Error: {e}"))
                        skipped_count += 1
                else:
                    self.stdout.write(self.style.WARNING(f"    Source file not found: {source_path}"))
                    skipped_count += 1

        self.stdout.write(self.style.SUCCESS(f"\nOrganization complete."))
        self.stdout.write(f"Successfully copied: {copied_count} images")
        self.stdout.write(f"Skipped (not found or error): {skipped_count} images")
