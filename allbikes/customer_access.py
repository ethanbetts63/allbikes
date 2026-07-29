CUSTOMER_ACCESS_TOKEN_HEADER = 'X-Customer-Access-Token'


def get_customer_access_token(request):
    """Read a checkout capability token without exposing it in the URL."""
    return (request.headers.get(CUSTOMER_ACCESS_TOKEN_HEADER) or '').strip()
