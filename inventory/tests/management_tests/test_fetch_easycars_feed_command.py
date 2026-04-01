import pytest
from unittest.mock import patch, MagicMock
from contextlib import contextmanager
from django.core.management import call_command

# Force module into sys.modules so patch() can resolve it
import inventory.management.commands.fetch_easycars_feed  # noqa: F401

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


def _make_ftp_patch():
    """Return a context-manager mock and the underlying FTP mock."""
    mock_ftp = MagicMock()

    @contextmanager
    def _ctx():
        yield mock_ftp

    return _ctx, mock_ftp


@pytest.mark.django_db
class TestFetchEasycarsFeedCommand:

    @patch("inventory.management.commands.fetch_easycars_feed.link_images", return_value=0)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_images")
    @patch("inventory.management.commands.fetch_easycars_feed.import_bikes", return_value=(1, 0))
    @patch("inventory.management.commands.fetch_easycars_feed.parse_feed", return_value=PARSED_BIKES)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_csv", return_value="csv,data")
    @patch("inventory.management.commands.fetch_easycars_feed.ftp_connection")
    def test_runs_full_pipeline(self, mock_conn, mock_fetch_csv, mock_parse, mock_import, mock_fetch_images, mock_link):
        ctx, _ = _make_ftp_patch()
        mock_conn.side_effect = ctx
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
    @patch("inventory.management.commands.fetch_easycars_feed.ftp_connection")
    def test_aborts_if_csv_fetch_returns_none(self, mock_conn, mock_fetch_csv, mock_parse, mock_import, mock_fetch_images, mock_link):
        ctx, _ = _make_ftp_patch()
        mock_conn.side_effect = ctx
        call_command("fetch_easycars_feed")
        mock_parse.assert_not_called()
        mock_import.assert_not_called()
        mock_fetch_images.assert_not_called()
        mock_link.assert_not_called()

    @patch("inventory.management.commands.fetch_easycars_feed.link_images", return_value=0)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_images")
    @patch("inventory.management.commands.fetch_easycars_feed.import_bikes", return_value=(1, 0))
    @patch("inventory.management.commands.fetch_easycars_feed.parse_feed", return_value=PARSED_BIKES)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_csv", return_value="csv,data")
    @patch("inventory.management.commands.fetch_easycars_feed.ftp_connection")
    def test_passes_stock_numbers_to_fetch_images(self, mock_conn, mock_fetch_csv, mock_parse, mock_import, mock_fetch_images, mock_link):
        ctx, _ = _make_ftp_patch()
        mock_conn.side_effect = ctx
        call_command("fetch_easycars_feed")
        args, kwargs = mock_fetch_images.call_args
        assert "1046" in args[2]

    @patch("inventory.management.commands.fetch_easycars_feed.link_images", return_value=0)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_images")
    @patch("inventory.management.commands.fetch_easycars_feed.import_bikes", return_value=(1, 0))
    @patch("inventory.management.commands.fetch_easycars_feed.parse_feed", return_value=PARSED_BIKES)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_csv", return_value="csv,data")
    @patch("inventory.management.commands.fetch_easycars_feed.ftp_connection")
    def test_outputs_done_on_success(self, mock_conn, mock_fetch_csv, mock_parse, mock_import, mock_fetch_images, mock_link, capsys):
        ctx, _ = _make_ftp_patch()
        mock_conn.side_effect = ctx
        call_command("fetch_easycars_feed")
        captured = capsys.readouterr()
        assert "Done." in captured.out

    @patch("inventory.management.commands.fetch_easycars_feed.link_images", return_value=2)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_images")
    @patch("inventory.management.commands.fetch_easycars_feed.import_bikes", return_value=(1, 3))
    @patch("inventory.management.commands.fetch_easycars_feed.parse_feed", return_value=PARSED_BIKES)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_csv", return_value="csv,data")
    @patch("inventory.management.commands.fetch_easycars_feed.ftp_connection")
    def test_writes_log_when_db_changes_occur(self, mock_conn, mock_fetch_csv, mock_parse, mock_import, mock_fetch_images, mock_link, tmp_path):
        ctx, _ = _make_ftp_patch()
        mock_conn.side_effect = ctx
        import inventory.management.commands.fetch_easycars_feed as cmd_module
        original_log_path = cmd_module.LOG_PATH
        cmd_module.LOG_PATH = tmp_path / "feed_import.log"
        try:
            call_command("fetch_easycars_feed")
            assert cmd_module.LOG_PATH.exists()
            content = cmd_module.LOG_PATH.read_text()
            assert "bikes_created=1" in content
            assert "bikes_updated=3" in content
            assert "images_linked=2" in content
        finally:
            cmd_module.LOG_PATH = original_log_path

    @patch("inventory.management.commands.fetch_easycars_feed.link_images", return_value=0)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_images")
    @patch("inventory.management.commands.fetch_easycars_feed.import_bikes", return_value=(0, 0))
    @patch("inventory.management.commands.fetch_easycars_feed.parse_feed", return_value=PARSED_BIKES)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_csv", return_value="csv,data")
    @patch("inventory.management.commands.fetch_easycars_feed.ftp_connection")
    def test_skips_log_when_no_db_changes(self, mock_conn, mock_fetch_csv, mock_parse, mock_import, mock_fetch_images, mock_link, tmp_path):
        ctx, _ = _make_ftp_patch()
        mock_conn.side_effect = ctx
        import inventory.management.commands.fetch_easycars_feed as cmd_module
        original_log_path = cmd_module.LOG_PATH
        cmd_module.LOG_PATH = tmp_path / "feed_import.log"
        try:
            call_command("fetch_easycars_feed")
            assert not cmd_module.LOG_PATH.exists()
        finally:
            cmd_module.LOG_PATH = original_log_path

    @patch("inventory.management.commands.fetch_easycars_feed.link_images", return_value=1)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_images")
    @patch("inventory.management.commands.fetch_easycars_feed.import_bikes", return_value=(1, 0))
    @patch("inventory.management.commands.fetch_easycars_feed.parse_feed", return_value=PARSED_BIKES)
    @patch("inventory.management.commands.fetch_easycars_feed.fetch_csv", return_value="csv,data")
    @patch("inventory.management.commands.fetch_easycars_feed.ftp_connection")
    def test_log_appends_on_multiple_runs(self, mock_conn, mock_fetch_csv, mock_parse, mock_import, mock_fetch_images, mock_link, tmp_path):
        ctx, _ = _make_ftp_patch()
        mock_conn.side_effect = ctx
        import inventory.management.commands.fetch_easycars_feed as cmd_module
        original_log_path = cmd_module.LOG_PATH
        cmd_module.LOG_PATH = tmp_path / "feed_import.log"
        try:
            call_command("fetch_easycars_feed")
            call_command("fetch_easycars_feed")
            lines = cmd_module.LOG_PATH.read_text().strip().splitlines()
            assert len(lines) == 2
        finally:
            cmd_module.LOG_PATH = original_log_path
