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



  2. The multi-step booking form uses any throughout

  formData: any, setFormData: React.Dispatch<React.SetStateAction<any>> — the BookingFormData type exists but isn't used
   to type the form state. The three form step components (BookingDetailsForm, BikeDetailsForm, PersonalDetailsForm)
  could all accept typed props using it.

  3. siteSettings.ts hardcodes data from a DB backup

  // The values are hardcoded from the last known database backup.
  This will silently drift from the actual DB. If the settings API is available, the frontend should fetch it. If
  offline fallback is needed, at least version/timestamp it and throw a warning.

  4. structuredData?: object | any in SeoProps is a no-op

  any absorbs object, so object | any is just any. Should be Record<string, unknown> or just object.

  ---
  Bug 3: Rego used as vehicleIdentificationNumber

  "vehicleIdentificationNumber": bike.rego

  rego is the registration plate number, not the chassis VIN. These are different fields. Either use bike.rego under a more appropriate property
  like "vehicleRegistration", or remove the vehicleIdentificationNumber field entirely since the Bike model doesn't have a true VIN.

  ---