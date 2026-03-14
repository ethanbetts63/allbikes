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



  

### Simplification / Design Issues

**5. No atomic stock decrement on purchase**
Stock is adjusted by directly PATCHing `stock_quantity`. In a concurrent environment (two simultaneous orders), a direct set is a race condition — both reads could see `stock_quantity = 1`, both proceed, and stock goes to -1. A `F()` expression-based update or a dedicated decrement endpoint would be safer.

---

## `payments` app

### Bugs / Logical Issues
**2. `OrderRetrieveView` exposes full PII to anyone (`order_views.py:28-36`)**
The endpoint is `AllowAny` and only requires the `order_reference` in the URL. Anyone who knows or guesses the 8-character hex reference can retrieve the customer's full name, email, phone number, and delivery address. There's no rate limiting and no additional verification step. At minimum, require the customer to also supply their email to match against the order before returning the full payload.


**4. `product_price` serialized as `CharField` (`order_serializer.py:23`)**
`serializers.CharField(source='product.price')` coerces a `DecimalField` to a string. It works, but it's semantically wrong — downstream consumers expecting a number will get a string. Should be `DecimalField(source='product.price', max_digits=10, decimal_places=2)`.

**6. `handle_payment_intent_failed` not wrapped in a transaction (`webhook_handlers.py:52-63`)**
`handle_payment_intent_succeeded` uses `transaction.atomic()` for safety; `handle_payment_intent_failed` does not. If the `payment.save()` were to fail mid-way (rare, but possible), the handler could leave state inconsistent. Low risk with a single save, but worth making consistent.


**8. `send_admin_reminders` sends one email per unpaid order (`send_admin_reminders.py:11-14`)**
If 10 orders are in `paid` status, the admin receives 10 separate reminder emails. A single digest email listing all outstanding orders would be far less noisy.


**10. `_generate_reference()` infinite loop potential (`order.py:43-47`)**
The `while True:` collision-retry loop is fine in practice (8 hex chars = ~4.3 billion combos for a small shop), but it's technically an unbounded loop. If the namespace ever fills up or DB connections stall inside the loop, it hangs forever. A max-retries guard would make it fail fast instead.

---

## `notifications` app

### Bugs / Logical Issues

**1. `send_admin_reminder` shows UTC date instead of Perth time (`email.py:127`)**
`order.created_at.strftime('%d %b %Y')` formats the datetime without converting to Perth time first. `send_admin_new_order` does this correctly with `.astimezone(PERTH_TZ)` (line 93), but the reminder function doesn't. For orders placed in the morning AWST (before 8am UTC), the reminder email will show the previous calendar day.

**2. `send_test_email` imports private functions (`send_test_email.py:8`)**
The management command directly imports `_send_mailgun` and `_record` — functions explicitly marked private. This bypasses the public API of the email module. A proper `send_test_email(to, template)` public function in `utils/email.py` would be the right boundary.

### Simplification / Design Issues

**3. Generic FK on `SentMessage` is over-engineered (`models.py:24-26`)**
`content_type` / `object_id` / `content_object` adds a `ContentType` join on every lookup — but in practice only ever links to `Order`. A plain nullable `ForeignKey` to `Order` would be simpler, faster to query, and easier to read.


