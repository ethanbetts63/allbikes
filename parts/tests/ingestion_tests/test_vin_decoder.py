from parts.ingestion.vin_decoder import book_capacity, decode


BOOKS = [
    "AE05W6-RU", "AE05WB-EU", "AE12W1-6", "AE12W4-EU", "BS05W-8", "FA05U1-8",
    "FS05W1-EU", "HU05W2-8", "HV15WC-8", "JD05W1-8", "LH18W-8", "LH18W5-8",
    "LH18W7-6", "LH18W7-8", "LS30W1-EU", "LZ40W1-EU", "TB16W3-EU", "XA20W1-EU",
    "XB20W1-EU", "XE12W1-IT", "XG12W1-IT", "XL20W1-IT",
]


def test_capacity_is_read_from_the_book_code():
    assert book_capacity("XL20W1-IT") == 200
    assert book_capacity("AE05W6-RU") == 50
    assert book_capacity("LZ40W1-EU") == 400
    assert book_capacity("") is None


def test_a_direct_descriptor_spells_the_book_code():
    result = decode("RFGFA05U885000938", BOOKS)

    assert result.scheme == "direct"
    assert result.model_family == "FA05U"
    assert result.book_candidates == ("FA05U1-8",)
    assert result.year == 2008


def test_the_shorthand_descriptor_resolves_by_letters_plus_capacity():
    # XLA5 is an "XL" of about 200cc, which is XL20W1-IT and nothing else.
    result = decode("LXMXLA501RX012345", BOOKS)

    assert result.scheme == "indirect"
    assert result.model_family == "XL"
    assert result.capacity_class == 200
    assert result.book_candidates == ("XL20W1-IT",)
    assert result.year == 2024


def test_the_capacity_class_excludes_same_letter_books_of_another_size():
    # AE covers both 50cc Crox and 125cc Orbit books; class 1 keeps only the 50s.
    result = decode("LXMAEA101PX000001", BOOKS)

    assert result.capacity_class == 50
    assert result.book_candidates == ("AE05W6-RU", "AE05WB-EU")
    assert "AE12W1-6" not in result.book_candidates


def test_a_generous_band_still_catches_the_158cc_drgbt():
    # TB16W3 is a 158 registering under capacity class 5.
    result = decode("LXMTBB502MX000001", BOOKS)

    assert result.book_candidates == ("TB16W3-EU",)


def test_books_differing_only_by_revision_all_survive():
    result = decode("RFGLH18W8DS100773", BOOKS)

    assert result.book_candidates == ("LH18W-8", "LH18W5-8", "LH18W7-6", "LH18W7-8")
    assert "does not carry" in result.note


def test_a_family_with_no_local_book_says_so():
    result = decode("RFGLNA705MSB00020", BOOKS)

    assert result.book_candidates == ()
    assert "no local book" in result.note


def test_a_non_sym_vin_is_refused():
    result = decode("ZAPM123456A123456", BOOKS)

    assert result.scheme == "unknown"
    assert "is not SYM" in result.note


def test_a_truncated_vin_is_refused_rather_than_guessed():
    result = decode("RFGLH18W", BOOKS)

    assert result.book_candidates == ()
    assert "too short" in result.note


def test_the_listed_year_disambiguates_the_repeating_letter_codes():
    # "D" is both 1983 and 2013 on the 30-year cycle.
    assert decode("RFGLH18W8DS100773", BOOKS, listed_year=2013).year == 2013


def test_an_exact_descriptor_match_beats_the_family():
    # AE12W4 is its own book, not also the AE12W1 one.
    assert decode("LXMAE12W4JX073805", BOOKS).book_candidates == ("AE12W4-EU",)
    assert decode("LXMAE12W1JX075264", BOOKS).book_candidates == ("AE12W1-6",)


def test_the_build_year_orders_candidates_but_never_drops_one():
    # Documented years are evidence of presence only. A book whose list omits
    # the year is not thereby excluded - measured against the family evidence,
    # documented ranges run up to thirteen years short.
    years = {"AE05W6-RU": {2014, 2015}, "AE05WB-EU": {2021, 2022, 2023}}
    result = decode("LXMAEA105NX000001", BOOKS, book_years=years)

    assert result.year == 2022
    assert result.book_candidates == ("AE05WB-EU", "AE05W6-RU")
    assert "not ruled out" in result.note


def test_ranking_is_skipped_when_no_candidate_documents_the_year():
    years = {"AE05W6-RU": {2014, 2015}, "AE05WB-EU": {2021}}
    result = decode("LXMAEA105LX000001", BOOKS, book_years=years)  # 2020

    assert sorted(result.book_candidates) == ["AE05W6-RU", "AE05WB-EU"]
    assert "listed first" not in result.note


def test_a_candidate_without_year_evidence_still_survives_ranking():
    years = {"AE05WB-EU": {2022}}
    result = decode("LXMAEA105NX000001", BOOKS, book_years=years)

    assert result.book_candidates == ("AE05WB-EU", "AE05W6-RU")
