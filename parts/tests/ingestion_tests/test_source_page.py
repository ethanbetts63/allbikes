from datetime import date

from parts.ingestion import source_page

SAMPLE_HTML = """
<main>
  <h2>50cc</h2>
  <a href="https://x/wp-content/uploads/2017/11/Spare-Parts-Book-Classic-50-AW05W-8-AKH-1.xls">Classic 50</a>
  <a href="https://x/wp-content/uploads/2022/07/CROX50-AE05W6-RU.xls">CROX50</a>
  <h2>100cc – 165cc</h2>
  <a href="https://x/wp-content/uploads/2017/11/Spare-Parts-Book-Classic-150-AX15W2-6.xls">Classic 150</a>
  <a href="https://x/sym-service-manuals/">Service Manuals</a>
  <h2>ATV's</h2>
  <a href="https://x/wp-content/uploads/2020/01/Quadlander-300-UA30A-A.xls">Quadlander 300</a>
  <a href="https://www.selectportal.com.au/wp-content/uploads/2026/07/PA-16-Jul-26.csv">SYM Spare Parts Price &amp; Availability</a>
</main>
"""


class TestParseBooks:
    def test_finds_only_xls_links(self):
        books = source_page.parse_books(SAMPLE_HTML)
        assert len(books) == 4  # excludes the service-manuals link and the CSV

    def test_assigns_cc_class_from_heading(self):
        books = {b["name"]: b for b in source_page.parse_books(SAMPLE_HTML)}
        assert books["Classic 50"]["cc_class"] == "50"
        assert books["Classic 150"]["cc_class"] == "100_165"
        assert books["Quadlander 300"]["cc_class"] == "atv"


class TestParsePaLink:
    def test_extracts_url_and_date(self):
        url, pa_date = source_page.parse_pa_link(SAMPLE_HTML)
        assert url.endswith("PA-16-Jul-26.csv")
        assert pa_date == date(2026, 7, 16)

    def test_missing_link(self):
        assert source_page.parse_pa_link("<main>nothing</main>") == (None, None)
