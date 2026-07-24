import io
import re

import pytest
from PIL import Image

from parts.ingestion.escher_images import extract_diagrams
from parts.tests.ingestion_tests.sample_files import SAMPLE_XLS

pytestmark = pytest.mark.skipif(not SAMPLE_XLS.exists(), reason="sample .xls not present")


@pytest.fixture(scope="module")
def diagrams():
    return extract_diagrams(str(SAMPLE_XLS))


def test_every_ef_section_has_a_diagram(diagrams):
    sections = [name for name in diagrams if re.match(r"^[EF]\d\d$", name)]
    # Sample book: 14 engine (E01-E14) + 23 frame (F01-F23) = 37 sections.
    assert len(sections) == 37


def test_diagrams_are_valid_images_of_plausible_size(diagrams):
    im = Image.open(io.BytesIO(diagrams["E01"]))
    im.load()
    assert im.format in ("JPEG", "PNG")
    w, h = im.size
    assert w >= 300 and h >= 200


def test_e01_diagram_is_the_largest_referenced_blip(diagrams):
    # E01 (Shroud Assy) should map to a substantial line-art diagram, not a
    # tiny overlaid thumbnail.
    im = Image.open(io.BytesIO(diagrams["E01"]))
    assert im.size[0] * im.size[1] > 150_000
