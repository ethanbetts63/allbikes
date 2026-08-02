"""Attach manually reviewed diagram files to their matching parts sections."""
from collections import defaultdict
from pathlib import Path
import re

from django.conf import settings

from parts.ingestion.diagram_images import diagram_webp_bytes
from parts.models import PartSection


CURATED_DIRECTORY = Path("parts/curated-diagrams")
CURATED_FILENAME = re.compile(
    r"^(?P<model_code>.+)_(?P<section_code>[EF]\d{2})\.(?P<extension>webp|png|jpe?g)$",
    re.IGNORECASE,
)
EXTENSION_PRIORITY = {"webp": 0, "png": 1, "jpg": 2, "jpeg": 2}


def _curated_directory():
    return Path(settings.MEDIA_ROOT) / CURATED_DIRECTORY


def _matching_files(directory):
    """Group recognised manually-curated files by their model and section code."""
    grouped = defaultdict(list)
    ignored = 0
    for path in directory.iterdir():
        if not path.is_file():
            continue
        match = CURATED_FILENAME.match(path.name)
        if match is None:
            ignored += 1
            continue
        key = (match["model_code"].upper(), match["section_code"].upper())
        grouped[key].append((path, match["extension"].lower()))

    for candidates in grouped.values():
        candidates.sort(key=lambda candidate: (EXTENSION_PRIORITY[candidate[1]], candidate[0].name.lower()))
    return grouped, ignored


def run(*, stdout, stderr):
    """Link files in ``mediafiles/parts/curated-diagrams`` to their sections.

    A manually saved image must be named ``MODEL_CODE_E01`` (or ``F01``) with
    a PNG, JPEG or WebP extension. PNG/JPEG files are converted to WebP while
    preserving the original source fingerprint used to invalidate stale crops.
    """
    directory = _curated_directory()
    if not directory.exists():
        stdout.write(f"No curated diagrams directory found: {directory}")
        return {"updated": 0, "unmatched": 0, "skipped": 0}

    grouped, ignored = _matching_files(directory)
    updated = 0
    unmatched = 0
    skipped = 0

    for (model_code, section_code), candidates in sorted(grouped.items()):
        path, extension = candidates[0]
        if len(candidates) > 1:
            ignored += len(candidates) - 1
            stdout.write(
                f"Using {path.name} for {model_code} {section_code}; ignored duplicate formats."
            )

        section = PartSection.objects.select_related("parts_model").filter(
            parts_model__model_code__iexact=model_code,
            code__iexact=section_code,
        ).first()
        if section is None:
            unmatched += 1
            stderr.write(f"No parts section matches curated diagram {path.name}.")
            continue
        if not section.diagram_image or not section.diagram_source_hash:
            skipped += 1
            stderr.write(f"Skipped {path.name}: {model_code} {section_code} has no imported source diagram.")
            continue

        selected_path = path
        if extension != "webp":
            try:
                webp = diagram_webp_bytes(path.read_bytes())
            except Exception as exc:
                skipped += 1
                stderr.write(f"Skipped {path.name}: unable to read image ({exc}).")
                continue

            selected_path = directory / f"{section.parts_model.model_code}_{section.code}.webp"
            selected_path.write_bytes(webp)
            path.unlink()

        image_name = str(CURATED_DIRECTORY / selected_path.name).replace("\\", "/")
        section.curated_diagram_image.name = image_name
        section.curated_source_hash = section.diagram_source_hash
        section.save(update_fields=["curated_diagram_image", "curated_source_hash"])
        updated += 1
        stdout.write(f"Linked curated diagram for {section.parts_model.model_code} {section.code}: {selected_path.name}")

    if ignored:
        stdout.write(f"Ignored {ignored} unrecognised or duplicate curated file(s).")
    stdout.write(f"Updated {updated} curated diagram(s); {unmatched} unmatched; {skipped} skipped.")
    return {"updated": updated, "unmatched": unmatched, "skipped": skipped}
