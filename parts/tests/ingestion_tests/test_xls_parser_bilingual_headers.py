from parts.ingestion.xls_parser import parse_section_parts


class Sheet:
    def __init__(self, rows):
        self.rows = rows
        self.nrows = len(rows)
        self.ncols = max(len(row) for row in rows)

    def cell_value(self, row, column):
        return self.rows[row][column] if column < len(self.rows[row]) else ""


def test_ignores_the_chinese_translation_of_the_parts_table_header():
    sheet = Sheet([
        ["Ref. No", "Part Number", "Reference Rate", "Description", "", "NO.", "Changes Date", "Available"],
        ["编号", "零件料號", "參考價", "品 名", "", "數量", "設變生效日", "適用性"],
        ["01", "19610-AMA-000", "", "Fan cover COMP", "", "1", "", ""],
    ])

    rows = parse_section_parts(sheet, datemode=0, colour_index={})

    assert [row["part_number"] for row in rows] == ["19610-AMA-000"]
    assert [row["ref_number"] for row in rows] == ["01"]
