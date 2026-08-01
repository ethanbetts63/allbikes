from parts.ingestion.taiwan_emissions import (
    certifications_from_records,
    extract_model_codes,
)


def record(**overrides):
    base = {
        "custname": "三陽工業股份有限公司",
        "brand": "三陽",
        "carmodelname": "三陽  JOYMAX Z LW30W2 278.3c.c. CVT",
        "caryear": "2022",
        "certificateno": "C2M406011A-1",
        "enginegroup": "G300FAA-26",
        "exhaust_value": "278.3",
        "date": "20210101",
        "applytype": "變更",
    }
    return {**base, **overrides}


def test_model_codes_are_read_from_the_register_model_name():
    assert extract_model_codes("三陽  JET SL+ FKB16T4 158c.c. CVT  HEV") == ["FKB16T4"]
    assert extract_model_codes("三陽 DUKE迪爵  FCB15B2 150.3c.c. CVT  HEV") == ["FCB15B2"]


def test_capacities_and_marketing_tokens_are_not_model_codes():
    assert extract_model_codes("158c.c. CVT HEV") == []
    assert extract_model_codes("") == []


def test_certifications_carry_the_regulator_stated_model_year():
    [certification] = certifications_from_records([record()])

    assert certification.model_code == "LW30W2"
    assert certification.model_year == 2022
    assert certification.certificate_number == "C2M406011A-1"
    assert certification.displacement_cc == "278.3"


def test_rows_without_a_stated_model_year_are_dropped():
    # 404 of 1,085 SYM rows carry a blank caryear; an undated certificate
    # cannot contribute a year and no year is inferred from the certificate
    # number or the emissions-standard date.
    assert certifications_from_records([record(caryear="    "), record(caryear="")]) == []


def test_one_certification_is_emitted_per_code_and_year():
    records = [
        record(caryear="2021"),
        record(caryear="2022"),
        record(caryear="2022"),
        record(carmodelname="三陽 MAXSYM LZ40W1 399c.c.", caryear="2022", certificateno="C2M406012A-1"),
    ]

    certifications = certifications_from_records(records)

    assert [(item.model_code, item.model_year) for item in certifications] == [
        ("LW30W2", 2021),
        ("LW30W2", 2022),
        ("LZ40W1", 2022),
    ]


def test_a_model_name_printing_two_codes_yields_two_certifications():
    [first, second] = certifications_from_records(
        [record(carmodelname="三陽 JET SL FKB12T2 / FK12WE 124.6c.c.")]
    )

    assert first.model_code == "FK12WE"
    assert second.model_code == "FKB12T2"
    assert first.model_year == second.model_year == 2022
