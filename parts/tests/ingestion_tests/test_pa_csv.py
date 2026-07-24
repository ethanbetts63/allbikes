from decimal import Decimal

from parts.ingestion.pa_csv import iter_pa_rows


def _write(tmp_path, text):
    path = tmp_path / "PA-test.csv"
    path.write_text(text, encoding="utf-8")
    return str(path)


def test_parses_rows(tmp_path):
    csv_text = (
        "PART NUMBER,DESCRIPTION,AVAILABLE, RRP+GST ,ADD GST\n"
        "0454-X01-000,THRUST WASHER 14MM,10,$0.66,ADD GST\n"
        "53205-ALA-000-RD,FR. HANDLE COVER(R-010CA),0,$143.00,ADD GST\n"
    )
    rows = list(iter_pa_rows(_write(tmp_path, csv_text)))
    assert len(rows) == 2
    assert rows[0] == {
        "part_number": "0454-X01-000",
        "description": "THRUST WASHER 14MM",
        "available": 10,
        "price": Decimal("0.66"),
    }
    assert rows[1]["price"] == Decimal("143.00")
    assert rows[1]["available"] == 0


def test_handles_blank_and_missing_fields(tmp_path):
    csv_text = (
        "PART NUMBER,DESCRIPTION,AVAILABLE, RRP+GST ,ADD GST\n"
        "\n"
        "ABC-1,,,,\n"
    )
    rows = list(iter_pa_rows(_write(tmp_path, csv_text)))
    assert len(rows) == 1
    assert rows[0]["part_number"] == "ABC-1"
    assert rows[0]["available"] is None
    assert rows[0]["price"] is None
