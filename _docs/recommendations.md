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


  4. structuredData?: object | any in SeoProps is a no-op

  any absorbs object, so object | any is just any. Should be Record<string, unknown> or just object.

  ---
  Bug 3: Rego used as vehicleIdentificationNumber

  "vehicleIdentificationNumber": bike.rego

  rego is the registration plate number, not the chassis VIN. These are different fields. Either use bike.rego under a more appropriate property
  like "vehicleRegistration", or remove the vehicleIdentificationNumber field entirely since the Bike model doesn't have a true VIN.

  ---



  

### Simplification / Design Issues

**5. No atomic stock decrement on purchase**
Stock is adjusted by directly PATCHing `stock_quantity`. In a concurrent environment (two simultaneous orders), a direct set is a race condition — both reads could see `stock_quantity = 1`, both proceed, and stock goes to -1. A `F()` expression-based update or a dedicated decrement endpoint would be safer.

---

## `payments` app

**4. `product_price` serialized as `CharField` (`order_serializer.py:23`)**
`serializers.CharField(source='product.price')` coerces a `DecimalField` to a string. It works, but it's semantically wrong — downstream consumers expecting a number will get a string. Should be `DecimalField(source='product.price', max_digits=10, decimal_places=2)`.


