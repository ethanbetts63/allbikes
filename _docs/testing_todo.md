# Testing To-Do List

This document tracks Python files that lack corresponding test files according to the project's testing strategy.

## data_management

The following files in the `data_management` app do not have corresponding tests in the `tests/` directory:

- `management/commands/resize_images.py` (Missing `management_tests/test_resize_images_command.py`)
- `utils/archive_db/base_archiver.py` (Missing `util_tests/test_base_archiver.py`)
- `utils/archive_db/database_archiver.py` (Missing `util_tests/test_database_archiver.py`)
- `utils/archive_db/load_db_from_archive.py` (Missing `util_tests/test_load_db_from_archive.py`)
- `utils/archive_db/model_lister.py` (Missing `util_tests/test_model_lister.py`)
- `utils/generation_utils/terms_generator.py` (Missing `util_tests/test_terms_generator.py`)

## inventory

The following files in the `inventory` app do not have corresponding tests in the `tests/` directory:

- `management/commands/backfill_slugs.py` (Missing `management_tests/test_backfill_slugs_command.py`)

## notifications

The following files in the `notifications` app do not have corresponding tests in the `tests/` directory:

- `management/commands/send_admin_reminders.py` (Missing `management_tests/test_send_admin_reminders_command.py`)

## product

The following files in the `product` app do not have corresponding tests in the `tests/` directory:

- `models/product_image.py` (Missing `model_tests/test_product_image_model.py`)
- `serializers/product_image_serializer.py` (Missing `serializer_tests/test_product_image_serializer.py`)

## service

The following files in the `service` app do not have corresponding tests in the `tests/` directory:

- `serializers/booking_request_log_serializer.py` (Missing `serializer_tests/test_booking_request_log_serializer.py`)
- `views/booking_request_log_admin_view.py` (Missing `view_tests/test_booking_request_log_admin_view.py`)

## allbikes (Core)

The following files in the `allbikes` core directory do not have corresponding tests:

- `middleware.py` (Missing `tests/test_middleware.py`)
- `sitemaps.py` (Missing `tests/test_sitemaps.py`)

