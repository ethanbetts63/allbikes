from parts.ingestion.sym_model_years import parse_search_page


SEARCH_HTML = """
<html><body>
  <div class="infos_vehicle">
    <a href="/sym-motorfietsen/scooter_50/2020/CROX_50_45KM_H_AE05WA_EU_E4_L8_M0/511">
      <span>
        <p>CROX 50 (45KMH) (AE05WA-EU) (E4) (L8-M0)</p>
        <p>SYM scooter</p>
        Cilinderinhoud: 50 cc<br>
        Jaar: 2020<br>
      </span>
    </a>
  </div>
  <div class="infos_vehicle">
    <a href="/sym-motorfietsen/scooter_200/2008/HD_200_LH18W5_8_L7_L9/912">
      <span>
        <p>HD 200 (LH18W5-8) (L7-L9)</p>
        <p>SYM scooter</p>
        Cilinderinhoud: 200 cc<br>
        Jaar: 2008<br>
      </span>
    </a>
  </div>
</body></html>
"""


def test_parse_search_page_extracts_vehicle_identity_only():
    rows = parse_search_page(SEARCH_HTML)

    assert len(rows) == 2
    assert rows[0].customer_name == "CROX 50"
    assert rows[0].variant == "45KMH"
    assert rows[0].model_code == "AE05WA-EU"
    assert rows[0].code_qualifiers == "E4 | L8-M0"
    assert rows[0].engine_cc == 50
    assert rows[0].year == 2020
    assert rows[0].catalog_id == "511"
    assert rows[0].vehicle_type == "scooter"
    assert rows[1].customer_name == "HD 200"
    assert rows[1].model_code == "LH18W5-8"
    assert rows[1].code_qualifiers == "L7-L9"
