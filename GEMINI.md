# Project Overview

This project, named , is a web application designed to act as a highly persistent reminder service. The goal is to ensure users never miss critical, long-term events by using an escalating hierarchy of notifications.

The technical stack consists of a Django backend and a React frontend.

The Django backend is structured into several dedicated apps: `users` for managing a custom user model with extensive contact details; `events` for creating and managing the reminder events themselves; `notifications` to handle the complex, multi-channel notification logic (like email, SMS); and `payments` for processing one-time fees to activate events. An `api` app serves as the bridge between the backend services and the frontend.

The frontend is a standard React application, which will provide the user interface for creating accounts, setting up events, and managing contact information.

Sometimes a summary file must be created to document the work performed. This summary should cover all major changes, discussions, and decisions made during the session. If the users requests this document please make it as follows:

-   **Location:** `C:\Users\ethan\coding\allbikes\gemini_session_summaries\`
-   **Naming Convention:** The file must be named `summary<N>.txt`, where `N` is the number of the previous summary file plus one (e.g., `summary_28.txt`).

# User Preferences
- never run npm or runserver
- do not ask to read files just read them. 
- never run pytest on its own alway specify a dir or file. 
- never use zod
- always read the read me for the app you are working in. 