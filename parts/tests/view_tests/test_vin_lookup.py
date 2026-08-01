import pytest
from rest_framework.test import APIClient

from parts.tests.factories import PartsModelFactory
from parts.vin_lookup import lookup, validate

pytestmark = pytest.mark.django_db

URL = "/api/parts/vin-lookup/"


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def books():
    """The book set that exercises every decode path."""
    return {
        code: PartsModelFactory(name=name, model_code=code, cc_class=cc)
        for code, name, cc in [
            ("FA05U1-8", "Retro 50", "50"),
            ("XL20W1-IT", "Symphony ST2", "200_400"),
            ("LH18W-8", "HD200", "200_400"),
            ("LH18W5-8", "HD200", "200_400"),
            ("LH18W7-6", "HD200 evo", "200_400"),
            ("LH18W7-8", "HD200 evo", "200_400"),
        ]
    }


def test_a_direct_vin_resolves_to_one_book(books):
    result = lookup("RFGFA05U885000938")

    assert [m.model_code for m in result.models] == ["FA05U1-8"]
    assert result.year == 2008
    assert result.problem == ""


def test_a_shorthand_vin_resolves_through_letters_and_capacity(books):
    result = lookup("LXMXLA501RX012345")

    assert [m.model_code for m in result.models] == ["XL20W1-IT"]
    assert result.year == 2024


def test_books_differing_only_by_revision_are_all_returned(books):
    # The VIN does not record the revision, so the customer chooses.
    result = lookup("RFGLH18W8DS100773")

    assert sorted(m.model_code for m in result.models) == [
        "LH18W-8", "LH18W5-8", "LH18W7-6", "LH18W7-8",
    ]
    assert result.problem == ""


def test_an_unknown_family_explains_itself_rather_than_guessing(books):
    result = lookup("RFGLNA705MSB00020")

    assert result.models == []
    assert "couldn't match" in result.problem


def test_inactive_books_are_never_offered(books):
    books["FA05U1-8"].is_active = False
    books["FA05U1-8"].save()

    assert lookup("RFGFA05U885000938").models == []


def test_the_full_seventeen_characters_are_required():
    # The decoder only reads eleven, but a customer who has transcribed all
    # seventeen has plainly read them off the bike.
    assert validate("RFGFA05U885000938")[1] == ""
    assert "17 characters - that one has 11" in validate("RFGFA05U885")[1]
    assert "17 characters - that one has 9" in validate("RFGFA05U8")[1]


def test_input_is_forgiving_of_spacing_and_case():
    assert validate(" rfg fa05u88-5000938 ")[0] == "RFGFA05U885000938"


def test_impossible_vin_characters_are_explained():
    assert "I, O or Q" in validate("RFGFA05UO85000938")[1]
    assert "17 characters - that one has 20" in validate("RFGFA05U885000938123")[1]
    assert "Enter your VIN" in validate("")[1]


def test_the_endpoint_returns_candidates_with_their_years(client, books):
    response = client.get(URL, {"vin": "RFGLH18W8DS100773"})

    assert response.status_code == 200
    body = response.json()
    assert body["year"] == 2013
    assert len(body["models"]) == 4
    evo = next(m for m in body["models"] if m["model_code"] == "LH18W7-6")
    assert evo["slug"]


def test_the_endpoint_reports_a_problem_without_erroring(client, books):
    response = client.get(URL, {"vin": "nope"})

    assert response.status_code == 200
    assert response.json()["models"] == []
    assert response.json()["problem"]


def test_the_endpoint_handles_a_missing_parameter(client, books):
    response = client.get(URL)

    assert response.status_code == 200
    assert response.json()["problem"]
