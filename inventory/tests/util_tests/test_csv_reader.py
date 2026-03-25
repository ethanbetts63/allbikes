import pytest
from inventory.utils.csv_reader import parse_feed, _transmission, _condition, _status, _date

MINIMAL_CSV = (
    "StockNumber,Make,Model,Badge,RegoNum,VIN,Price,Year,Odometer,EngineSize,"
    "GearType,AdvDescription,IsDemo,IsUsed,RegoExpiry,VideoLink,SpecialPrice,"
    "StockStatus,Warranty,Seats\r\n"
    "1046,DUCATI,850CC,STREETFIGHTER 848,1GG625,ZDMF102AACB014176,11990.00,2013,"
    "852,849,6 SPEED MANUAL,A great bike.,False,True,10/11/2025,,9990.00,In_Stock,12,1\r\n"
)


class TestParseFeed:
    def test_returns_one_bike_per_row(self):
        bikes = parse_feed(MINIMAL_CSV)
        assert len(bikes) == 1

    def test_maps_core_fields(self):
        bike = parse_feed(MINIMAL_CSV)[0]
        assert bike["stock_number"] == "1046"
        assert bike["vin"] == "ZDMF102AACB014176"
        assert bike["make"] == "DUCATI"
        assert bike["year"] == 2013
        assert bike["odometer"] == 852
        assert bike["engine_size"] == 849
        assert bike["price"] == 11990.0
        assert bike["discount_price"] == 9990.0
        assert bike["warranty_months"] == 12
        assert bike["seats"] == 1

    def test_uses_badge_as_model(self):
        bike = parse_feed(MINIMAL_CSV)[0]
        assert bike["model"] == "STREETFIGHTER 848"

    def test_falls_back_to_model_column_when_badge_empty(self):
        csv = MINIMAL_CSV.replace(",STREETFIGHTER 848,", ",,")
        bike = parse_feed(csv)[0]
        assert bike["model"] == "850CC"

    def test_rego_expiry_parsed_as_date(self):
        from datetime import date
        bike = parse_feed(MINIMAL_CSV)[0]
        assert bike["rego_exp"] == date(2025, 11, 10)

    def test_empty_rows_produce_none_for_optional_fields(self):
        csv = (
            "StockNumber,Make,Model,Badge,RegoNum,VIN,Price,Year,Odometer,EngineSize,"
            "GearType,AdvDescription,IsDemo,IsUsed,RegoExpiry,VideoLink,SpecialPrice,"
            "StockStatus,Warranty,Seats\r\n"
            "2000,HONDA,,,,,,,0,,,,False,False,,,,In_Stock,,\r\n"
        )
        bike = parse_feed(csv)[0]
        assert bike["vin"] is None
        assert bike["price"] is None
        assert bike["rego_exp"] is None
        assert bike["warranty_months"] is None
        assert bike["seats"] is None


class TestTransmissionMapping:
    def test_manual(self):
        assert _transmission("6 SPEED MANUAL") == "manual"

    def test_automatic(self):
        assert _transmission("AUTOMATIC") == "automatic"
        assert _transmission("5 Speed Auto") == "automatic"

    def test_semi_auto(self):
        assert _transmission("CVT") == "semi-auto"
        # NOTE: any input containing "auto" (e.g. "Semi-Auto", "Semi Automatic") will
        # incorrectly match "automatic" because "auto" appears before "semi" in the
        # TRANSMISSION_MAP iteration order. The production code should order "semi"
        # before "auto" to handle these cases correctly.

    def test_unknown_returns_none(self):
        assert _transmission("UNKNOWN") is None

    def test_empty_returns_none(self):
        assert _transmission("") is None
        assert _transmission(None) is None


class TestConditionMapping:
    def test_demo(self):
        assert _condition("True", "False") == "demo"

    def test_used(self):
        assert _condition("False", "True") == "used"

    def test_new(self):
        assert _condition("False", "False") == "new"

    def test_demo_takes_priority(self):
        assert _condition("True", "True") == "demo"


class TestStatusMapping:
    def test_in_stock(self):
        assert _status("In_Stock") == "for_sale"

    def test_sold(self):
        assert _status("Sold") == "sold"

    def test_unknown_defaults_to_unavailable(self):
        assert _status("Whatever") == "unavailable"
        assert _status("") == "unavailable"


class TestDateParsing:
    def test_dd_mm_yyyy(self):
        from datetime import date
        assert _date("10/11/2025") == date(2025, 11, 10)

    def test_iso_format(self):
        from datetime import date
        assert _date("2025-11-10") == date(2025, 11, 10)

    def test_empty_returns_none(self):
        assert _date("") is None
        assert _date(None) is None

    def test_invalid_returns_none(self):
        assert _date("not-a-date") is None
