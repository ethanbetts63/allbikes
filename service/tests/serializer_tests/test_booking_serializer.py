import pytest
from service.serializers import BookingSerializer

@pytest.fixture
def booking_data():
    """Provides a valid dictionary of booking data."""
    return {
        "first_name": "John",
        "last_name": "Doe",
        "phone": "1234567890",
        "email": "john.doe@example.com",
        "registration_number": "TEST123",
        "make": "TestMake",
        "model": "TestModel",
        "year": 2022,
        "drop_off_time": "15/07/2024 10:00",
        "job_type_names": ["Oil Change"],
        "courtesy_vehicle_requested": True,
    }

class TestBookingSerializer:

    def test_valid_data(self, booking_data):
        """
        GIVEN valid booking data
        WHEN the serializer is validated
        THEN is_valid() should be True and the validated data should be correct.
        """
        serializer = BookingSerializer(data=booking_data)
        assert serializer.is_valid(raise_exception=True)
        
        validated_data = serializer.validated_data
        
        # Test custom validation logic
        assert validated_data['name'] == "John Doe"
        assert validated_data['year'] == "2022"
        assert validated_data['courtesy_vehicle_requested'] == "true"

    def test_missing_required_fields(self, booking_data):
        """
        GIVEN booking data with a missing required field (e.g., email)
        WHEN the serializer is validated
        THEN is_valid() should be False and the error message should be appropriate.
        """
        del booking_data['email']
        serializer = BookingSerializer(data=booking_data)
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_empty_job_type_names(self, booking_data):
        """
        GIVEN booking data with an empty list for job_type_names
        WHEN the serializer is validated
        THEN is_valid() should be False.
        """
        booking_data['job_type_names'] = []
        serializer = BookingSerializer(data=booking_data)
        assert not serializer.is_valid()
        assert 'job_type_names' in serializer.errors

    def test_boolean_conversion_false(self, booking_data):
        """
        GIVEN booking data with courtesy_vehicle_requested set to False
        WHEN the serializer is validated
        THEN the validated data should convert it to the string "false".
        """
        booking_data['courtesy_vehicle_requested'] = False
        serializer = BookingSerializer(data=booking_data)
        assert serializer.is_valid(raise_exception=True)
        assert serializer.validated_data['courtesy_vehicle_requested'] == "false"

    def test_optional_fields(self, booking_data):
        """
        GIVEN booking data with optional fields omitted
        WHEN the serializer is validated
        THEN is_valid() should be True.
        """
        # Remove some optional fields
        del booking_data['year']
        booking_data.pop('courtesy_vehicle_requested') 
        
        serializer = BookingSerializer(data=booking_data)
        assert serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        
        # 'year' should not be in the validated data
        assert 'year' not in validated_data
        # 'courtesy_vehicle_requested' will default to False, then be converted to "false"
        assert validated_data['courtesy_vehicle_requested'] == "false"
