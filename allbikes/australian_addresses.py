"""Shared, deterministic validation helpers for Australian addresses."""

AUSTRALIAN_STATES = ('ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA')

# Includes ordinary delivery postcodes plus Australia Post's state-specific
# PO-box/large-volume ranges. This is deliberately a broad compatibility check,
# not an address-existence lookup.
STATE_POSTCODE_RANGES = {
    'ACT': ((200, 299), (2600, 2618), (2900, 2920)),
    'NSW': ((1000, 2599), (2619, 2899), (2921, 2999)),
    'NT': ((800, 999),),
    'QLD': ((4000, 4999), (9000, 9999)),
    'SA': ((5000, 5999),),
    'TAS': ((7000, 7999),),
    'VIC': ((3000, 3999), (8000, 8999)),
    'WA': ((6000, 6999),),
}


def postcode_matches_state(postcode, state):
    """Return whether a four-digit postcode falls in the state's broad ranges."""
    if len(postcode) != 4 or not postcode.isdigit() or state not in STATE_POSTCODE_RANGES:
        return False
    number = int(postcode)
    return any(start <= number <= end for start, end in STATE_POSTCODE_RANGES[state])


def australian_address_errors(*, state, postcode, required):
    """Return field errors for a required or partially supplied state/postcode pair."""
    state = (state or '').strip().upper()
    postcode = (postcode or '').strip()
    if not required and not state and not postcode:
        return {}

    errors = {}
    if not state:
        errors['state'] = 'State or territory is required.'
    elif state not in AUSTRALIAN_STATES:
        errors['state'] = 'Select a valid Australian state or territory.'

    if not postcode:
        errors['postcode'] = 'Postcode is required.'
    elif len(postcode) != 4 or not postcode.isdigit():
        errors['postcode'] = 'Enter a valid four-digit Australian postcode.'
    elif state in AUSTRALIAN_STATES and not postcode_matches_state(postcode, state):
        errors['postcode'] = f'Postcode {postcode} does not match {state}.'
    return errors
