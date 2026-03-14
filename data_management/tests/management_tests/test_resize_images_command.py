import os
import shutil
from io import BytesIO
from PIL import Image
from django.core.management import call_command
import pytest

@pytest.fixture
def temp_image_path(tmp_path):
    # Create a temporary image
    image_path = tmp_path / "test_image.jpg"
    img = Image.new('RGB', (2000, 1000), color='red')
    img.save(image_path)
    return str(image_path)

def test_resize_images_command(temp_image_path, capsys):
    # Run the command
    call_command('resize_images', temp_image_path)

    # Check output
    captured = capsys.readouterr()
    assert "Successfully created" in captured.out

    # Check if files were created
    directory, filename = os.path.split(temp_image_path)
    name, _ = os.path.splitext(filename)
    widths = [320, 640, 768, 1024, 1280]

    for width in widths:
        expected_filename = f"{name}-{width}w.webp"
        expected_path = os.path.join(directory, expected_filename)
        assert os.path.exists(expected_path)
        
        # Verify image dimensions
        with Image.open(expected_path) as img:
            assert img.width == width
            # Original aspect ratio is 2000/1000 = 2.0 (width/height) -> height = width / 2.0
            # Wait, script logic: aspect_ratio = img.height / img.width = 0.5
            # height = int(width * 0.5)
            assert img.height == int(width * 0.5)
            assert img.format == 'WEBP'

def test_resize_images_command_missing_file(capsys):
    call_command('resize_images', 'non_existent_file.jpg')
    captured = capsys.readouterr()
    assert "Image not found at: non_existent_file.jpg" in captured.out

def test_resize_images_command_invalid_image(tmp_path, capsys):
    # Create a file that is not an image
    bad_file = tmp_path / "bad_file.txt"
    bad_file.write_text("This is not an image")
    
    call_command('resize_images', str(bad_file))
    captured = capsys.readouterr()
    assert "An error occurred" in captured.out
