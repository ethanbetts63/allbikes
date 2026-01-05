MechanicDesk Booking Form


1. Using the iframe


MechanicDesk comes with a default booking form which can be embedded into your website as an iframe.
* Navigate to Settings >> Workshop details >> Online booking
* Enable the online booking option and copying over the entirety of the code snippet presented into your website. It should look similar to this
<iframe src='https://www.mechanicdesk.com.au/online-booking/abcdefghijklmnopqrstuvwxyz' width='100%' height='100%' frameBorder='0'></iframe>
* Your website should now display a booking form inside an iframe.
                


2. API


We provide an API that a custom website can call in order to create bookings using forms.


2.1 SUBMIT A REQUEST:
POST https://www.mechanicdesk.com.au/booking_requests/create_booking
This creates a booking request in MechanicDesk. Please refer below for the expected form data to submit as the request payload. You must also include a secret token in the payload so MechanicDesk can bind your workshop correctly.


Secret token:
This can be found in your MechanicDesk workshop account, under Settings >> Workshop Details >> Online Booking. In this screen, you will find a code snippet containing your secret token. It should look like this:
<iframe src='https://www.mechanicdesk.com.au/online-booking/abcdefghijklmnopqrstuvwxyz' width=100% height=’100%’ frameBorder='0'></iframe>
Your token is the string of characters at the end of the URL, which should look similar to abcdefghijklmnopqrstuvwxyz in the example above.


Accepted payload attributes:


token: the secret token referred to above (required)
name: full name of customer
first_name: customer first name
last_name: customer last name
phone:        customer phone number
email:        customer email
street_line: customer address street
suburb: customer address suburb
state: customer address state
postcode: customer address postcode


registration_number: vehicle rego #
make:        vehicle make 
model:        vehicle model
year: vehicle year
color: vehicle colour
transmission: vehicle transmission
vin: VIN number
fuel_type: vehicle fuel type
drive_type: vehicle drive type
engine_size: vehicle engine size
body: vehicle body type
odometer: vehicle odometer reading


drop_off_time: time to drop off the vehicle
pickup_time: time to pick up the vehicle
job_type_names: a list of job types that are offered. This must be an array of job type names and the job type names must match exactly those currently available in MechanicDesk. Section 2.2 outlines how this information can be fetched from the MechanicDesk servers.
courtesy_vehicle_requested (true/false): indicates if the customer requires a courtesy vehicle
note: any special notes that the customer wants you to receive


NOTE: All times must be formatted as dd/mm/yyyy HH:MM.


2.2 GET LIST OF JOB TYPES:
GET https://www.mechanicdesk.com.au/booking_requests/available_job_types?token=abcdefghijklmnopqrstuvwxyz
This endpoint allows the booking form to retrieve a list of valid job type titles in the system. This can then be used to set the available job types for the user to select and subsequently submit as part of the booking request (use payload attribute job_type_names outlined in section 2.1). This is useful for when you want the customer to specify what types of services they want done when they come in on the day.


The list of available job types returned by this API endpoint can also be controlled from within MechanicDesk, for when you do not want the endpoint to return all existing job types in the system (some job types may be internal use only for example).


 Graphical user interface, text, application, email

Description automatically generated 

 Graphical user interface, text, application, Word

Description automatically generated 



2.3 GET UNAVAILABLE DAYS:
GET https://www.mechanicdesk.com.au/booking_requests/unavailable_days?token=abcdefghijklmnopqrstuvwxyz
This endpoint allows the booking form to retrieve information regarding which days are unavailable according to the diary section in MechanicDesk. This is useful for when you want the booking form to know which upcoming days are unavailable and instruct the calendar to block out those days.


The number of days to lookahead defaults to 30 days which we recommend you keep. However, it can be changed to any other value between 1 and 90 days, via the in_days attribute. For example, to get information regarding unavailable days for the next 60 days, you can call the following API:
GET https://www.mechanicdesk.com.au/booking_requests/unavailable_days?token=abcdefghijklmnopqrstuvwxyz&in_days=60