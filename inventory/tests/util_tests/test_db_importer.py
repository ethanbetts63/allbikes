import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path

from inventory.models import Motorcycle, MotorcycleImage
from inventory.utils.db_importer import import_bikes, link_images, get_existing_image_paths
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory


BIKE_DATA = {
    "stock_number": "1046",
    "vin": "ZDMF102AACB014176",
    "make": "DUCATI",
    "model": "STREETFIGHTER 848",
    "year": 2013,
    "price": 11990.0,
    "discount_price": None,
    "odometer": 852,
    "engine_size": 849,
    "transmission": "manual",
    "description": "A great bike.",
    "condition": "used",
    "rego": "1GG625",
    "rego_exp": None,
    "youtube_link": None,
    "status": "for_sale",
    "warranty_months": 12,
    "seats": 1,
}


@pytest.mark.django_db
class TestImportBikes:
    def test_creates_new_bike(self, capsys):
        import_bikes(MagicMock(), [BIKE_DATA])
        assert Motorcycle.objects.filter(vin="ZDMF102AACB014176").exists()

    def test_reports_created_count(self):
        stdout = MagicMock()
        created, updated = import_bikes(stdout, [BIKE_DATA])
        assert created == 1
        assert updated == 0
        stdout.write.assert_called_with("Bikes: 1 created, 0 updated")

    def test_updates_existing_bike_by_vin(self):
        MotorcycleFactory(vin="ZDMF102AACB014176", make="OLD MAKE", stock_number="1046")
        stdout = MagicMock()
        import_bikes(stdout, [BIKE_DATA])
        bike = Motorcycle.objects.get(vin="ZDMF102AACB014176")
        assert bike.make == "DUCATI"
        stdout.write.assert_called_with("Bikes: 0 created, 1 updated")

    def test_updates_existing_bike_by_stock_number_when_no_vin(self):
        MotorcycleFactory(vin=None, stock_number="1046", make="OLD MAKE")
        data = {**BIKE_DATA, "vin": None}
        import_bikes(MagicMock(), [data])
        bike = Motorcycle.objects.get(stock_number="1046")
        assert bike.make == "DUCATI"

    def test_csv_fields_always_overwrite_existing_values(self):
        MotorcycleFactory(vin="ZDMF102AACB014176", stock_number="1046", price=99999)
        import_bikes(MagicMock(), [BIKE_DATA])
        bike = Motorcycle.objects.get(vin="ZDMF102AACB014176")
        assert float(bike.price) == 11990.0

    def test_no_duplicate_bikes_on_repeated_import(self):
        import_bikes(MagicMock(), [BIKE_DATA])
        import_bikes(MagicMock(), [BIKE_DATA])
        assert Motorcycle.objects.filter(vin="ZDMF102AACB014176").count() == 1

    def test_handles_empty_list(self):
        stdout = MagicMock()
        created, updated = import_bikes(stdout, [])
        assert created == 0 and updated == 0
        stdout.write.assert_called_with("Bikes: 0 created, 0 updated")


@pytest.mark.django_db
class TestLinkImages:
    def _make_mock_path(self, name):
        p = MagicMock(spec=Path)
        p.name = name
        p.stem = name.rsplit(".", 1)[0]
        return p

    def test_creates_motorcycle_image_records(self, settings, tmp_path):
        settings.MEDIA_ROOT = str(tmp_path)
        media_dir = tmp_path / "motorcycles" / "additional"
        media_dir.mkdir(parents=True)
        (media_dir / "1046_1.jpg").write_bytes(b"img")
        (media_dir / "1046_2.jpg").write_bytes(b"img")

        bike = MotorcycleFactory(stock_number="1046")
        link_images(MagicMock(), [{"stock_number": "1046"}])

        assert bike.images.count() == 2

    def test_skips_already_linked_images(self, settings, tmp_path):
        settings.MEDIA_ROOT = str(tmp_path)
        media_dir = tmp_path / "motorcycles" / "additional"
        media_dir.mkdir(parents=True)
        (media_dir / "1046_1.jpg").write_bytes(b"img")

        bike = MotorcycleFactory(stock_number="1046")
        MotorcycleImage.objects.create(motorcycle=bike, image="motorcycles/additional/1046_1.jpg", order=1)

        link_images(MagicMock(), [{"stock_number": "1046"}])
        assert bike.images.count() == 1

    def test_images_ordered_correctly(self, settings, tmp_path):
        settings.MEDIA_ROOT = str(tmp_path)
        media_dir = tmp_path / "motorcycles" / "additional"
        media_dir.mkdir(parents=True)
        for i in [3, 1, 2]:
            (media_dir / f"1046_{i}.jpg").write_bytes(b"img")

        bike = MotorcycleFactory(stock_number="1046")
        link_images(MagicMock(), [{"stock_number": "1046"}])

        orders = list(bike.images.order_by("order").values_list("order", flat=True))
        assert orders == [1, 2, 3]

    def test_skips_bike_with_no_stock_number(self):
        stdout = MagicMock()
        link_images(stdout, [{"stock_number": None}])
        assert MotorcycleImage.objects.count() == 0

    def test_reports_linked_count(self, settings, tmp_path):
        settings.MEDIA_ROOT = str(tmp_path)
        media_dir = tmp_path / "motorcycles" / "additional"
        media_dir.mkdir(parents=True)
        (media_dir / "1046_1.jpg").write_bytes(b"img")

        MotorcycleFactory(stock_number="1046")
        stdout = MagicMock()
        linked = link_images(stdout, [{"stock_number": "1046"}])
        assert linked == 1
        stdout.write.assert_called_with("Images linked: 1")


@pytest.mark.django_db
class TestGetExistingImagePaths:
    def test_returns_set_of_image_paths(self):
        bike = MotorcycleFactory()
        MotorcycleImage.objects.create(motorcycle=bike, image="motorcycles/additional/test_1.jpg", order=1)
        paths = get_existing_image_paths()
        assert "motorcycles/additional/test_1.jpg" in paths

    def test_returns_empty_set_when_no_images(self):
        assert get_existing_image_paths() == set()
