import pytest

from parts.overlap import MINIMUM_PARTS, equivalent_sections_for
from parts.tests.factories import (
    PartFactory,
    PartSectionFactory,
    PartsModelFactory,
    SectionPartFactory,
)

pytestmark = pytest.mark.django_db


def build(model, code, parts):
    section = PartSectionFactory(parts_model=model, code=code)
    for index, part in enumerate(parts):
        SectionPartFactory(section=section, part=part, ref_number=str(index + 1))
    return section


@pytest.fixture
def parts():
    return [PartFactory(part_number=f"1000{n}-AAA-000") for n in range(6)]


def test_a_section_with_the_same_parts_elsewhere_is_reported(parts):
    mine = PartsModelFactory(model_code="AV12W-8", slug="orbit-125")
    other = PartsModelFactory(name="Classic 125", model_code="AW12W-6", slug="classic-125")
    section = build(mine, "E06", parts[:4])
    build(other, "E06", parts[:4])

    [match] = equivalent_sections_for([section])[section.id]

    assert match["model_code"] == "AW12W-6"
    assert match["section_code"] == "E06"
    assert match["model_name"] == "Classic 125"


def test_a_section_wholly_inside_a_bigger_one_is_not_reported(parts):
    # The two diagrams are not interchangeable - the larger one carries parts
    # this bike does not use - so offering it would invite an order from the
    # wrong book.
    mine = PartsModelFactory(model_code="AV12W-8", slug="orbit-125")
    other = PartsModelFactory(model_code="AV05W-8", slug="orbit-50")
    section = build(mine, "F01", parts[:3])
    build(other, "F01", parts[:5])

    assert equivalent_sections_for([section]) == {}


def test_a_partial_overlap_is_not_reported(parts):
    # Sharing most parts is not sharing all of them, and only "all" lets a
    # customer treat the other diagram as a substitute.
    mine = PartsModelFactory(model_code="AV12W-8", slug="orbit-125")
    other = PartsModelFactory(model_code="AW12W-6", slug="classic-125")
    section = build(mine, "E06", parts[:4])
    build(other, "E06", parts[:3])

    assert equivalent_sections_for([section]) == {}


def test_a_section_never_matches_another_diagram_in_its_own_book(parts):
    mine = PartsModelFactory(model_code="AV12W-8", slug="orbit-125")
    section = build(mine, "E06", parts[:4])
    build(mine, "E07", parts[:4])

    assert equivalent_sections_for([section]) == {}


def test_inactive_books_are_not_offered(parts):
    mine = PartsModelFactory(model_code="AV12W-8", slug="orbit-125")
    retired = PartsModelFactory(model_code="ZZ99W-8", slug="old", is_active=False)
    section = build(mine, "E06", parts[:4])
    build(retired, "E06", parts[:4])

    assert equivalent_sections_for([section]) == {}


def test_trivially_small_sections_are_skipped(parts):
    # A two-bolt section matches half the catalogue and tells a customer nothing.
    mine = PartsModelFactory(model_code="AV12W-8", slug="orbit-125")
    other = PartsModelFactory(model_code="AW12W-6", slug="classic-125")
    section = build(mine, "E99", parts[: MINIMUM_PARTS - 1])
    build(other, "E99", parts[: MINIMUM_PARTS - 1])

    assert equivalent_sections_for([section]) == {}


def test_matches_are_ordered_by_model_name(parts):
    mine = PartsModelFactory(model_code="AV12W-8", slug="orbit-125")
    zeta = PartsModelFactory(name="Zeta", model_code="AW12W-6", slug="zeta")
    alpha = PartsModelFactory(name="Alpha", model_code="AV05W-8", slug="alpha")
    section = build(mine, "F01", parts[:3])
    build(zeta, "F01", parts[:3])
    build(alpha, "F01", parts[:3])

    matches = equivalent_sections_for([section])[section.id]

    assert [m["model_name"] for m in matches] == ["Alpha", "Zeta"]


def test_a_whole_model_resolves_in_one_pass(parts):
    mine = PartsModelFactory(model_code="AV12W-8", slug="orbit-125")
    other = PartsModelFactory(model_code="AW12W-6", slug="classic-125")
    first = build(mine, "E06", parts[:4])
    second = build(mine, "F01", parts[2:6])
    build(other, "E06", parts[:4])

    results = equivalent_sections_for([first, second])

    assert set(results) == {first.id}


def test_no_sections_is_handled(parts):
    assert equivalent_sections_for([]) == {}
