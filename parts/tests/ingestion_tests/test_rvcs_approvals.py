import json

import pytest

from parts.ingestion.rvcs_approvals import (
    RvcsError,
    administrative_status_dates,
    extract_model_codes,
    parse_approval_documents,
    parse_approval_status,
    parse_identification_numbers,
    parse_portal_date,
    parse_rvd_documents,
    parse_variant_names,
    variant_model_codes,
    vin_family,
)


def grid(*rows):
    """Build the embedded JSON-string grid shape the RVCS API returns."""
    return json.dumps(
        [
            {"Cols": [{"Type": 0, "Header": header, "Value": value, "Option": link} for header, value, link in row]}
            for row in rows
        ]
    )


def test_portal_dates_decode_to_iso():
    assert parse_portal_date("12/12/2005") == "2005-12-12"
    assert parse_portal_date("") == ""
    assert parse_portal_date("no date here") == ""


def test_approval_status_splits_state_from_date():
    assert parse_approval_status("Approval Lapsed on 09/07/2023") == {
        "approval_status": "Approval Lapsed",
        "approval_status_date": "2023-07-09",
    }
    assert parse_approval_status("Approval Withdrawn") == {
        "approval_status": "Approval Withdrawn",
        "approval_status_date": "",
    }


def test_approval_documents_are_dated_and_sorted():
    value = grid(
        [(" ", "Issued On 29-November-2013", "https://example.test/29Nov2013.pdf")],
        [(" ", "Issued On 30-January-2006", "https://example.test/31Jan2006.pdf")],
    )

    assert parse_approval_documents(value) == [
        {"issued_on": "2006-01-30", "document_url": "https://example.test/31Jan2006.pdf"},
        {"issued_on": "2013-11-29", "document_url": "https://example.test/29Nov2013.pdf"},
    ]


def test_rvd_documents_expose_the_supersession_chain():
    value = grid(
        [
            ("Body Type", "SOLO", None),
            ("Marketing Designation", "MIO 50", None),
            ("Document Reference", "0181105B1", "/rvcs/rvd/14616"),
            ("Replacement Type", "Superseded By", None),
            ("Replacement Document Reference", "0181105B2", "/rvcs/rvd/27551"),
        ]
    )

    assert parse_rvd_documents(value) == [
        {
            "reference": "0181105B1",
            "rvd_id": 14616,
            "body_type": "SOLO",
            "marketing_designation": "MIO 50",
            "replacement_type": "Superseded By",
            "replacement_reference": "0181105B2",
            "replacement_rvd_id": 27551,
        }
    ]


def test_rvd_documents_without_a_replacement_keep_a_null_link():
    value = grid(
        [
            ("Marketing Designation", "SYMBA", None),
            ("Document Reference", "0201234A1", "/rvcs/rvd/40001"),
            ("Replacement Type", "", None),
            ("Replacement Document Reference", "", None),
        ]
    )

    [document] = parse_rvd_documents(value)
    assert document["rvd_id"] == 40001
    assert document["replacement_rvd_id"] is None


def test_variant_names_come_back_in_variant_order():
    value = grid(
        [
            ("", "Variant Name", None),
            ("1", "MIO 50S", None),
            ("2", "MIO50D", None),
            ("3", "", None),
        ]
    )

    assert parse_variant_names(value) == ["MIO 50S", "MIO50D"]


def test_identification_numbers_preserve_the_australian_vin_pattern():
    value = grid(
        [
            ("Variant", "1", None),
            ("Vehicle Identification Number", "RFGHU05W8#S123456", None),
        ]
    )

    assert parse_identification_numbers(value) == [
        {"variant": "1", "vin_pattern": "RFGHU05W8#S123456"}
    ]


def test_model_codes_are_extracted_from_any_printed_text():
    codes = extract_model_codes("HU05W", "certification model MB10A7-8 applies", "MIO 50")

    assert "HU05W" in codes
    assert "MB10A7-8" in codes
    assert "50" not in codes


def test_model_code_extraction_ignores_bare_years_and_short_tokens():
    assert extract_model_codes("Issued 2013, revision 2 of 2005") == []


def test_variant_codes_keep_technical_series_and_drop_trim_names():
    codes = variant_model_codes("MIO 50S | MIO50D", "AX15W2 | XA20W", "HD200 | HD2", "12A | A101 | GTS 300i Sport")

    assert codes == ["AX15W2", "XA20W"]


def test_variant_codes_accept_a_suffixed_local_style_code():
    assert variant_model_codes("MB10A7-8") == ["MB10A7-8"]


def test_vin_family_drops_the_manufacturer_identifier():
    # The 9th VIN character is the market/spec digit; Australian SYM
    # deliveries carry 8, matching the local parts-book "-8" suffix.
    assert vin_family("RFGHU05W8#S123456") == "HU05W8"
    assert vin_family("LXMAE12W1%X123456") == "AE12W1"
    assert vin_family("short") == ""


def test_malformed_grid_fields_fail_loudly():
    with pytest.raises(RvcsError):
        parse_rvd_documents("{not json")


def test_bulk_lapse_dates_are_identified_as_administrative():
    class Approval:
        def __init__(self, date):
            self.approval_status_date = date

    approvals = [
        Approval("2021-12-13"),
        Approval("2021-12-13"),
        Approval("2021-12-13"),
        Approval("2022-01-31"),
        Approval(""),
    ]

    shared = administrative_status_dates(approvals, minimum_shared=3)

    assert shared == {"2021-12-13"}
    assert "2022-01-31" not in shared
