# Service Application

The `service` application manages the booking and service-related functionalities, with a strong focus on integration with an external "Mechanics Desk" API. It handles customer booking requests from the frontend, provides configuration for these bookings, and manages job types.

## Models

### `ServiceSettings`
A singleton model that stores global configuration for the service application.
-   **Fields**: `booking_advance_notice` (minimum days notice for booking), `drop_off_start_time`, `drop_off_end_time`.
-   **Purpose**: Provides configurable parameters for the booking process, ensuring consistency across the application.

### `JobType`
Stores supplementary details for job types, primarily intended to enrich data fetched from the external MechanicDesk API.
-   **Fields**: `name` (unique, corresponding to MechanicDesk job type), `description` (customer-facing).
-   **Purpose**: Allows local customization or additional information for service types offered, without altering the external system.

### `BookingRequestLog`
Logs every booking request made from our system to the external Mechanics Desk API.
-   **Fields**: `customer_name`, `customer_email`, `vehicle_registration` (from frontend), `request_payload` (JSON sent to MechanicDesk), `response_status_code`, `response_body` (JSON from MechanicDesk), `created_at`, `status` (Success/Failed).
-   **Purpose**: Essential for auditing, debugging, and monitoring the communication with the Mechanics Desk API. It provides a historical record of all booking attempts and their outcomes.

## Admin Interface (`admin.py`)

-   Only `ServiceSettings` is registered in the Django admin, allowing administrators to configure global booking parameters.
-   `JobType` and `BookingRequestLog` are not directly exposed in the default admin interface, suggesting that `JobType` management might be primarily through data synchronization or API and `BookingRequestLog` is purely for backend logging.

## Serializers (`serializers/`)

### `ServiceSettingsSerializer`
A `ModelSerializer` for the `ServiceSettings` model, used for retrieving and updating global service configurations.

### `JobTypeSerializer`
A `ModelSerializer` for the `JobType` model, exposing its `id`, `name`, and `description`. Used for displaying job type information.

### `BookingSerializer`
A crucial `Serializer` (not `ModelSerializer`) specifically designed to:
-   **Validate Incoming Data**: It defines a comprehensive set of fields for customer details, vehicle details, and booking specifics, directly matching the data expected from a frontend booking form.
-   **Format for Mechanics Desk API**: Its `validate` method performs data transformations (e.g., combining names, converting numeric/boolean fields to strings) to ensure the payload is correctly formatted for the external Mechanics Desk API. This serializer acts as the direct interface for data flowing from the frontend to the Mechanics Desk integration.

## Views (`views/`)

### `ServiceSettingsViewSet`
-   Provides read (`retrieve`) and update (`update`, `partial_update`) operations for the singleton `ServiceSettings` instance.
-   **Permissions**: Restricted to `IsAdminUser`.

### `JobTypeAdminViewSet`
-   A `ModelViewSet` offering full CRUD (Create, Retrieve, Update, Delete) functionality for `JobType` instances.
-   **Permissions**: Restricted to `IsAdminUser`. Allows administrators to manage customer-facing job type descriptions.

### `BookingViewSet`
This `ViewSet` is the primary interface for customer-facing booking functionalities and the central hub for Mechanics Desk interaction.
-   **Permissions**: `AllowAny` (publicly accessible).
-   **`create` method**:
    -   Receives booking data from frontend (validated by `BookingSerializer`).
    -   **Mechanics Desk Interaction**: Calls `MechanicsDeskService().create_booking()` to send the validated data to the external API.
    -   **Logging**: Records the `request_payload`, `response_status_code`, `response_body`, and `status` in `BookingRequestLog` for auditing.
-   **`fetch_service_config` action**: Retrieves global `ServiceSettings` for frontend display.
-   **`job_types` action**:
    -   **Mechanics Desk Interaction**: Fetches raw job types from `MechanicsDeskService().get_job_types()`.
    -   Enriches the fetched job types with local descriptions from the `JobType` model before returning to the frontend.
-   **`unavailable_days` action**:
    -   **Mechanics Desk Interaction**: Fetches unavailable booking days from `MechanicsDeskService().get_unavailable_days()`, crucial for frontend calendar logic.

### `MechanicsDeskService` (at `views/mechanics_desk_service.py`)
This is a service class (not a Django view) dedicated to encapsulating all communication with the external Mechanics Desk API.
-   **Authentication**: Uses a token (`settings.MECHANICDESK_BOOKING_TOKEN`).
-   **`_make_request`**: A helper method for making HTTP requests (GET/POST) to the Mechanics Desk API, handling token injection, JSON/HTML response parsing, and error handling.
-   **API Methods**: Provides specific methods for `get_job_types()`, `get_unavailable_days()`, and `create_booking()`, which directly interact with the external API endpoints.

## URLs (`urls.py`)

The API endpoints are logically separated for public and administrative access:

### Public Booking APIs
-   `POST /api/service/create-booking/`: Create a new booking request.
-   `GET /api/service/job-types/`: Retrieve available job types (enriched).
-   `GET /api/service/unavailable-days/`: Retrieve days when bookings are unavailable.
-   `GET /api/service/settings/`: Retrieve service settings (e.g., advance notice, drop-off times).

### Admin APIs
-   `GET, PUT, PATCH /api/service/service-settings/`: Retrieve and update global `ServiceSettings` (Admin only).
-   `GET, POST, PUT, PATCH, DELETE /api/service/admin/job-types/`: Full CRUD for `JobType` instances (Admin only).

## Frontend Forms and User Flow

The `service` application is designed to support a user-friendly booking experience on the frontend:
1.  **Configuration Fetch**: The frontend first fetches global `ServiceSettings` (via `/api/service/settings/`) to understand booking rules (e.g., minimum advance notice, drop-off hours).
2.  **Job Type Display**: It retrieves available job types (via `/api/service/job-types/`), displaying their names and enriched descriptions to the user.
3.  **Availability Check**: The frontend queries `/api/service/unavailable-days/` to disable specific dates in a booking calendar, guiding the user to available slots.
4.  **Booking Form Submission**:
    -   A frontend form collects comprehensive customer and vehicle details, along with desired service types and times.
    -   This data is structured to match the `BookingSerializer`'s expectations.
    -   Upon submission, the frontend sends a `POST` request to `/api/service/create-booking/`.
5.  **Backend Processing**:
    -   The `BookingViewSet.create` method receives the request.
    -   `BookingSerializer` validates and transforms the data.
    -   `MechanicsDeskService` then dispatches this formatted request to the external Mechanics Desk API.
    -   The `BookingRequestLog` records the entire transaction, including the payload sent and the response received, for traceability.
6.  **Response to User**: The backend returns a success or error response, which the frontend displays to the user, confirming the booking or indicating issues.

This flow ensures that the frontend provides accurate, up-to-date information, guides the user through the booking process, and reliably communicates with the external Mechanics Desk system, with all interactions logged for operational oversight.

## Installation

Assuming Django and Django REST Framework are already set up:
1.  Add `'service'` to your `INSTALLED_APPS` in `settings.py`.
2.  Add `MECHANICDESK_BOOKING_TOKEN = 'YOUR_MECHANICDESK_API_TOKEN'` to your `settings.py`.
3.  Include the service URLs in your project's `urls.py`:
    ```python
    path('api/service/', include('service.urls')),
    ```
4.  Run migrations: `python manage.py makemigrations service` and `python manage.py migrate`.