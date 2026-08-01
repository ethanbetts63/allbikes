from parts.ingestion.easyparts_model_years import parse_model_page, parse_sym_model_links


MODEL_HTML = """
<html><body>
  <a href="/models/Sym-Crox-m23810">Crox</a>
  <a href="https://example.test/models/Sym-Wrong-m1">Wrong host</a>
  <a href="/models/Other-m12">Other brand</a>
  <div id="models_table">
    <div class="model">
      <h2 class="model_name">Crox 50 4T E5 2021-2024 (EU)</h2>
      <div class="model_property_name">Build Year</div>
      <div class="model_property"><span class="property_value">2021-2024</span></div>
      <div class="model_property_name">Engine</div>
      <div class="model_property"><span class="property_value">50 Carb. AIR 2V E5</span></div>
      <div class="model_property_name">Model code</div>
      <div class="model_property"><span class="property_value">AE05WB-EU (M1-M4)</span></div>
      <div class="model_property_name">Frame number</div>
      <div class="model_property"><span class="property_value">LXMAE05W</span></div>
      <div class="model_property_name">Colour</div>
      <div class="model_property"><span class="property_value">Black</span></div>
    </div>
    <div class="model">
      <h2 class="model_name">Crox 50 4T E5 2021-2024 (EU)</h2>
      <div class="model_property_name">Build Year</div>
      <div class="model_property">2021-2024</div>
      <div class="model_property_name">Engine</div>
      <div class="model_property">50 Carb. AIR 2V E5</div>
      <div class="model_property_name">Model code</div>
      <div class="model_property">AE05WB-EU (M1-M4)</div>
      <div class="model_property_name">Frame number</div>
      <div class="model_property">LXMAE05W</div>
      <div class="model_property_name">Colour</div>
      <div class="model_property">White</div>
    </div>
  </div>
</body></html>
"""


def test_parse_model_page_extracts_identity_and_deduplicates_colours():
    rows = parse_model_page(
        MODEL_HTML,
        "https://www.easyparts.com/models/Sym-Crox-50-4T-E5-2021-2024-(EU)-m33274",
    )

    assert len(rows) == 1
    assert rows[0].customer_name == "Crox 50 4T E5 2021-2024 (EU)"
    assert rows[0].year_from == 2021
    assert rows[0].year_to == 2024
    assert rows[0].model_code == "AE05WB-EU"
    assert rows[0].generation == "M1-M4"
    assert rows[0].frame_number == "LXMAE05W"
    assert rows[0].source_model_id == "33274"


def test_parse_sym_model_links_stays_inside_sym_hierarchy():
    assert parse_sym_model_links(MODEL_HTML) == [
        "https://www.easyparts.com/models/Sym-Crox-m23810"
    ]
