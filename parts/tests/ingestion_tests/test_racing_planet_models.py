from parts.ingestion.racing_planet_models import parse_selector


HTML = """
<select id="level1">
  <option value="1">Citycom 300 ie 09-17 E3 [LH30W-6]</option>
  <option value="2">DRGBT 160 ie 4T LC 21- E5</option>
  <option value="3">Joyride 125 4T LC -03 E1 [LA12W-6]</option>
  <option value="4">Model without a year</option>
</select>
"""


def test_parse_selector_preserves_options_and_parses_year_shapes():
    rows = parse_selector(HTML)

    assert len(rows) == 4
    assert rows[0].model_code == "LH30W-6"
    assert (rows[0].year_from, rows[0].year_to, rows[0].range_is_open) == (2009, 2017, False)
    assert (rows[1].year_from, rows[1].year_to, rows[1].range_is_open) == (2021, None, True)
    assert (rows[2].year_from, rows[2].year_to, rows[2].range_is_open) == (None, 2003, True)
    assert (rows[3].year_from, rows[3].year_to) == (None, None)
