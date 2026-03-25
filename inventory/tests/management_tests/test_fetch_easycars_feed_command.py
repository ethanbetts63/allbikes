import pytest
from unittest.mock import patch, MagicMock
from django.core.management import call_command


PARSED_BIKES = [
    {
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
]


@pytest.mark.django_db
class TestFetchEasycarsFeedCommand:

    @patch("inventory.management.commands.fetch_easycars_feed.link_images")
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_images")
    @patch("inventory.management.commands.fetch_easycars_feed.import_bikes")
    @patch("inventory.management.commands.fetch_easycars_feed.parse_feed", return_value=PARSED_BIKES)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_csv", return_value="csv,data")
    def test_runs_full_pipeline(self, mock_fetch_csv, mock_parse, mock_import, mock_fetch_images, mock_link):
        call_command("fetch_easycars_feed")
        mock_fetch_csv.assert_called_once()
        mock_parse.assert_called_once_with("csv,data")
        mock_import.assert_called_once()
        mock_fetch_images.assert_called_once()
        mock_link.assert_called_once()

    @patch("inventory.management.commands.fetch_easycars_feed.link_images")
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_images")
    @patch("inventory.management.commands.fetch_easycars_feed.import_bikes")
    @patch("inventory.management.commands.fetch_easycars_feed.parse_feed")
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_csv", return_value=None)
    def test_aborts_if_csv_fetch_returns_none(self, mock_fetch_csv, mock_parse, mock_import, mock_fetch_images, mock_link):
        call_command("fetch_easycars_feed")
        mock_parse.assert_not_called()
        mock_import.assert_not_called()
        mock_fetch_images.assert_not_called()
        mock_link.assert_not_called()

    @patch("inventory.management.commands.fetch_easycars_feed.link_images")
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_images")
    @patch("inventory.management.commands.fetch_easycars_feed.import_bikes")
    @patch("inventory.management.commands.fetch_easycars_feed.parse_feed", return_value=PARSED_BIKES)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_csv", return_value="csv,data")
    def test_passes_stock_numbers_to_fetch_images(self, mock_fetch_csv, mock_parse, mock_import, mock_fetch_images, mock_link):
        call_command("fetch_easycars_feed")
        args, kwargs = mock_fetch_images.call_args
        stock_numbers = args[2]
        assert "1046" in stock_numbers

    @patch("inventory.management.commands.fetch_easycars_feed.link_images")
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_images")
    @patch("inventory.management.commands.fetch_easycars_feed.import_bikes")
    @patch("inventory.management.commands.fetch_easycars_feed.parse_feed", return_value=PARSED_BIKES)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_csv", return_value="csv,data")
    def test_outputs_done_on_success(self, mock_fetch_csv, mock_parse, mock_import, mock_fetch_images, mock_link, capsys):
        call_command("fetch_easycars_feed")
        captured = capsys.readouterr()
        assert "Done." in captured.out
