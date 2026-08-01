from types import SimpleNamespace

from parts.ingestion.evidence_matrix import annotate_generation_years, build_matrix, decode_generation_years
from parts.management.commands.build_sym_evidence_table import _coverage_rows


def test_matrix_preserves_non_local_models_and_corroborates_code_stems():
    claims = [
        {
            "source": "easyparts.com",
            "source_title": "Orbit 50",
            "model_code": "AV05W-6",
            "year_from": 2007,
            "year_to": 2008,
            "engine": "50 4T",
            "generation": "",
            "frame_number": "",
        },
        {
            "source": "racing-planet.com",
            "source_title": "Orbit I 50",
            "model_code": "AV05W-6",
            "year_from": 2008,
            "year_to": 2009,
            "engine": "",
            "generation": "",
            "frame_number": "",
        },
        {
            "source": "racing-planet.com",
            "source_title": "Unknown bike 2020",
            "model_code": "ZZ50W-6",
            "year_from": 2020,
            "year_to": 2020,
            "engine": "",
            "generation": "",
            "frame_number": "",
        },
    ]
    local = SimpleNamespace(name="Orbit 50", model_code="AV05W-8", cc_class="50")

    rows = build_matrix(claims=claims, local_models=[local], current_year=2026)
    orbit_2008 = next(row for row in rows if row["evidence_key"] == "AV05W" and row["year"] == "2008")
    unknown = next(row for row in rows if row["evidence_key"] == "ZZ50W")

    assert orbit_2008["source_count"] == 2
    assert orbit_2008["confidence"] == "High — exact code corroborated"
    assert orbit_2008["local_same_stem_candidates"] == "Orbit 50 [AV05W-8]"
    assert orbit_2008["local_year_status"] == "Confirmed"
    assert orbit_2008["year_confidence_score"] > 70
    assert unknown["local_exact_books"] == ""
    assert "No local parts book" in unknown["review_notes"]


def test_matrix_links_code_less_claim_only_when_signature_has_one_code_stem():
    claims = [
        {
            "source": "easyparts.com",
            "source_title": "Crox 50 4T E5 2021-2024 (EU)",
            "model_code": "AE05WB-EU",
            "year_from": 2021,
            "year_to": 2024,
            "engine": "50 E5",
            "generation": "M1-M4",
            "frame_number": "LXMAE05W",
        },
        {
            "source": "racing-planet.com",
            "source_title": "Crox 50 ie 4T AC 21- E5",
            "model_code": "",
            "year_from": 2021,
            "year_to": None,
            "engine": "",
            "generation": "",
            "frame_number": "",
        },
    ]
    local = SimpleNamespace(name="Crox E5", model_code="AE05WB-EU", cc_class="50")

    rows = build_matrix(claims=claims, local_models=[local], current_year=2026)
    row = next(row for row in rows if row["evidence_key"] == "AE05WB" and row["year"] == "2022")

    assert row["source_count"] == 2
    assert "Crox 50 ie" in row["racing_planet_evidence"]
    assert "Code-less evidence linked" in row["review_notes"]


def test_matrix_keeps_document_identity_evidence_separate_from_year_claims():
    claims = [
        {
            "source": "sym-global.com",
            "source_title": "Symphony SR 150",
            "model_code": "AZ15W2-6",
            "year_from": None,
            "year_to": None,
            "engine": "149 cc",
            "generation": "",
            "frame_number": "",
            "document_type": "Owner's manual",
            "evidence_authority": "Manufacturer-hosted",
            "evidence_notes": "Exact code printed in specification table",
        }
    ]
    local = SimpleNamespace(name="SymphonySR", model_code="AZ15W2-6", cc_class="150")

    rows = build_matrix(claims=claims, local_models=[local], current_year=2026)

    assert len(rows) == 1
    assert rows[0]["year"] == "Unspecified"
    assert "Owner's manual" in rows[0]["official_sym_document_evidence"]
    assert rows[0]["third_party_document_evidence"] == ""
    assert rows[0]["year_confidence_band"] == "Unconfirmed"


