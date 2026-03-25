from pathlib import Path

from django.conf import settings

from ..models import Motorcycle, MotorcycleImage

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

    stdout.write(f"Bikes: {created} created, {updated} updated")
    return created, updated


def link_images(stdout, bikes):
    media_dir = Path(settings.MEDIA_ROOT) / "motorcycles" / "additional"
    existing_images = set(MotorcycleImage.objects.values_list("image", flat=True))
    linked = 0

    for data in bikes:
        stock_number = data.get("stock_number")
        if not stock_number:
            continue

        bike = Motorcycle.objects.filter(stock_number=stock_number).first()
        if not bike:
            continue

        image_files = sorted(
            media_dir.glob(f"{stock_number}_*"),
            key=_image_order
        )

        for path in image_files:
            relative = f"motorcycles/additional/{path.name}"
            if relative in existing_images:
                continue
            MotorcycleImage.objects.create(
                motorcycle=bike,
                image=relative,
                order=_image_order(path),
            )
            existing_images.add(relative)
            linked += 1

    stdout.write(f"Images linked: {linked}")
    return linked


def get_existing_image_paths():
    return set(MotorcycleImage.objects.values_list("image", flat=True))


def _image_order(path):
    try:
        return int(path.stem.rsplit("_", 1)[-1])
    except (ValueError, IndexError):
        return 0
