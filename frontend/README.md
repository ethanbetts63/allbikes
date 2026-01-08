# Frontend Application

The `frontend` application is a modern, responsive web interface built with React and TypeScript, designed to interact with the Django REST API backend. It leverages a robust set of technologies for a fast development experience, maintainable codebase, and a rich user interface.

## Technologies Used

-   **Framework**: React (with JSX/TSX)
-   **Language**: TypeScript
-   **Build Tool**: Vite
-   **Routing**: React Router DOM (v6)
-   **Styling**:
    -   Tailwind CSS: Utility-first CSS framework for rapid UI development.
    -   `tw-animate-css`: For various CSS animations.
    -   CSS Variables: Used extensively for theming, including light/dark mode support, aligned with Shadcn UI.
-   **UI Components**:
    -   Shadcn UI: A collection of reusable components built using Radix UI primitives and styled with Tailwind CSS. These are primarily located in `src/components/ui/`.
    -   Radix UI: Low-level UI primitives providing accessibility and behavior.
-   **Icons**: Lucide React (`lucide-react`)
-   **Forms**: React Hook Form
-   **Date Pickers**: React Day Picker (`react-day-picker`) with `date-fns`
-   **State Management**: React Context API (`AuthContext`)
-   **Data Tables**: TanStack React Table (`@tanstack/react-table`)
-   **Authentication**: JWT Decode (`jwt-decode`) for token parsing.
-   **SEO/Head Management**: React Helmet Async (`react-helmet-async`)
-   **Development Tools**: ESLint (for linting and code quality), TypeScript-ESLint, Vite plugins.

## Project Structure

The `frontend/src` directory is organized into logical modules:

-   `src/api.ts`, `src/apiClient.ts`: Centralized files for API service definitions and client configuration.
-   `src/assets/`: Static assets like images.
-   `src/components/`: **Custom components** specific to this application (e.g., `BikeCard`, `FaqSection`, `HomeHero`).
-   `src/components/ui/`: **Shadcn UI components**. This directory contains the UI components generated and managed by Shadcn CLI, built on Radix UI and styled with Tailwind CSS.
-   `src/context/`: React Context providers for global state management (e.g., `AuthContext`, `SiteSettingsContext`).
-   `src/forms/`: Components and logic related to complex forms.
-   `src/lib/`: Utility functions and helper modules (e.g., `utils.ts` for `cn` function).
-   `src/pages/`: Top-level page components, often lazy-loaded for performance. Includes both public and admin-specific pages.
-   `src/services/`: Service-layer modules for interacting with specific backend functionalities (e.g., `bookingService`).
-   `src/types/`: TypeScript type definitions.
-   `src/utils/`: General utility functions.
-   `src/App.tsx`: The main application component, defining layout and routing.
-   `src/main.tsx`: The entry point of the React application.
-   `src/index.css`: Global stylesheet, importing Tailwind CSS and defining CSS variables for theming.

## Key Features and Components

-   **Modular Design**: Clear separation of concerns with dedicated folders for components, pages, services, and utilities.
-   **Responsive UI**: Built with Tailwind CSS and Shadcn UI, ensuring a consistent and responsive experience across various devices.
-   **Lazy Loading**: Pages are lazy-loaded using `React.lazy` and `Suspense` to improve initial load performance.
-   **Global State Management**: Utilizes React Context for managing application-wide state such as authentication status.
-   **Form Handling**: Efficient form management using React Hook Form, providing validation and state control.
-   **API Integration**: Centralized API client and service modules ensure consistent and maintainable communication with the backend.
-   **Theming**: Support for theming (e.g., dark mode) through CSS variables and `next-themes`.
-   **Router-based Navigation**: `react-router-dom` handles client-side routing, including nested routes for the admin section.

## API Interaction

The frontend interacts with the Django backend API. During local development, `vite.config.ts` sets up a proxy to forward `/api` requests to `http://127.0.0.1:8000`, bypassing CORS issues. Production deployments would typically configure the web server (e.g., Nginx) to proxy these requests.

## Installation and Running

1.  **Navigate to the frontend directory**:
    ```bash
    cd frontend
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the development server**:
    ```bash
    npm run dev
    ```
    This will typically start the application on `http://localhost:5173` (or another available port) and provide hot-reloading.

## Build Process

To build the application for production:
```bash
npm run build
```
This command compiles the TypeScript code, bundles the assets using Vite, and outputs the optimized static files to the `dist/` directory.

## Image Handling (Development vs. Production)
Image handling differs significantly between the development and production environments. Understanding this is key to avoiding broken images.

### Dynamic Images (from API)

These are user-uploaded images, like motorcycle pictures, served from the Django backend.
*   **Development**: When `DEBUG` is `True` in Django's `settings.py`, the Django development server is configured to serve media files directly from the `mediafiles/` directory. The API will return image URLs like `http://127.0.0.1:8000/media/path/to/image.jpg`, which the browser can resolve because the Django server is running.

*   **Production**: In a production environment, the Django application itself does **not** serve media files for performance and security reasons. A dedicated web server (e.g., Nginx) is configured to intercept requests to `/media/` and serve them directly from the `mediafiles/` filesystem directory.

### Static Images (in Frontend Code)

These are images that are part of the application's design, such as logos, icons, or default placeholders.

*   **Development**: These images are typically stored in the `frontend/src/assets/` directory. To use them, you must `import` them directly into your React components.

    ```tsx

    import myImage from '@/assets/my-image.png';



    const MyComponent = () => <img src={myImage} alt="Description" />;

    ```

    Vite's development server handles this import, making the image available to the browser.

*   **Production**: During the `npm run build` process, Vite bundles and optimizes these imported images, giving them new, hashed filenames and placing them in the `dist/assets/` directory. The `import` statement ensures your code automatically receives the correct final URL.

    **CRITICAL**: Never use hardcoded string paths to static assets (e.g., `src="/src/assets/my-image.png"`). This will **fail** in production because the `src` directory does not exist in the final build output. Always use `import`.
