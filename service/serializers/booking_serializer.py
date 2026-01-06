from rest_framework import serializers

class BookingSerializer(serializers.Serializer):
    """
    Serializer to validate the incoming booking request data from the frontend.
    The fields correspond to the expected payload for the Mechanics Desk API.
    """
    # Customer details
    name = serializers.CharField(max_length=255, required=False)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField()
    street_line = serializers.CharField(max_length=255, required=False, allow_blank=True)
    suburb = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state = serializers.CharField(max_length=50, required=False, allow_blank=True)
    postcode = serializers.CharField(max_length=10, required=False, allow_blank=True)

    # Vehicle details
    registration_number = serializers.CharField(max_length=20)
    make = serializers.CharField(max_length=100)
    model = serializers.CharField(max_length=100)
    year = serializers.IntegerField(required=False, allow_null=True)
    color = serializers.CharField(max_length=50, required=False, allow_blank=True)
    transmission = serializers.CharField(max_length=50, required=False, allow_blank=True)
    vin = serializers.CharField(max_length=17, required=False, allow_blank=True)
    fuel_type = serializers.CharField(max_length=50, required=False, allow_blank=True)
    drive_type = serializers.CharField(max_length=50, required=False, allow_blank=True)
    engine_size = serializers.CharField(max_length=50, required=False, allow_blank=True)
    body = serializers.CharField(max_length=50, required=False, allow_blank=True)
    odometer = serializers.IntegerField(required=False, allow_null=True)

    # Booking details
    drop_off_time = serializers.CharField(max_length=20) # Expected format dd/mm/yyyy HH:MM
    pickup_time = serializers.CharField(max_length=20, required=False, allow_blank=True)
    job_type_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        allow_empty=False
    )
    courtesy_vehicle_requested = serializers.BooleanField(default=False)
    note = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        """
        Combine first_name and last_name to create the full 'name' field,
        and convert numeric/boolean fields to strings for the MechanicDesk API.
        """
        # Ensure 'name' is created if not present, but keep first/last name
        if 'name' not in data or not data['name']:
            data['name'] = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()

        # Convert numeric fields to strings if they exist
        if 'year' in data and data['year'] is not None:
            data['year'] = str(data['year'])
        
        if 'odometer' in data and data['odometer'] is not None:
            data['odometer'] = str(data['odometer'])

        # Convert boolean to string "true" or "false"
        if 'courtesy_vehicle_requested' in data:
            data['courtesy_vehicle_requested'] = "true" if data['courtesy_vehicle_requested'] else "false"
            
        return data
