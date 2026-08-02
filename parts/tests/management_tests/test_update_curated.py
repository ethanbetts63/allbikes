from io import BytesIO

import pytest
from django.core.files.base import ContentFile
from django.core.management import call_command
from django.test import override_settings
from PIL import Image

from parts.tests.factories.parts_factories import PartSectionFactory


def _png_bytes(colour):
    image = Image.new("RGB", (4, 4), colour)
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


@pytest.mark.django_db
def test_update_curated_links_a_manually_saved_diagram_and_converts_it_to_webp(tmp_path):
    with override_settings(MEDIA_ROOT=tmp_path):
        section = PartSectionFactory(
            parts_model__model_code="AE05W6-RU",
            code="F06",
            diagram_source_hash="source-fingerprint",
        )
        section.diagram_image.save("source.png", ContentFile(_png_bytes("red")), save=False)
        section.save()

        curated_dir = tmp_path / "parts" / "curated-diagrams"
        curated_dir.mkdir(parents=True)
        source_path = curated_dir / "AE05W6-RU_F06.png"
        source_path.write_bytes(_png_bytes("blue"))

        call_command("update", "--curated")

        section.refresh_from_db()
        assert section.curated_diagram_image.name == "parts/curated-diagrams/AE05W6-RU_F06.webp"
        assert section.curated_source_hash == "source-fingerprint"
        assert section.display_diagram_image.name == section.curated_diagram_image.name
        assert not source_path.exists()
        assert (curated_dir / "AE05W6-RU_F06.webp").read_bytes()[:4] == b"RIFF"
