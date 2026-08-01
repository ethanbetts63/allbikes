from types import SimpleNamespace

from parts.ingestion.model_year_evidence import combine_exact_code_evidence


def test_combine_exact_code_evidence_expands_ranges_and_marks_corroboration():
    local = SimpleNamespace(name="Crox E5", model_code="AE05WB-EU", cc_class="50")
    dutch = [
        {
            "local_model_code": "AE05WB-EU",
            "customer_name": "Crox 50 E5",
            "year": "2021",
            "code_qualifiers": "M1",
            "source_url": "https://dutch.test/crox",
        }
    ]
    easy = [
        {
            "local_model_code": "AE05WB-EU",
            "customer_name": "Crox 50 E5",
            "year_from": "2021",
            "year_to": "2022",
            "engine": "50 E5",
            "generation": "M1-M2",
            "frame_number": "LXMAE05W",
            "source_url": "https://easy.test/crox",
        }
    ]

    rows, unmatched = combine_exact_code_evidence(
        dutch_rows=dutch,
        easyparts_rows=easy,
        local_models=[local],
    )

    assert [row["year"] for row in rows] == [2021, 2022]
    assert rows[0]["evidence_status"] == "corroborated_exact_code"
    assert rows[0]["source_count"] == 2
    assert rows[1]["evidence_status"] == "single_source_exact_code"
    assert rows[1]["frame_numbers"] == "LXMAE05W"
    assert unmatched == []
