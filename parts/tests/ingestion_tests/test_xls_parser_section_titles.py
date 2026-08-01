from parts.ingestion.xls_parser import parse_section_name


class Sheet:
    def __init__(self, cells):
        self.cells = cells
        self.ncols = len(cells)

    def cell_value(self, row, column):
        assert row == 0
        return self.cells[column]


def test_reads_an_english_title_after_a_chinese_title_in_column_a():
    sheet = Sheet(["E01 罩盖总成 SHROUD ASSY", "", "", "", "", "", "", "AE05W6-RU"])

    assert parse_section_name(sheet, "E01") == "SHROUD ASSY"


def test_reads_a_legacy_title_from_column_b():
    sheet = Sheet(["E01", "SHROUD ASSY", "", ""])

    assert parse_section_name(sheet, "E01") == "SHROUD ASSY"
