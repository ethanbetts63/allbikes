# Allbikes & Vespawarehouse

Allbikes & Vespawarehouse is a comprehensive web platform for a motorcycle and scooter dealership, providing sales, service, and parts. This full-stack application features a detailed inventory management system, a customer-facing booking system integrated with the MechanicDesk API, and a dynamic frontend for a seamless user experience.

## Tech Stack

*   **Backend:** Django, Django REST Framework
*   **Frontend:** React, Vite, TypeScript, Tailwind CSS, Shadcn UI
*   **Database:** MySQL
*   **External APIs:** MechanicDesk (for service bookings)
*   **Testing:** Pytest, pytest-django, Factory Boy

## Core Project Concepts

The project is organized into several key applications, each with a dedicated `README.md` for more detailed information.

*   `inventory`: Manages the motorcycle and scooter inventory, including vehicle details and images.
*   `service`: Handles service bookings, with a deep integration into the external MechanicDesk API for managing job types and availability.
*   `data_management`: A central app for managing brand information, terms and conditions, user profiles, and various data import/export/cleanup utilities.
*   `frontend`: A modern, responsive single-page application built with React and Vite, providing the user interface for the entire platform.

## Getting Started

Follow these instructions to set up a local development environment.

### Prerequisites

*   Python 3.9+
*   Node.js 20.x+
*   MySQL server

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ethanbetts63/allbikes
    cd allbikes
    ```

2.  **Create and activate a Python virtual environment:**
    ```bash
    python -m venv venv
    .\venv\Scripts\activate  # On Windows
    # source venv/bin/activate    # On macOS/Linux
    ```

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the project root directory. This file stores sensitive configuration. Use the following structure:
    ```env
    # Django Settings
    SECRET_KEY=your_django_secret_key
    DEBUG=True
    
    # Database Settings (MySQL)
    DB_NAME=allbikes
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_HOST=localhost
    DB_PORT=3306

    # API Keys
    MECHANICDESK_BOOKING_TOKEN=your_mechanicdesk_api_token
    ```

5.  **Run database migrations:**
    ```bash
    python manage.py migrate
    ```

6.  **Create a superuser (optional):**
    This allows you to access the Django admin interface.
    ```bash
    python manage.py createsuperuser
    ```

7.  **Run the backend development server:**
    ```bash
    python manage.py runserver
    ```
    The backend will be available at `http://127.0.0.1:8000`.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

3.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173` (or another port if 5173 is in use). The Vite dev server is configured to proxy API requests to the backend.

## Running Tests

The backend test suite uses `pytest`. For a comprehensive overview of the testing strategy, philosophy, and directory structure, please refer to the [TESTING.md](./TESTING.md) file.

To run the tests, execute the following command from the project root:

```bash
pytest
```

## Development Utilities

### Database Reset (Windows PowerShell)

The project includes a PowerShell script `reset_django.ps1` to completely reset the local development environment. This is useful if your local database schema is out of sync or you want to start from a clean slate.

**Warning:** This is a destructive operation. It will delete all data in your local database.

To run the script:

```powershell
.\reset_django.ps1
```
The script performs the following actions:
1.  Prompts you to manually drop and recreate the MySQL database.
2.  Deletes all `__pycache__` directories and old migration files.
3.  Creates new database migrations.
4.  Applies the migrations.
5.  Runs several custom management commands to populate the database with initial data.

### Custom Management Commands

The `data_management` application includes several custom Django management commands to help with development and data migration:

*   `python manage.py generate --brands`: Populates the database with brand data from `data_management/data/brands.jsonl`.
*   `python manage.py generate --terms`: Populates the database with the latest terms and conditions from HTML files.
*   `python manage.py generate --archive`: Archives the current state of the database to date-stamped JSON files.
*   `python manage.py update --archive`: Loads the database from the most recent archive (a destructive operation).

## External Integrations

### MechanicDesk API

The `service` application is deeply integrated with the MechanicDesk API for handling service bookings. This integration allows the frontend to fetch available job types, check for unavailable booking days, and submit new booking requests directly into the MechanicDesk system.

For full details on the API endpoints and expected payloads, refer to the local documentation: [service/MechanicDesk_Documentation.txt](./service/MechanicDesk_Documentation.txt).

## License

This project is licensed under the terms of the [LICENSE.md](./LICENSE.md) file.
