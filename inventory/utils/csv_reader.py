import csv
import io
from datetime import datetime

TRANSMISSION_MAP = {
    "manual": "manual",
    "automatic": "automatic",
    "auto": "automatic",
    "semi": "semi-auto",
    "cvt": "semi-auto",
}

STATUS_MAP = {
    "in_stock": "for_sale",
    "sold": "sold",
}


def parse_feed(csv_text):
    bikes = []
    reader = csv.DictReader(io.StringIO(csv_text))
    for row in reader:
        bikes.append(_map_row(row))
    return bikes


def _map_row(row):
    return {
        "stock_number": _str(row.get("StockNumber")),
        "vin": _str(row.get("VIN")),
        "make": _str(row.get("Make")),
        "model": _str(row.get("Badge")) or _str(row.get("Model")),
        "year": _int(row.get("Year")),
        "price": _decimal(row.get("Price")),
        "discount_price": _decimal(row.get("SpecialPrice")),
        "odometer": _int(row.get("Odometer")) or 0,
        "engine_size": _int(row.get("EngineSize")),
        "transmission": _transmission(row.get("GearType")),
        "description": _str(row.get("AdvDescription")),
        "condition": _condition(row.get("IsDemo"), row.get("IsUsed")),
        "rego": _str(row.get("RegoNum")),
        "rego_exp": _date(row.get("RegoExpiry")),
        "youtube_link": _str(row.get("VideoLink")),
        "status": _status(row.get("StockStatus")),
        "warranty_months": _int(row.get("Warranty")),
        "seats": _int(row.get("Seats")),
    }


def _str(val):
    v = (val or "").strip()
    return v if v else None


def _int(val):
    try:
        return int(float((val or "").strip()))
    except (ValueError, AttributeError):
        return None


def _decimal(val):
    try:
        v = float((val or "").strip())
        return v if v > 0 else None
    except (ValueError, AttributeError):
        return None


def _date(val):
    v = (val or "").strip()
    if not v:
        return None
    for fmt in ("%d/%m/%Y", "%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(v, fmt).date()
        except ValueError:
            continue
    return None


def _transmission(val):
    v = (val or "").lower()
    for keyword, mapped in TRANSMISSION_MAP.items():
        if keyword in v:
            return mapped
    return None


def _condition(is_demo, is_used):
    if (is_demo or "").strip().lower() == "true":
        return "demo"
    if (is_used or "").strip().lower() == "true":
        return "used"
    return "new"


def _status(val):
    v = (val or "").strip().lower()
    return STATUS_MAP.get(v, "unavailable")
