from parts.ingestion.rvcs_documents import (
    accepted_vin_model_year,
    parse_approval_document,
    parse_issue_date,
    vin_model_year,
)


APPROVAL_TEXT = """
Department of Transport and Regional Services
The Administrator approves the affixing to a vehicle of the kind described in Schedule 2 which
conforms to the design as specified in the evidence items listed in Schedule 4, of an
Identification Plate of the colour specified in Schedule 3, that conforms with circular 0-3-2.
MOTOR VEHICLE STANDARDS ACT 1989
Approval No.: 35318
Issue date: 25 January 2006

Approval No.: 35318 Issue Date: 25 January 2006
Schedule 1
Bolwell Select Pty Ltd

Schedule 2
Make : BOLWELL SYM
Model : HU05W
Category : LA
Manufactured by : Bolwell Select Pty Ltd
Typical VIN : RFGHU05W85S123456
Seating Capacity : 1; 2

Schedule 3
Expiry date : Life of Model
Plate location : RIGHT HAND SIDE FRAME TUBE UNDER THE SEAT BOX
Plate colour : SILVER

Schedule 4
ADR Document Reference from evidence item
14/02 0015
19/02 0181105-19
33/00 0181105-33
"""


def test_issue_date_is_read_from_the_approval_header():
    assert parse_issue_date(APPROVAL_TEXT) == "2006-01-25"
    assert parse_issue_date("no date at all") == ""


def test_schedule_headings_named_in_the_conditions_prose_are_not_mistaken_for_the_schedule():
    # The approval's conditions reference "Schedule 2" and "Schedule 3" in
    # running text well before either schedule appears.
    document = parse_approval_document(
        APPROVAL_TEXT, approval_number=35318, document_date="2006-01-30", document_url="u"
    )

    assert document.model == "HU05W"


def test_schedule_two_fields_are_read_verbatim():
    document = parse_approval_document(
        APPROVAL_TEXT, approval_number=35318, document_date="2006-01-30", document_url="u"
    )

    assert document.make == "BOLWELL SYM"
    assert document.model == "HU05W"
    assert document.category == "LA"
    assert document.typical_vin == "RFGHU05W85S123456"
    assert document.expiry == "Life of Model"
    assert document.plate_location == "RIGHT HAND SIDE FRAME TUBE UNDER THE SEAT BOX"
    assert document.adr_items.startswith("14/02:0015 | 19/02:0181105-19")
    assert document.has_text_layer is True


def test_the_vin_model_year_the_search_summary_masks_is_recovered():
    # The RVD summary prints RFGHU05W8#S123456; the approval PDF prints the
    # real character, and the descriptor's remarks state that 5 means 2005.
    document = parse_approval_document(
        APPROVAL_TEXT, approval_number=35318, document_date="2006-01-30", document_url="u"
    )

    assert document.vin_model_year == 2005


def test_digit_year_codes_decode_without_context():
    assert vin_model_year("RFGHU05W85S123456") == 2005
    assert vin_model_year("RFGAW05W89X010569") == 2009


def test_placeholder_year_characters_never_decode():
    for placeholder in "#$%*?_0":
        assert vin_model_year(f"RFGHU05W8{placeholder}S123456") is None


def test_ambiguous_letter_codes_need_the_issue_year():
    # "A" is both 1989-era and 2010 under ISO 3779's 30-year cycle.
    assert vin_model_year("LXMAY15W2AX012345") is None
    assert vin_model_year("LXMAY15W2AX012345", issue_year=2010) == 2010


def test_a_letter_code_is_never_dated_after_its_approval():
    assert vin_model_year("LXMAY15W2YX012345", issue_year=2000) == 2000


def test_short_or_missing_vins_are_ignored():
    assert vin_model_year("") is None
    assert vin_model_year("RFGHU05W") is None


def test_a_plausible_sym_vin_year_is_accepted():
    year, reason = accepted_vin_model_year("RFGHU05W85S123456", [2006, 2007, 2008, 2013])

    assert (year, reason) == (2005, "")


def test_a_non_sym_manufacturer_identifier_is_not_decoded():
    # Bolwell also imported PGO; RFV VINs put something other than an ISO year
    # code in position 10 and decode to nonsense.
    year, reason = accepted_vin_model_year("RFVPMPMP2X1234567", [2006, 2008])

    assert year is None
    assert "non-SYM manufacturer identifier RFV" in reason


def test_a_year_outside_the_approvals_document_window_is_rejected():
    # Crox 50's only approval document is from 2020; a decoded 2014 means
    # position 10 is not acting as a year in that VIN layout.
    year, reason = accepted_vin_model_year("LXMAEA$%#EX000001", [2020])

    assert year is None
    assert "outside the approval's document window" in reason


def test_a_placeholder_vin_is_rejected_with_a_reason():
    year, reason = accepted_vin_model_year("RFGHU05W8#S123456", [2006])

    assert year is None
    assert "placeholder" in reason


def test_an_undated_approval_cannot_validate_a_vin_year():
    assert accepted_vin_model_year("RFGHU05W85S123456", []) == (
        None,
        "no dated approval document",
    )


def test_a_scanned_document_reports_no_text_layer():
    document = parse_approval_document(
        "", approval_number=41923, document_date="2009-01-01", document_url="u"
    )

    assert document.has_text_layer is False
    assert document.model == ""
    assert document.vin_model_year is None
