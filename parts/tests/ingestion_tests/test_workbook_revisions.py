import xlrd

from parts.ingestion.workbook_revisions import (
    parse_date_cell,
    parse_resume_model_code,
    parse_revision_entries,
    summarise,
    years_in_sheet_names,
)


RESUME_ROWS = [
    ["MODEL：BL05W5-8", "", "", "", "", "", "", "", ""],
    ["ITEM", "PAGE", "ORIGINAL NUMBER", "DESCRIPTION", "REVISED NUMBER",
     "EFFECTIVE DATE", "REVISE DATE", "CHANGE DETAILS", "MODIFIED BY"],
    ["1.0", "F08", "77200-G22-800-BK", "DOUBLE SEAT", "77200-G22-800", "", 39336.0, "REVISED", "NICOLE"],
    ["2.0", "F02", "93401-06020-00", "WASHER BOLT", "", "2005/08/08 (25-12447)", 39416.0, "ABOLISH", "NICOLE"],
    ["3.0", "F07", "", "CLAMP BRAKE CABLE", "43452-GAK-900", "", "2008.6.5", "ADD", "NICOLE"],
    ["4.0", "F03", "", "NOT A DATED ROW", "", "", "", "ADD", "ERICA"],
]


def test_string_dates_parse_in_both_workbook_styles():
    assert parse_date_cell("2008/6/25") == "2008-06-25"
    assert parse_date_cell("2008.6.5") == "2008-06-05"
    assert parse_date_cell("2005/08/08 (25-12447)") == "2005-08-08"


def test_excel_serials_parse_as_dates():
    assert parse_date_cell(39336.0) == "2007-09-11"


def test_part_numbers_are_not_mistaken_for_dates():
    # "19510-GY6-A00" leads with four digits but is a part number.
    assert parse_date_cell("19510-GY6-A00") == ""
    assert parse_date_cell("DESIGN CHANGE(25-19122)") == ""


def test_implausible_and_malformed_dates_are_rejected():
    assert parse_date_cell("1899/01/01") == ""
    assert parse_date_cell("2008/13/45") == ""
    assert parse_date_cell(None) == ""
    assert parse_date_cell(12.5) == ""


def test_the_full_local_code_is_read_from_the_change_log():
    # The workbook uses a full-width colon after MODEL.
    assert parse_resume_model_code(RESUME_ROWS) == "BL05W5-8"
    assert parse_resume_model_code([["nothing here"]]) == ""


def test_only_dated_rows_become_revision_entries():
    entries = parse_revision_entries(RESUME_ROWS)

    assert len(entries) == 3
    assert entries[0]["revise_date"] == "2007-09-11"
    assert entries[1]["effective_date"] == "2005-08-08"
    assert entries[2]["revise_date"] == "2008-06-05"
    assert entries[2]["page"] == "F07"


def test_a_sheet_without_a_date_header_yields_nothing():
    assert parse_revision_entries([["ITEM", "PAGE"], ["1.0", "F01"]]) == []


def test_years_are_read_from_colour_sheet_names():
    names = ["F01", "2010 color index", "COLOR (2019)", "color index 2013.2014", "color(2025)"]

    assert years_in_sheet_names(names) == [2010, 2013, 2014, 2019, 2025]


def test_sheet_name_years_ignore_numbers_that_are_not_years():
    assert years_in_sheet_names(["No.index1", "F08_2", "25-21100"]) == []


def test_summary_merges_revision_and_sheet_name_activity():
    summary = summarise(
        source_file="Red-Devil-BL05W5-8.xls",
        declared_model_code="BL05W5-8",
        entries=parse_revision_entries(RESUME_ROWS),
        sheet_names=["part resume", "2010 color index"],
    )

    assert summary.declared_model_code == "BL05W5-8"
    assert summary.revision_count == 3
    assert summary.first_revision_date == "2005-08-08"
    assert summary.last_revision_date == "2008-06-05"
    assert summary.revision_years == "2005, 2007, 2008"
    assert summary.sheet_name_years == "2010"
    assert summary.all_activity_years == "2005, 2007, 2008, 2010"


def test_xlrd_date_cells_are_honoured():
    assert parse_date_cell(
        39336.0, cell_type=xlrd.XL_CELL_DATE, datemode=0
    ) == "2007-09-11"
