from parts.ingestion import colour


class TestParsePaintCode:
    def test_parenthesised(self):
        assert colour.parse_paint_code("FR. HANDLE COVER(R-010CA)") == "R-010CA"

    def test_trailing_bare(self):
        assert colour.parse_paint_code("FR.COVER BU2957C") == "BU2957C"

    def test_none(self):
        assert colour.parse_paint_code("FR. HANDLE COVER") == ""
        assert colour.parse_paint_code("") == ""


class TestSplitBaseAndSuffix:
    def test_colour_suffix(self):
        assert colour.split_base_and_suffix("53205-ALA-000-RD") == ("53205-ALA-000", "RD")

    def test_no_hyphen(self):
        assert colour.split_base_and_suffix("11100") == ("11100", "")


class TestDeriveColourGroup:
    def test_groups_shared_base(self):
        pns = ["53205-ALA-000-RD", "53205-ALA-000-KG", "53205-ALA-000-SB"]
        group = colour.derive_colour_group(pns)
        assert set(group) == set(pns)
        assert group["53205-ALA-000-RD"] == ("53205-ALA-000", "RD")

    def test_lone_part_not_a_colour_group(self):
        # A single part under a base is not a colour variant.
        assert colour.derive_colour_group(["93904-35380"]) == {}

    def test_mixed(self):
        pns = ["53205-ALA-000-RD", "53205-ALA-000-KG", "93904-35380"]
        group = colour.derive_colour_group(pns)
        assert "93904-35380" not in group
        assert len(group) == 2


class TestResolveColourName:
    def test_from_paint_code_prefix(self):
        assert colour.resolve_colour_name("R-010CA") == "Red"
        assert colour.resolve_colour_name("BK-5560") == "Black"

    def test_from_suffix_fallback(self):
        assert colour.resolve_colour_name("", suffix="BQ") == "Blue"

    def test_from_colour_index(self):
        assert colour.resolve_colour_name("R-086", colour_index={"R-086": "Crimson"}) == "Crimson"

    def test_unresolvable_returns_empty(self):
        assert colour.resolve_colour_name("", suffix="ZZ") == ""
