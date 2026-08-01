import pytest

from parts.ingestion.taiwan_fuel_economy import (
    TaiwanFuelEconomyError,
    extract_model_codes,
    parse_archive,
    parse_certificate_csv,
    roc_date_to_iso,
)


CSV_TEXT = """國產機車車型耗能證明106年11月核發資料,,,,,,,,,,,
,,,,,,,,,,,油耗單位：公里/公升
廠    牌,車        型,傳動,引擎,排氣量,耗能,市區,定速,油耗,申請,耗能證明,能源效率
,,型式,行程,(c.c.),標準,油耗,油耗,測試值,單位,核發日期,等    級
三陽,GTS 300i ABS LN30W5,CVT,4,278.3,25.0,29.1,40.2,32.8,三陽工業,106/11/01,2級
山葉,Jog sweet 115 XC115SC,CVT,4,113.0,38.0,42.66,58.01,47.7,台灣山葉,106/11/03,2級
三陽,GT 125 SUPER 2 HM12VV,CVT,4,124.9,42.0,45.0,60.0,50.0,三陽工業,106/11/17,1級
三陽,undated row HM12TU,CVT,4,124.9,42.0,45.0,60.0,50.0,三陽工業,,1級
"""


def test_roc_dates_convert_to_iso():
    # ROC year 1 is 1912, so the offset is a constant 1911.
    assert roc_date_to_iso("106/10/03") == "2017-10-03"
    assert roc_date_to_iso("114/12/31") == "2025-12-31"
    assert roc_date_to_iso("99/1/5") == "2010-01-05"


def test_malformed_or_implausible_roc_dates_are_rejected():
    assert roc_date_to_iso("") == ""
    assert roc_date_to_iso("2017-10-03") == ""
    assert roc_date_to_iso("106/13/40") == ""
    assert roc_date_to_iso(None) == ""


def test_technical_codes_are_read_from_the_model_field():
    assert extract_model_codes("GTS 300i ABS LN30W5") == ["LN30W5"]
    assert extract_model_codes("GT 125 SUPER 2 HM12VV") == ["HM12VV"]
    assert extract_model_codes("野狼T2 PD25AB") == ["PD25AB"]
    assert extract_model_codes("DRGBT TB16W3") == ["TB16W3"]


def test_marketing_text_without_a_code_yields_nothing():
    assert extract_model_codes("野狼 125") == []
    assert extract_model_codes("") == []


def test_only_sym_rows_with_a_date_become_certificates():
    certificates = parse_certificate_csv(CSV_TEXT, source_file="106-11.csv")

    assert [(c.model_code, c.issue_date) for c in certificates] == [
        ("LN30W5", "2017-11-01"),
        ("HM12VV", "2017-11-17"),
    ]
    assert certificates[0].brand == "三陽"
    assert certificates[0].displacement_cc == "278.3"
    assert certificates[0].source_file == "106-11.csv"


def test_the_two_row_split_header_is_resolved():
    # "耗能證明" sits on one header row and "核發日期" on the next.
    certificates = parse_certificate_csv(CSV_TEXT)

    assert certificates[0].issue_date == "2017-11-01"


def test_a_file_without_a_recognisable_header_yields_nothing():
    assert parse_certificate_csv("just,some,rows\n1,2,3\n") == []


def test_a_non_zip_payload_fails_loudly():
    with pytest.raises(TaiwanFuelEconomyError):
        parse_archive(b"not a zip")


def test_archive_parsing_skips_electric_labelling_files(tmp_path):
    import io
    import zipfile

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("耗能證明106年11月核發資料/國產機車車型耗能證明.csv", CSV_TEXT.encode("utf-8"))
        archive.writestr("耗能證明106年11月核發資料/電動機車能源效率標示.csv", CSV_TEXT.encode("utf-8"))
        archive.writestr("耗能證明106年11月核發資料/國產小客車車型耗能證明.csv", CSV_TEXT.encode("utf-8"))

    certificates, unreadable = parse_archive(buffer.getvalue())

    # Only the motorcycle file counts, and its two SYM rows deduplicate to two.
    assert [c.model_code for c in certificates] == ["HM12VV", "LN30W5"]
    assert unreadable == []
