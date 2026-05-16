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


  1. High: invalid detail URLs can return soft-404 pages instead of real 404s.
     Bike and product detail pages parse the id from the slug, fetch by id, and pass null into the page component on failure. The component then
     renders “not found” UI, but the route still appears to be a valid 200 page.
     Relevant code: frontend/app/inventory/motorcycles/[slug]/page.tsx:18, frontend/page_components/BikeDetailPage.tsx:126, frontend/app/escooters/
     [slug]/page.tsx:18, frontend/page_components/EScooterDetailPage.tsx:27.
     SEO impact: Google may classify these as soft 404s, crawl junk URLs, or temporarily index generic fallback metadata. These should return
     notFound() or redirect to the canonical slug when the id exists but the slug text is wrong.
  2. High/Medium: metadata fallback can make failed API detail pages indexable.
     If metadata fetch fails, the helper returns normal metadata with a canonical to the requested slug, not noindex.
     Relevant code: frontend/lib/seo.ts:73, frontend/lib/seo.ts:102.
     SEO impact: during backend/API trouble, Google can see an indexable generic “Motorcycles & Scooters” or “Electric Scooters” page at an
     arbitrary detail URL.
  3. Medium: robots.txt and sitemap.xml disagree.
     The sitemap includes /refunds, /privacy, /security, and /terms, but robots disallows the same paths.
     Sitemap entries: frontend/app/sitemap.ts:20.
     Robots disallows: frontend/app/robots.ts:13.
     SEO impact: Search Console will likely report “submitted URL blocked by robots.txt”. Decide one policy: either allow these pages and optionally
     noindex, or remove them from the sitemap.
  4. Medium: structured-data image URLs are likely inconsistent or invalid.
     Motorcycle JSON-LD blindly prefixes https://www.scootershop.com.au onto API image URLs. If DRF returns absolute media URLs, this becomes malfo
     rmed. Product JSON-LD uses raw image values without guaranteeing absolute URLs.
     Relevant code: frontend/page_components/BikeListPage.tsx:130, frontend/page_components/BikeDetailPage.tsx:81, frontend/page_components/
     EScooterListPage.tsx:65, frontend/page_components/EScooterDetailPage.tsx:43.
     SEO impact: rich-result eligibility can be reduced if image fields are invalid.
  5. Medium: fallback Open Graph image points to a file that does not exist.
     buildMetadata() defaults to https://www.scootershop.com.au/logo-512x512.png, but there is no frontend/public/logo-512x512.png.
     Relevant code: frontend/lib/seo.ts:24.
     SEO/social impact: shared pages without a product image get a broken preview image.
  6. Medium: list pages canonicalize all query states to the base URL.
     /inventory/motorcycles/new?page=2, sorted pages, and filtered pages all use the same canonical as /inventory/motorcycles/new.
     Relevant metadata: frontend/app/inventory/motorcycles/new/page.tsx:6, frontend/app/inventory/motorcycles/used/page.tsx:6, frontend/app/
     escooters/page.tsx:6.
     This may be intentional for filters, but page 2+ canonicalizing to page 1 can weaken crawl paths to older inventory. Detail pages are in the
     sitemap, so this is not critical, but it is worth deciding deliberately.
  7. Low/Medium: visible mojibake exists in some SEO copy.
     rg found actual mojibake sequences like â€”, Â·, and 25â€“60 km in page copy.
     Examples: frontend/page_components/ElectricScootersLandingPage.tsx:15, frontend/page_components/HireListPage.tsx:31.
     SEO impact is mostly quality/trust rather than indexing, but this can appear in rendered text, snippets, and FAQ content.


  3. Reduce “page component” size

     A few page components are doing too much: data presentation, section ordering, conditional business logic, schema, CTA decisions.

     I’d aim for:
      - route file: fetch/preload/schema
      - page component: section composition
      - child components: actual UI blocks

     This makes performance work easier because you can see what mounts early.
  4. Clean up encoding issues

     I noticed mojibake-style text in places, like Â·, âœ“, â†.


  1. Normalize image handling everywhere

     This is the biggest recurring issue. Some pages use optimized/static images, some use raw backend image URLs, some use medium, some fall back
     to original uploads.

     I’d make one shared image helper/component for bikes/products/hire cards:
      - prefer thumbnail for small cards
      - prefer medium for detail/gallery main images
      - never use original image unless there is no alternative
      - always set width/height or stable aspect ratio
      - always set correct loading/fetchPriority

     This helps SEO indirectly through Core Web Vitals and makes future mistakes less likely.

       5. Expand structured data

     You already have product/breadcrumb schema in places. I’d make this more consistent:
      - Product schema on all product/detail pages
      - LocalBusiness / MotorcycleDealer style schema globally or on contact page
      - FAQPage schema where real FAQ content exists
      - Service schema for service/tyre fitting/hire pages

     This is probably one of the cleaner SEO wins.