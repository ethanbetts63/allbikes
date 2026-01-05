# Data Management Application

The `data_management` application is a central hub for managing various static and dynamic data elements across the Allbikes platform. It encompasses global site settings, brand information, terms and conditions, and user profiles, along with robust utilities for data generation, archiving, and maintenance.

## Models

### `SiteSettings`
A singleton model containing global configuration for the website.
-   **Fields**: Feature toggles (`enable_motorcycle_mover`, `enable_banner`), banner text, contact information (`phone_number`, `email_address`, `street_address`, `address_locality`, `address_region`, `postal_code`), business registration numbers (`mrb_number`, `abn_number`, `md_number`), social media links (`youtube_link`, `instagram_link`, `facebook_link`), and daily `opening_hours`.
-   **Purpose**: Provides a centralized, editable source for dynamic site-wide parameters.

### `Brand`
Stores information about motorcycle/scooter brands.
-   **Fields**: `name` (unique), `serviceable` (boolean indicating if the brand is serviceable).
-   **Purpose**: Used for listing brands, filtering inventory, and potentially for service inquiries.

### `TermsAndConditions`
Manages different versions of the terms and conditions.
-   **Fields**: `version` (unique identifier, e.g., "1.0"), `content` (full HTML content), `published_at` (datetime of publication).
-   **Purpose**: Ensures proper versioning and access to legal documents displayed on the site.

## Admin Interface (`admin.py`)

-   `SiteSettings` and `TermsAndConditions` models are registered, allowing administrators to manage global site configurations and publish new versions of terms.
-   The `Brand` model is not directly registered, suggesting its management might occur through data generation commands or other automated processes.

## Serializers (`serializers/`)

### `SiteSettingsSerializer`
A `ModelSerializer` for the `SiteSettings` model, exposing all its fields for API access.

### `BrandSerializer`
A `ModelSerializer` for the `Brand` model, exposing `id`, `name`, and `serviceable` fields.

### `UserProfileSerializer`
A `ModelSerializer` for Django's built-in `User` model.
-   **Fields**: `id`, `username`, `email`, `first_name`, `last_name`, `is_staff`.
-   **Purpose**: Provides a standardized way to expose authenticated user profile data, likely for frontend display or administrative user management.

## Views (`views/`)

### `SiteSettingsViewSet`
-   Manages the singleton `SiteSettings` object.
-   **Permissions**: Publicly accessible for `retrieve` operations (`AllowAny`), but `update` and `partial_update` operations require `IsAdminUser`.

### `BrandListView`
-   A `ListAPIView` providing a publicly accessible (`AllowAny`) list of all `Brand` objects, ordered by name.

### `LatestTermsAndConditionsView`
-   An `APIView` that returns the most recent version of the `TermsAndConditions`.
-   **Permissions**: Publicly accessible (`AllowAny`).
-   **Caching**: Utilizes `@cache_page(60 * 60 * 24)` to cache the response for 24 hours, optimizing performance for this static content.

### `UserProfileView`
-   An `APIView` for retrieving the authenticated user's profile.
-   **Permissions**: Requires `IsAuthenticated`.

## URLs (`urls.py`)

The API endpoints are:
-   `GET /api/data/me/`: Retrieve the authenticated user's profile.
-   `GET, PUT, PATCH /api/data/settings/`: Retrieve (public) and update (admin-only) global site settings.
-   `GET /api/data/brands/`: Retrieve a list of all brands.
-   *(Note: The view for Terms and Conditions is present but not explicitly mapped in the provided `urls.py` snippet for this app. It's expected to be mapped in the project's root `urls.py` or another app that includes it.)*

## Management Commands (`management/commands/`)

This directory contains custom Django management commands for various data operations:

-   `clean_motorcycle_json.py`: Cleans exported motorcycle JSON data to match current model schema, including field renaming and removal of obsolete fields. Essential for data migration.
-   `download_scootershop_images.py`: Downloads images from a legacy "Scootershop" website, preparing them for migration to the new platform.
-   `fix_site_domains.py`: Updates the domain for the default Django `Site` object, typically used after deployment or domain changes.
-   `generate.py`: An orchestrator command for generating various types of data. It dispatches to specialized utilities for:
    -   `--terms`: Generating `TermsAndConditions` from HTML files.
    -   `--archive`: Archiving the current database state to JSON files.
    -   `--brands`: Generating `Brand` data from a JSONL file.
    -   *(Note: The command references `--faqs` but this flag is not defined in `add_arguments`.)*
-   `organize_images.py`: Organizes downloaded motorcycle images into a structured directory within the frontend assets, making them ready for responsive web delivery.
-   `resize_images.py`: Resizes a given image to multiple widths and converts it to WEBP format for responsive web optimization.
-   `update.py`: A utility for loading the database from the latest JSON archive. It performs a destructive `flush` before loading data and requires explicit user confirmation.

## Data Files (`data/`)

This directory holds raw data files used by various generation and update processes:
-   `brands.jsonl`: Contains `Brand` data in JSON Lines format, used by `BrandUpdateOrchestrator`.
-   `faqs.jsonl`: (Currently empty) Intended to hold FAQ data, likely for a `Faq` model or similar data structure.
-   `reviews.jsonl`: (Currently empty) Likely intended for review data.
-   `terms_v1.html`: (Currently empty) Intended to hold the HTML content for a specific version of terms and conditions.
-   `archive/db_backups/`: Directory where database archives are stored by `DatabaseArchiver`.

## Utilities (`utils/`)

### `archive_db/`
Provides tools for database archiving and restoration:
-   `base_archiver.py`: Defines a `BaseArchiver` class for common archiving functionalities.
-   `database_archiver.py`: Extends `BaseArchiver` to dump all non-system Django models to JSON files.
-   `load_db_from_archive.py`: Restores the database from the latest JSON archive, including a `flush` operation and careful loading order for dependencies.
-   `model_lister.py`: A utility to dynamically retrieve lists of installed Django models, excluding specified applications.

### `generation_utils/`
Contains orchestrators for generating specific data types:
-   `brand_generator.py`: `BrandUpdateOrchestrator` reads `brands.jsonl` and `update_or_create` `Brand` instances.
-   `terms_generator.py`: `TermsUpdateOrchestrator` scans `data_management/data/legal/` for `terms_v*.html` files, extracts versions, and creates new `TermsAndConditions` objects.

## Installation

Assuming Django and Django REST Framework are already set up:
1.  Add `'data_management'` to your `INSTALLED_APPS` in `settings.py`.
2.  Include the `data_management` URLs in your project's `urls.py`:
    ```python
    path('api/data/', include('data_management.urls')),
    ```
3.  Run migrations: `python manage.py makemigrations data_management` and `python manage.py migrate`.
