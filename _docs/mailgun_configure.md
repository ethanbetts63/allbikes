# Configuring Webhooks

 If you want to include an HTTPS endpoint, it must be configured with a trusted CA (Certificate Authority) signed SSL certificate, not a self-signed certificate. 

Webhooks can either be configured at the domain level or at the account level, enabling you to set unique endpoints for each domain or fire an event for any of your domains/subaccounts to simplify setup. Each event type is configured individually and can contain up to 3 URLs per event type.

We recommend using [http://bin.mailgun.net/](http://bin.mailgun.net/) for creating temporary URLs to test and debug your webhooks.

## Domain-Level Webhooks

Domain level webhooks will only fire when an event happens for the domain it is configured for

## Account-Level Webhooks

Account level webhooks will fire when an event happens on any of the domains belonging to that account or subaccount(s).

## Regions

Regions are isolated, meaning you will need to create distinct webhooks in each region for the account/domains.

## Deduplication and Other Considerations

If you configure the same URL for the same event at both the domain level and account level, Mailgun treats that as a duplicate and will only send the event once. This prevents your endpoint from receiving multiple copies of the same event. Here are some other considerations:

- Deduplication: Events are delivered once to each unique URL configured at any level. Same URL at domain and account level = send account-level only
- Account inheritance: If an account level webhook is configured on the primary account and an event happens on a domain that belongs to a subaccount, the account level webhook will fire
- Scope isolation: Subaccount webhooks don't affect primary account webhook delivery