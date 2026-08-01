from parts.ingestion.technical_equivalence import (
    BookFingerprint,
    compact_part_number,
    parse_catalogue_part_numbers,
    parse_catalogue_sections,
    score_fingerprints,
)


def test_compact_part_number_matches_hyphenated_and_unhyphenated_catalogues():
    assert compact_part_number("19610-AMA-000") == "19610AMA000"
    assert compact_part_number("19610AMA000") == "19610AMA000"
    assert compact_part_number("零件料號") == ""


def test_catalogue_parser_ignores_colour_cards_and_reads_oem_references():
    index_html = """
    <a href="/bike/BLACK/18/0/0/18">BLACK (BK-007U) for SYM test</a>
    <a href="/bike/FAIRING/18/6/0/18">FAIRING</a>
    """
    parts_html = """
    <a class="parts_ref">19610AMA000</a>
    <a class="parts_ref">96001-06020-00</a>
    """
    sections = parse_catalogue_sections(index_html, "https://example.test/book")

    assert sections == [(6, "FAIRING", "https://example.test/bike/FAIRING/18/6/0/18")]
    assert parse_catalogue_part_numbers(parts_html) == {"19610AMA000", "960010602000"}


def test_equivalence_score_downweights_common_parts():
    left = BookFingerprint("A", "A", frozenset({"UNIQUEA1", "COMMON01"}), frozenset())
    right = BookFingerprint("B", "B", frozenset({"UNIQUEA1", "COMMON01", "OTHER001"}), frozenset())
    score = score_fingerprints(
        left,
        right,
        document_frequency={"UNIQUEA1": 1, "COMMON01": 50, "OTHER001": 50},
        book_count=51,
    )

    assert score.shared_part_count == 2
    assert score.left_overlap_percent == 100.0
    assert score.right_overlap_percent == 66.7
    assert score.weighted_jaccard_percent > 66.7
