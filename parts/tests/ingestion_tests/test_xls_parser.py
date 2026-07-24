import pytest

from parts.ingestion.xls_parser import parse_book
from parts.tests.ingestion_tests.sample_files import SAMPLE_XLS

pytestmark = pytest.mark.skipif(not SAMPLE_XLS.exists(), reason="sample .xls not present")


@pytest.fixture(scope="module")
def parsed():
    return parse_book(str(SAMPLE_XLS))


def test_model_code(parsed):
    assert parsed["model_code"] == "AX15W2-6"


def test_section_count(parsed):
    # 14 engine (E01-E14) + 23 frame (F01-F23) = 37.
    assert len(parsed["sections"]) == 37


def test_e01_shroud_section(parsed):
    e01 = next(s for s in parsed["sections"] if s["code"] == "E01")
    assert e01["group"] == "engine"
    assert "SHROUD" in e01["name"].upper()
    assert e01["diagram_bytes"] is not None
    part_numbers = {p["part_number"] for p in e01["parts"]}
    assert "1961A-F6A-000" in part_numbers  # Fan Cover Assy, callout 1


def test_e01_dated_variant_parsed(parsed):
    e01 = next(s for s in parsed["sections"] if s["code"] == "E01")
    dated = [p for p in e01["parts"] if p["effective_date"] is not None]
    assert dated, "expected at least one running-change (dated) part in E01"


def test_f05_colour_variants(parsed):
    f05 = next(s for s in parsed["sections"] if s["code"] == "F05")
    colour_variants = [p for p in f05["parts"] if p["colour_suffix"]]
    assert len(colour_variants) >= 10
    reds = [p for p in colour_variants if p["colour_name"] == "Red"]
    assert reds, "expected a red variant with a resolved colour name"
    assert all(p["base_part_number"] == "53205-ALA-000" for p in colour_variants)
