"""WebP encoding for imported and reviewed exploded diagrams."""
from io import BytesIO

from PIL import Image


def diagram_webp_bytes(data: bytes) -> bytes:
    """Encode a supplier diagram as WebP without changing its source fingerprint.

    PNG diagrams are typically sharp line art, so they use lossless WebP. JPEG
    source sheets are already lossy photographs/screenshots; high-quality WebP
    keeps their labels legible while reducing their transfer size.
    """
    with Image.open(BytesIO(data)) as image:
        image.load()
        return diagram_webp_from_image(image, source_format=image.format)


def diagram_webp_from_image(image: Image.Image, *, source_format: str | None = None) -> bytes:
    """Encode an already-open diagram image as WebP."""
    has_alpha = image.mode in {"RGBA", "LA"} or "transparency" in image.info
    if image.mode not in {"RGB", "RGBA"}:
        image = image.convert("RGBA" if has_alpha else "RGB")

    output = BytesIO()
    options = {"format": "WEBP", "method": 6}
    if (source_format or "").upper() == "PNG":
        options.update({"lossless": True, "quality": 100})
    else:
        options.update({"quality": 90})
    image.save(output, **options)
    return output.getvalue()
