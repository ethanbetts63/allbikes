import shutil
from pathlib import Path

from django.conf import settings

from ..models import Motorcycle, MotorcycleImage
from .ftp_download import IMAGES_DIR

# Fields the CSV is authoritative over
CSV_FIELDS = [
    "stock_number", "vin", "make", "model", "year", "price", "discount_price",
    "odometer", "engine_size", "transmission", "description", "condition",
    "rego", "rego_exp", "youtube_link", "status", "warranty_months", "seats",
]


def import_bikes(stdout, bikes):
    created = updated = 0

    for data in bikes:
        vin = data.get("vin")
        stock_number = data.get("stock_number")

        bike = None
        if vin:
            bike = Motorcycle.objects.filter(vin=vin).first()
        if bike is None and stock_number:
            bike = Motorcycle.objects.filter(stock_number=stock_number).first()

        if bike is None:
            bike = Motorcycle()
            created += 1
        else:
            updated += 1

        for field in CSV_FIELDS:
            setattr(bike, field, data.get(field))

        bike.save()
        _import_images(bike, stock_number)

    stdout.write(f"Bikes: {created} created, {updated} updated")


def _import_images(bike, stock_number):
    if not stock_number:
        return

    media_dir = Path(settings.MEDIA_ROOT) / "motorcycles" / "additional"
    media_dir.mkdir(parents=True, exist_ok=True)

    inbox_images = sorted(
        IMAGES_DIR.glob(f"{stock_number}_*"),
        key=_image_order
    )

    for src in inbox_images:
        dest_relative = f"motorcycles/additional/{src.name}"
        dest_absolute = Path(settings.MEDIA_ROOT) / dest_relative

        # Skip if already linked to this bike
        if bike.images.filter(image=dest_relative).exists():
            continue

        shutil.copy2(src, dest_absolute)

        order = _image_order(src)
        MotorcycleImage.objects.create(motorcycle=bike, image=dest_relative, order=order)


def _image_order(path):
    try:
        return int(path.stem.rsplit("_", 1)[-1])
    except (ValueError, IndexError):
        return 0
