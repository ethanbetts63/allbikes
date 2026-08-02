import pytest


@pytest.fixture(autouse=True)
def isolated_product_media_root(tmp_path, settings):
    """Prevent upload tests and image factories writing into real product media."""
    settings.MEDIA_ROOT = tmp_path
