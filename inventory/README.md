# Inventory Application

The `inventory` application is responsible for managing motorcycle and scooter inventory, including details about each vehicle and associated images. It provides a robust API for viewing, creating, updating, and deleting motorcycle records, with integrated image management.

## Models

### `Motorcycle`
Represents a motorcycle or scooter in the inventory.
-   **Fields**: `make`, `model`, `year`, `price`, `condition` (New, Used, Demo), `status` (For Sale, Sold, Reserved, Unavailable), `is_featured`, `odometer`, `engine_size`, `range`, `seats`, `transmission`, `description`, `youtube_link`, `date_posted`, `rego`, `rego_exp`, `stock_number`, `warranty_months`.
-   **Choices**: Defined for `status`, `condition`, and `transmission`.
-   **String Representation**: Returns `{year} {make} {model}`.

### `MotorcycleImage`
Represents an image associated with a specific `Motorcycle`.
-   **Fields**:
    -   `motorcycle`: ForeignKey to `Motorcycle` (on_delete CASCADE, related_name `images`).
    -   `image`: ImageField for storing the image file (uploaded to `motorcycles/additional/`).
    -   `order`: IntegerField to specify the display order of the image.
-   **String Representation**: Returns `Image for {motorcycle}`.

## Admin Interface (`admin.py`)

Both `Motorcycle` and `MotorcycleImage` models are registered with the Django admin.
-   `MotorcycleAdmin`: Configured with `list_display`, `list_filter`, and `search_fields` for easy management.
-   `MotorcycleImageInline`: Allows `MotorcycleImage` instances to be managed directly within the `Motorcycle`'s admin page, enabling the addition, modification, and reordering of images.

## Serializers (`serializers/`)

### `MotorcycleSerializer`
Serializes the `Motorcycle` model for API consumption.
-   Includes all fields of the `Motorcycle` model.
-   Nests `MotorcycleImageSerializer` for the `images` field, allowing related images to be included directly in motorcycle data.

### `MotorcycleImageSerializer`
Serializes the `MotorcycleImage` model.
-   **Fields**: `id`, `image`, `order`, `motorcycle`.
-   `id` and `motorcycle` are `read_only_fields`.
-   `order` is optional (`required=False`).

## Views (`views/`)

### `MotorcycleViewSet` (at `views/motorcycle_viewset.py`)
A `ModelViewSet` providing full CRUD operations for `Motorcycle` instances.
-   **Permissions**: Public read-only access (`list`, `retrieve`), and admin-only access for write operations (create, update, delete).
-   **Pagination**: Uses `StandardResultsSetPagination` (12 items per page by default).
-   **Filtering**: Supports filtering by `condition`, `is_featured`, `min_price`, `max_price`, `min_year`, `max_year`, `min_engine_size`, `max_engine_size`.
-   **Ordering**: Supports ordering by `price`, `year`, and `engine_size` (ascending or descending), defaulting to `-date_posted`.
-   **Custom Action (`manage_images`)**: An admin-only action (`POST` request to `/bikes/<pk>/manage_images/`) to update the order of existing images and delete images not included in the request payload. It ensures data integrity using atomic transactions.

### `MotorcycleImageView` (at `views/motorcycle_image_view.py`)
An `APIView` for handling image uploads for a specific motorcycle.
-   **Permissions**: Requires `IsAdminUser`.
-   **Parsers**: Uses `MultiPartParser` and `FormParser` for file uploads.
-   **POST Method**: Associates an uploaded image with a `Motorcycle` identified by `motorcycle_pk` in the URL.

## URLs (`urls.py`)

The API endpoints are configured as follows:
-   `/bikes/`: Handled by `MotorcycleViewSet`, providing list and detail views with CRUD capabilities.
-   `/bikes/<int:motorcycle_pk>/images/`: Handled by `MotorcycleImageView` for uploading new images for a specific motorcycle.

## Frontend URL Structure

While the backend API uses simple ID-based lookups, the frontend application employs a more descriptive, SEO-friendly URL structure for displaying bikes to users.

### List Pages
-   **New Bikes**: `/inventory/motorcycles/new`
-   **Used Bikes**: `/inventory/motorcycles/used`

### Detail Page
The detail page for a single bike uses a "slug" for better readability and search engine optimization.
-   **Structure**: `/inventory/motorcycles/:slug`
-   **Slug Format**: The slug is generated in the frontend and follows the pattern `year-make-model-id`.
    -   **Example**: A 2011 Piaggio Fly 150 with a database ID of `15` will have the following URL:
        `/inventory/motorcycles/2011-piaggio-fly-150-15`
-   **Functionality**: The frontend extracts the unique `id` from the end of the slug to fetch the correct bike data from the `/api/inventory/bikes/{id}/` backend endpoint.

## How to Use

### API Endpoints

-   **List all motorcycles**: `GET /api/inventory/bikes/`
-   **Retrieve a single motorcycle**: `GET /api/inventory/bikes/{id}/`
-   **Create a new motorcycle**: `POST /api/inventory/bikes/` (Admin only)
-   **Update a motorcycle**: `PUT /api/inventory/bikes/{id}/` (Admin only)
-   **Partially update a motorcycle**: `PATCH /api/inventory/bikes/{id}/` (Admin only)
-   **Delete a motorcycle**: `DELETE /api/inventory/bikes/{id}/` (Admin only)
-   **Upload an image for a motorcycle**: `POST /api/inventory/bikes/{motorcycle_pk}/images/` (Admin only, requires image file in request body)
-   **Manage images for a motorcycle**: `POST /api/inventory/bikes/{motorcycle_pk}/manage_images/` (Admin only, requires a list of image objects with `id` and `order`)

### Filtering Examples

-   **New bikes**: `/api/inventory/bikes/?condition=new`
-   **Featured bikes**: `/api/inventory/bikes/?is_featured=true`
-   **Bikes between $5000 and $10000**: `/api/inventory/bikes/?min_price=5000&max_price=10000`
-   **Order by price ascending**: `/api/inventory/bikes/?ordering=price_asc`
-   **Combined filters**: `/api/inventory/bikes/?condition=used&min_year=2020&ordering=year_desc`

## Installation

Assuming Django and Django REST Framework are already set up:
1.  Add `'inventory'` to your `INSTALLED_APPS` in `settings.py`.
2.  Include the inventory URLs in your project's `urls.py`:
    ```python
    path('api/inventory/', include('inventory.urls')),
    ```
3.  Run migrations: `python manage.py makemigrations inventory` and `python manage.py migrate`.
