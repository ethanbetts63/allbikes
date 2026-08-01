from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from PIL import Image

from parts.ingestion.diagram_images import diagram_webp_from_image
from parts.models import PartSection


class Command(BaseCommand):
    help = "Create a reviewed display crop for one imported SYM diagram."

    def add_arguments(self, parser):
        parser.add_argument("model_code")
        parser.add_argument("section_code")
        parser.add_argument(
            "--box",
            nargs=4,
            type=int,
            metavar=("LEFT", "TOP", "RIGHT", "BOTTOM"),
            required=True,
        )

    def handle(self, *args, **options):
        section = PartSection.objects.select_related("parts_model").filter(
            parts_model__model_code__iexact=options["model_code"],
            code__iexact=options["section_code"],
        ).first()
        if section is None:
            raise CommandError("No matching model section.")
        if not section.diagram_image or not section.diagram_source_hash:
            raise CommandError("This section has no source diagram fingerprint. Re-import its book first.")

        left, top, right, bottom = options["box"]
        with section.diagram_image.open("rb") as source:
            image = Image.open(source)
            image.load()
        if not (0 <= left < right <= image.width and 0 <= top < bottom <= image.height):
            raise CommandError(f"Crop box must fit within {image.width}x{image.height}.")

        crop = image.crop((left, top, right, bottom))
        old_name = section.curated_diagram_image.name if section.curated_diagram_image else ""
        section.curated_diagram_image.save(
            f"{section.parts_model.model_code}_{section.code}.webp",
            ContentFile(diagram_webp_from_image(crop, source_format="PNG")),
            save=False,
        )
        section.curated_source_hash = section.diagram_source_hash
        section.save(update_fields=["curated_diagram_image", "curated_source_hash"])
        if old_name and old_name != section.curated_diagram_image.name:
            section.curated_diagram_image.storage.delete(old_name)
        self.stdout.write(self.style.SUCCESS(f"Saved curated crop for {section.parts_model.model_code} {section.code}."))
