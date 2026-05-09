# Allbikes Recommendations

A living to-do list of approved improvements.


  
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




  




A few things worth looking at before you go live:

  ---

  2. Processing page fallback

  After 30 seconds of polling without getting paid, the page redirects to success anyway. If a webhook is genuinely slow, the customer sees "$0
  deposit paid". Unlikely in production but possible. You could show an error/contact page instead of forcing through to success — worth
  considering.



  1. N+1 query risk on total_charged
  total_charged is a Python property that calls self.extras.all(). Now that it's exposed via the serializer, any list endpoint that returns multiple
   bookings (e.g. the admin hire dashboard) will fire a separate DB query per booking. The fix is prefetch_related('extras') on list views — worth
  checking which views don't have it yet.
