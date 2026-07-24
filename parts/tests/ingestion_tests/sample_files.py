"""Paths to the sample SYM source files committed under data_management/."""
from pathlib import Path

from django.conf import settings

_DATA = Path(settings.BASE_DIR) / "data_management" / "data" / "sym_parts_files"

SAMPLE_XLS = _DATA / "Spare-Parts-Book-Classic-150-AX15W2-6.xls"
SAMPLE_PA_CSV = _DATA / "PA-16-Jul-26 (1).csv"
