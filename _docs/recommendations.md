# Allbikes Recommendations

A living to-do list of approved improvements.

---

## Done

- **Add Google tag (gtag.js)**: Added to `frontend/index.html`.
- **Add caching**: Added explicit `CACHES` config to `settings.py` (15 min / LocMemCache). Applied `cache_page(900)` to `list` and `retrieve` actions on `MotorcycleViewSet`.

---

## Security

- [ ] **Migrate JWT tokens from localStorage to HttpOnly cookies** — Currently the frontend stores the JWT access token in localStorage (readable by any JavaScript on the page). This is the standard XSS attack vector. The fix is to switch to HttpOnly cookies for both the access and refresh tokens, as done in the futureflower project. This requires:
  - Backend: A custom token view that sets tokens as HttpOnly cookies on login/refresh, and clears them on logout.
  - Frontend: Remove `localStorage.getItem/setItem('token')` from `AuthContext`. Send no `Authorization` header — the cookie is sent automatically. Add CSRF token handling for write requests.
  - The admin panel (bike management) is protected by this token, making the stakes higher than a typical public-facing site.
  - **Reference**: See `futureflower` project for a complete working implementation.