def test_matrix_keeps_australian_rvcs_evidence_in_its_own_column():
    claims = [
        {
            "source": "mvsa.infrastructure.gov.au",
            "source_title": "HD200",
            "model_code": "LH18W",
            "year_from": 2005,
            "year_to": 2005,
            "engine": "171 cc",
            "generation": "",
            "frame_number": "RFGLH18W",
            "document_type": "Road Vehicle Descriptor",
            "evidence_authority": "Australian Government approval record",
            "evidence_notes": "Point-in-time approval evidence",
        }
    ]
    local = SimpleNamespace(name="HD200", model_code="LH18W-8", cc_class="200")

    rows = build_matrix(claims=claims, local_models=[local], current_year=2026)

    assert len(rows) == 1
    assert "Road Vehicle Descriptor" in rows[0]["australian_rvcs_evidence"]
    assert rows[0]["third_party_document_evidence"] == ""


def test_code_less_rvcs_claim_does_not_extend_local_year_coverage_by_name():
    claims = [
        {
            "source": "easyparts.com",
            "source_title": "Crox 50 4T 2014-2017",
            "model_code": "AE05W6-RU",
            "year_from": 2014,
            "year_to": 2017,
            "engine": "49 cc",
            "generation": "",
            "frame_number": "",
        },
        {
            "source": "mvsa.infrastructure.gov.au",
            "source_title": "Crox 50",
            "model_code": "",
            "year_from": 2020,
            "year_to": 2020,
            "engine": "49 cc",
            "generation": "",
            "frame_number": "LXMAEA",
        },
    ]
    local = SimpleNamespace(name="Crox 50", model_code="AE05W6-RU", cc_class="50")

    rows = build_matrix(claims=claims, local_models=[local], current_year=2026)

    rvcs_row = next(row for row in rows if row["year"] == "2020")
    assert rvcs_row["evidence_key"].startswith("NAME:")
    assert rvcs_row["local_exact_books"] == ""
    assert rvcs_row["local_same_stem_candidates"] == ""


def test_generation_qualifiers_decode_and_preserve_conflicts():
    assert decode_generation_years("E4 L8-M0") == (2018, 2020)
    assert decode_generation_years("K7") == (2007, 2007)
    assert decode_generation_years("K7-L0 | K8-L0") is None

    claim = annotate_generation_years(
        {"generation": "L8-M0", "year_from": 2018, "year_to": 2021}
    )

    assert claim["generation_year_from"] == 2018
    assert claim["generation_year_to"] == 2020
    assert claim["generation_year_check"].startswith("review:")


def test_local_coverage_is_one_row_per_book_with_suspected_years_kept_separate():
    claims = [
        {
            "source": "easyparts.com",
            "source_title": "Crox 50 2014-2017",
            "model_code": "AE05W6-EU",
            "year_from": 2014,
            "year_to": 2017,
            "engine": "50 cc",
            "generation": "",
            "frame_number": "",
        },
        {
            "source": "racing-planet.com",
            "source_title": "Related Crox family 2020",
            "model_code": "AE05W",
            "year_from": 2020,
            "year_to": 2020,
            "engine": "50 cc",
            "generation": "",
            "frame_number": "",
        },
    ]
    local = SimpleNamespace(name="Crox 50", model_code="AE05W6-RU", cc_class="50")

    matrix = build_matrix(claims=claims, local_models=[local], current_year=2026)
    coverage = _coverage_rows(
        matrix,
        [local],
        technical_evidence={"AE05W6-RU": ["Related external book: 200 shared OEM parts."]},
    )

    assert len(coverage) == 1
    assert coverage[0]["local_model_code"] == "AE05W6-RU"
    assert coverage[0]["year_ranges"] == ""
    assert coverage[0]["known_family_code_years"] == "2014, 2015, 2016, 2017, 2020"
    assert coverage[0]["coverage_status"] == "Unconfirmed"
    assert coverage[0]["evidence_basis"] == "related family/name evidence only; no exact-code year evidence"
    assert "EasyParts:" in coverage[0]["aggregated_evidence"]
    assert "Racing Planet:" in coverage[0]["aggregated_evidence"]
    assert "Technical parts comparison:" in coverage[0]["aggregated_evidence"]


def _coverage_for(claims, local, *, current_year=2026):
    matrix = build_matrix(claims=claims, local_models=[local], current_year=current_year)
    return _coverage_rows(matrix, [local])[0]


def _exact_claim(code, year_from, year_to, *, source="easyparts.com", title="Book"):
    return {
        "source": source,
        "source_title": title,
        "model_code": code,
        "year_from": year_from,
        "year_to": year_to,
        "engine": "",
        "generation": "",
        "frame_number": "",
    }


