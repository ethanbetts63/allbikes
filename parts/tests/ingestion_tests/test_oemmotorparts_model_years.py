from parts.ingestion.oemmotorparts_model_years import parse_sym_index_page


INDEX_HTML = """
<table class="modeltable"><tbody>
  <tr><td><a href="https://www.oemmotorparts.com/en/model/sym/symphony/2021">
    SYMPHONY ST 200 (XL20W1-IT) (E5) (M1-M4) Produced from 2021 to 2024
  </a></td></tr>
  <tr><td><a href="https://www.oemmotorparts.com/en/model/sym/mio/2018">
    MIO 50I 45KMH (L8) EU EURO4 Produced from 2018 to 2018
  </a></td></tr>
</tbody></table>
"""


def test_parse_sym_index_page_reads_explicit_code_and_ignores_qualifiers():
    rows = parse_sym_index_page(INDEX_HTML, source_page=3)

    assert len(rows) == 1
    assert rows[0].model_code == "XL20W1-IT"
    assert rows[0].year_from == 2021
    assert rows[0].year_to == 2024
    assert rows[0].generation == "M1-M4"
    assert rows[0].source_page == 3
