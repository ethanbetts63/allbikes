# Allbikes Recommendations

A living to-do list of approved improvements.


## Security

- [ ] **Migrate JWT tokens from localStorage to HttpOnly cookies** — Currently the frontend stores the JWT access token in localStorage (readable by any JavaScript on the page). This is the standard XSS attack vector. The fix is to switch to HttpOnly cookies for both the access and refresh tokens, as done in the futureflower project. This requires:
  - Backend: A custom token view that sets tokens as HttpOnly cookies on login/refresh, and clears them on logout.
  - Frontend: Remove `localStorage.getItem/setItem('token')` from `AuthContext`. Send no `Authorization` header — the cookie is sent automatically. Add CSRF token handling for write requests.
  - The admin panel (bike management) is protected by this token, making the stakes higher than a typical public-facing site.
  - **Reference**: See `futureflower` project for a complete working implementation.




  4. structuredData?: object | any in SeoProps is a no-op

  any absorbs object, so object | any is just any. Should be Record<string, unknown> or just object.

  ---
  Bug 3: Rego used as vehicleIdentificationNumber

  "vehicleIdentificationNumber": bike.rego

  rego is the registration plate number, not the chassis VIN. These are different fields. Either use bike.rego under a more appropriate property
  like "vehicleRegistration", or remove the vehicleIdentificationNumber field entirely since the Bike model doesn't have a true VIN.

  ---

  
  2. The multi-step booking form uses any throughout

  formData: any, setFormData: React.Dispatch<React.SetStateAction<any>> — the BookingFormData type exists but isn't used
   to type the form state. The three form step components (BookingDetailsForm, BikeDetailsForm, PersonalDetailsForm)
  could all accept typed props using it.

● The [key: string]: any line in BookingFormData is an index signature. It means "this object can also have any other key with any value." It's
  there so this pattern works:

  setFormData(prev => ({ ...prev, [field]: value }))

  Where field is a dynamic string — TypeScript needs the index signature to allow that.

  The problem is that index signature poisons the whole type. When you access formData.first_name, TypeScript sees the index signature and says
  "that could be any." You lose autocomplete, you lose type errors on typos like formData.frist_name, you lose everything that makes typing useful.

  So even if you changed all the props from formData: any to formData: BookingFormData, you'd have the appearance of types without the actual
  safety. The suggestion is correct that any is being used where BookingFormData should be — but BookingFormData itself has an any hole in it that
  needs fixing first before the swap is meaningful.




  




