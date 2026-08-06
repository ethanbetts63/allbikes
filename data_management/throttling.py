from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'


class StockAlertSignupThrottle(AnonRateThrottle):
    """Keep the public stock-alert form from being used to subscribe a list of addresses."""
    scope = 'stock_alert_signup'
