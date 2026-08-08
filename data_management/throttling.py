from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'


class StockAlertSignupThrottle(AnonRateThrottle):
    """Keep the public stock-alert form from being used to subscribe a list of addresses."""
    scope = 'stock_alert_signup'


class BikeInterestThrottle(AnonRateThrottle):
    """Keep the per-bike interest form from being used to bulk-enrol addresses.

    Looser than the stock-alert rate because a genuine buyer plausibly enquires
    about several bikes in one browsing session.
    """
    scope = 'bike_interest'
