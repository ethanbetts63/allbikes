from pathlib import Path

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from parts.ingestion.diagram_images import diagram_webp_bytes
from parts.models import PartSection


class Command(BaseCommand):
    help = "Convert database-referenced SYM source and curated diagrams to WebP."

    def add_arguments(self, parser):
        target = parser.add_mutually_exclusive_group()
        target.add_argument(
            "--source-only",
            action="store_true",
            help="Convert only imported source diagrams.",
        )
        target.add_argument(
            "--curated-only",
            action="store_true",
            help="Convert only reviewed curated diagrams.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report how many files would be converted without changing storage or database records.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        field_names = ("diagram_image", "curated_diagram_image")
        if options["source_only"]:
            field_names = ("diagram_image",)
        elif options["curated_only"]:
            field_names = ("curated_diagram_image",)
        converted = 0
        already_webp = 0
        missing = 0

        for section in PartSection.objects.iterator():
            changed_fields = []
            old_files = []
            for field_name in field_names:
                image = getattr(section, field_name)
                if not image:
                    continue
                if image.name.lower().endswith(".webp"):
                    already_webp += 1
                    continue
                if dry_run:
                    converted += 1
                    continue
                try:
                    with image.open("rb") as source:
                        webp = diagram_webp_bytes(source.read())
                except FileNotFoundError:
                    missing += 1
                    self.stderr.write(f"Missing {field_name} for section {section.id}: {image.name}")
                    continue

                converted += 1

                old_name = image.name
                image.save(
                    f"{Path(image.name).stem}.webp",
                    ContentFile(webp),
                    save=False,
                )
                old_files.append((image.storage, old_name, image.name))
                changed_fields.append(field_name)

            if changed_fields and not dry_run:
                section.save(update_fields=changed_fields)
                for storage, old_name, new_name in old_files:
                    if old_name != new_name:
                        storage.delete(old_name)

        action = "Would convert" if dry_run else "Converted"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action} {converted} diagram files; {already_webp} already WebP; {missing} missing."
            )
        )