def test_single_observed_year_is_not_presented_as_a_range():
    local = SimpleNamespace(name="Mio 50", model_code="HU05W2-8", cc_class="50")

    row = _coverage_for([_exact_claim("HU05W2-8", 2014, 2014)], local)

    assert row["year_evidence_shape"] == "single observed year"
    assert row["observed_years"] == "2014"
    assert row["earliest_confirmed_year"] == 2014
    assert row["latest_confirmed_year"] == 2014
    assert row["inferred_year_range"] == ""
    assert row["unevidenced_years"] == ""


def test_gapped_evidence_separates_observed_years_from_the_inferred_range():
    local = SimpleNamespace(name="Orbit II 125", model_code="AE12W1-6", cc_class="125")
    claims = [
        _exact_claim("AE12W1-6", 2010, 2013),
        _exact_claim("AE12W1-6", 2016, 2016, source="racing-planet.com"),
    ]

    row = _coverage_for(claims, local)

    assert row["year_evidence_shape"] == "observed years with gaps"
    assert row["observed_years"] == "2010, 2011, 2012, 2013, 2016"
    assert row["earliest_confirmed_year"] == 2010
    assert row["latest_confirmed_year"] == 2016
    assert row["unevidenced_years"] == "2014, 2015"
    assert row["inferred_year_range"] == "2010-2016"


def test_continuous_evidenced_range_claims_no_inference():
    local = SimpleNamespace(name="Ute Scoot 125", model_code="AE12W4-EU", cc_class="125")

    row = _coverage_for([_exact_claim("AE12W4-EU", 2014, 2017)], local)

    assert row["year_evidence_shape"] == "continuous evidenced range"
    assert row["observed_years"] == "2014, 2015, 2016, 2017"
    assert row["inferred_year_range"] == ""
    assert row["unevidenced_years"] == ""


def test_open_ended_evidence_reports_an_earliest_bound_only():
    local = SimpleNamespace(name="Orbit 125", model_code="AV12W-8", cc_class="125")
    claims = [
        {
            "source": "racing-planet.com",
            "source_title": "Orbit 125",
            "model_code": "AV12W-8",
            "year_from": 2007,
            "year_to": None,
            "range_is_open": True,
            "engine": "",
            "generation": "",
            "frame_number": "",
        }
    ]

    row = _coverage_for(claims, local)

    assert row["year_evidence_shape"] == "open-ended source range from 2007"
    assert row["observed_years"] == "2007+"
    assert row["earliest_confirmed_year"] == 2007
    assert row["latest_confirmed_year"] == ""


def test_unconfirmed_book_reports_no_confirmed_bounds():
    local = SimpleNamespace(name="Red Devil", model_code="BL05W5-8", cc_class="50")

    row = _coverage_for([_exact_claim("BL05W-6", 2001, 2001)], local)

    assert row["coverage_status"] == "Unconfirmed"
    assert row["year_evidence_shape"] == "no confirmed year evidence"
    assert row["observed_years"] == ""
    assert row["earliest_confirmed_year"] == ""
    assert row["latest_confirmed_year"] == ""


def test_family_code_years_stay_discrete_so_gaps_remain_visible():
    local = SimpleNamespace(name="Red Devil", model_code="BL05W5-8", cc_class="50")
    claims = [
        _exact_claim("BL05W-6", 1999, 1999, title="Jet 50"),
        _exact_claim("BL05W-6", 2004, 2005, title="Red Devil 50", source="racing-planet.com"),
        _exact_claim("BL05W-6", 2013, 2013, title="Red Devil 50", source="mvsa.infrastructure.gov.au"),
    ]

    row = _coverage_for(claims, local)

    assert row["known_family_code_years"] == "1999, 2004, 2005, 2013"
    assert "-" not in row["known_family_code_years"]


def test_open_ended_family_code_evidence_is_labelled_not_spanned():
    local = SimpleNamespace(name="Orbit 125", model_code="AV12W-8", cc_class="125")
    claims = [
        {
            "source": "racing-planet.com",
            "source_title": "Orbit 125",
            "model_code": "AV12W-6",
            "year_from": 2007,
            "year_to": None,
            "range_is_open": True,
            "engine": "",
            "generation": "",
            "frame_number": "",
        }
    ]

    row = _coverage_for(claims, local)

    assert row["known_family_code_years"] == "2007+ (open-ended source range)"
