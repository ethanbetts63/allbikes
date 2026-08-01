from parts.ingestion.vehicle_registrations import (
    candidate_books,
    code_capacity,
    group_registrations,
    is_sym_row,
    model_capacity,
)


LOCAL = [
    ("LM25W-8", "200_400"),
    ("LM30W-8", "200_400"),
    ("HU05W2-8", "50"),
    ("HU10W1-8", "100_165"),
    ("BL05W5-8", "50"),
    ("AW12W-6", "100_165"),
]


def reg(**overrides):
    # Registration extracts pad every text column to a fixed width.
    base = {
        "Make": "BOLWELL SYM         ",
        "Model": "RED DEVIL 50        ",
        "Year of Manufacture": "2004",
        "VIN Prefix": "RFGBL",
    }
    return {**base, **overrides}


def test_sym_and_bolwell_rows_are_recognised_through_the_padding():
    assert is_sym_row(reg()) is True
    assert is_sym_row(reg(Make="BOLWELL/PGO         ")) is True
    assert is_sym_row(reg(Make="SANYANG             ")) is True
    assert is_sym_row(reg(Make="HONDA               ")) is False


def test_capacity_is_read_from_the_registration_model_name():
    assert model_capacity("MIO 50") == 50
    assert model_capacity("FIRENZE 300") == 300
    assert model_capacity("JOLIE") is None


def test_capacity_is_read_from_the_book_code_itself():
    # LM"25"W is a 250; LA"18"W is nominally 180 but marketed as a 200.
    assert code_capacity("LM25W-8") == 250
    assert code_capacity("HU05W2-8") == 50
    assert code_capacity("LA18W1-8") == 180
    assert code_capacity("") is None


def test_a_nominal_capacity_still_matches_its_marketing_name():
    # LA18W encodes 180 but registers as a "LE GRANDE 200".
    assert candidate_books("RFGLA", 200, [("LA18W1-8", "200_400")]) == ["LA18W1-8"]


def test_capacity_separates_books_sharing_a_vin_prefix():
    # RFGLM covers both LM25W and LM30W; only the model name splits them.
    assert candidate_books("RFGLM", 250, LOCAL) == ["LM25W-8"]
    assert candidate_books("RFGLM", 300, LOCAL) == ["LM30W-8"]


def test_without_a_capacity_every_book_on_the_prefix_stays_a_candidate():
    assert candidate_books("RFGLM", None, LOCAL) == ["LM25W-8", "LM30W-8"]


def test_a_short_or_unknown_prefix_matches_nothing():
    assert candidate_books("RFG", 50, LOCAL) == []
    assert candidate_books("RFGZZ", 50, LOCAL) == []


def test_registrations_group_into_one_record_per_prefix_and_model():
    rows = [
        reg(**{"Year of Manufacture": "2004"}),
        reg(**{"Year of Manufacture": "2005"}),
        reg(**{"Year of Manufacture": "2005"}),
        reg(Model="MIO 50              ", VIN_Prefix="RFGHU") | {"VIN Prefix": "RFGHU"},
    ]
    groups = group_registrations(rows, LOCAL)

    devil = next(g for g in groups if g.model == "RED DEVIL 50")
    assert devil.registration_count == 3
    assert devil.first_year == 2004 and devil.last_year == 2005
    assert devil.observed_years == "2004, 2005"
    assert devil.candidate_local_books == "BL05W5-8"


def test_implausible_or_missing_years_are_dropped():
    rows = [
        reg(**{"Year of Manufacture": "1989"}),
        reg(**{"Year of Manufacture": ""}),
        reg(**{"Year of Manufacture": "n/a"}),
        reg(**{"Year of Manufacture": "2004"}),
    ]
    groups = group_registrations(rows, LOCAL)

    assert len(groups) == 1
    assert groups[0].registration_count == 1
    assert groups[0].observed_years == "2004"


def test_non_sym_makes_never_enter_the_result():
    assert group_registrations([reg(Make="HONDA               ")], LOCAL) == []
