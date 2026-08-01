from io import BytesIO

import pytest
from django.core.files.base import ContentFile
from django.core.management import call_command
from django.test import override_settings
from PIL import Image

from parts.models import PartSection
from parts.tests.factories.parts_factories import PartSectionFactory


def _png_bytes(colour):
    image = Image.new("RGB", (4, 4), colour)
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


@pytest.mark.django_db
def test_converts_referenced_source_and_curated_diagrams(tmp_path):
    with override_settings(MEDIA_ROOT=tmp_path):
        section = PartSectionFactory()
        section.diagram_image.save("source.png", ContentFile(_png_bytes("red")), save=False)
        section.curated_diagram_image.save("curated.png", ContentFile(_png_bytes("blue")), save=False)
        section.save()
        source_name = section.diagram_image.name
        curated_name = section.curated_diagram_image.name

        call_command("convert_parts_diagrams_webp")

        section.refresh_from_db()
        assert section.diagram_image.name.endswith(".webp")
        assert section.curated_diagram_image.name.endswith(".webp")
        with section.diagram_image.open("rb") as image:
            assert image.read(4) == b"RIFF"
        with section.curated_diagram_image.open("rb") as image:
            assert image.read(4) == b"RIFF"
        storage = PartSection._meta.get_field("diagram_image").storage
        assert not storage.exists(source_name)
        assert not storage.exists(curated_name)


@pytest.mark.django_db
def test_dry_run_and_curated_only_leave_source_untouched(tmp_path):
    with override_settings(MEDIA_ROOT=tmp_path):
        section = PartSectionFactory()
        section.diagram_image.save("source.png", ContentFile(_png_bytes("red")), save=False)
        section.curated_diagram_image.save("curated.png", ContentFile(_png_bytes("blue")), save=False)
        section.save()

        call_command("convert_parts_diagrams_webp", "--dry-run", "--curated-only")
        section.refresh_from_db()
        assert section.diagram_image.name.endswith(".png")
        assert section.curated_diagram_image.name.endswith(".png")

        call_command("convert_parts_diagrams_webp", "--curated-only")
        section.refresh_from_db()
        assert section.diagram_image.name.endswith(".png")
        assert section.curated_diagram_image.name.endswith(".webp")
