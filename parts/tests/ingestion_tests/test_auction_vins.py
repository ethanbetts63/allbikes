from parts.ingestion.auction_vins import (
    confusable_families,
    position_9_by_family,
    read_observation,
    validate_vin,
)


def obs(**overrides):
    base = {
        "source": "grays.com",
        "listing_title": "2013 Sym HD200ievo Scooter Petrol",
        "listed_year": "2013",
        "vin": "RFGLH18W8DS100773",
        "engine_number": "",
        "source_url": "https://example.test/lot",
        "notes": "",
    }
    return {**base, **overrides}


def test_a_good_sym_vin_validates():
    assert validate_vin("RFGLH18W8DS100773") == ("RFGLH18W8DS100773", "")
    assert validate_vin(" rfgbs05w89s000608 ") == ("RFGBS05W89S000608", "")


def test_transcription_faults_are_reported_not_dropped():
    # Lawsons truncates its VINs; 16- and 18-character strings are the common
    # workshop faults; I/O/Q can never appear in a real VIN.
    assert validate_vin("RFGHV12W88S00048")[1] == "length 16, expected 17"
    assert validate_vin("RFGLH18W8DS1007733")[1] == "length 18, expected 17"
    assert "non-VIN character" in validate_vin("RFGLH18W8DS1OO773")[1]
    assert validate_vin("")[1] == "empty"


def test_a_non_sym_manufacturer_is_rejected():
    assert "not SYM" in validate_vin("ZAPM123456A123456")[1]


def test_an_observation_decodes_to_family_and_year():
    record = read_observation(obs())

    assert record.wmi == "RFG"
    assert record.model_family == "LH18W8"
    assert record.position_9 == "8"
    assert record.position_11 == "S"
    assert record.decoded_year == 2013
    assert record.year_agrees == "exact"
    assert record.problem == ""


def test_only_the_first_eleven_characters_are_kept():
    # The serial identifies an individual owner's vehicle and is not needed.
    record = read_observation(obs())

    assert record.vin_prefix == "RFGLH18W8DS"
    assert len(record.vin_prefix) == 11
    assert "100773" not in record.vin_prefix


def test_a_disagreement_with_the_listed_year_is_preserved_not_hidden():
    # Ross's listed this Mio 50 as 2006; the VIN says 7 = 2007.
    record = read_observation(
        obs(listing_title="2006 SYM Mio 50", listed_year="2006", vin="RFGHU05W87S000278")
    )

    assert record.decoded_year == 2007
    assert record.listed_year == 2006
    assert record.year_agrees == "differs by +1"


def test_a_listing_without_a_year_still_decodes():
    record = read_observation(obs(listed_year="", vin="RFGBS05W89S000608"))

    assert record.decoded_year == 2009
    assert record.year_agrees == ""


def test_a_faulty_vin_yields_a_record_with_a_problem_and_no_year():
    record = read_observation(obs(vin="RFGHV12W88S00048"))

    assert record.problem.startswith("length 16")
    assert record.decoded_year is None
    assert record.vin_prefix == ""


def test_s_and_5_confusion_is_flagged_per_family():
    records = [
        read_observation(obs(vin="RFGHV12W885000110", listed_year="")),
        read_observation(obs(vin="RFGHV12W88S000629", listed_year="")),
        read_observation(obs(vin="RFGBS05W89S000608", listed_year="")),
    ]

    assert confusable_families(records) == ["HV12W8"]


def test_position_9_is_reported_per_family_not_as_one_rule():
    # AW12W shows 8 in 2011 and Y in 2017 - there is no universal rule.
    records = [
        read_observation(obs(vin="RFGAW12W8BX021182", listed_year="")),
        read_observation(obs(vin="RFGAW12WYHX047105", listed_year="")),
        read_observation(obs(vin="RFGHV15WCFS001494", listed_year="")),
    ]

    assert position_9_by_family(records) == {"AW12W": ["8", "Y"], "HV15W": ["C"]}


def test_the_last_three_characters_must_be_numbers():
    # Departmental VIN guidance: "The last three characters of a VIN must be
    # numbers." A letter there is a transcription fault in the serial.
    assert validate_vin("RFGLH18W8DS10077S")[1] == "last three characters 77S are not all numbers"
    assert validate_vin("RFGLH18W8DS100773")[1] == ""
