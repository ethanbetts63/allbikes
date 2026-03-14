# Webhooks

Webhooks allow your application to programmatically receive information in near real-time whenever an event happens on your Mailgun account. This allows your application to stay up to date on everything that happens with the email messages you send.

Use cases for webhooks can include:

- Storing events in your own or 3rd party application for reporting purposes
- Removing recipient addresses that bounce, complain or unsubscribe (good email hygiene!)
- Triggering fallback channels like SMS or push notifications when critical transactional emails fail to deliver
- Building engagement profiles from open and click data to optimize send frequency and audience segmentation
- Maintaining compliance and audit trails for industries with regulatory requirements around email delivery records
- Surfacing delivery status to end users on platforms that send email on behalf of their customers
- Syncing engagement data with CRM tools so sales teams can see if prospects opened their emails


When you configure a webhook, Mailgun will send an HTTP or HTTPS POST request with a JSON payload to the endpoint you specify when an event occurs. Webhooks can be configured at the account level or domain level, and you can choose which event types you want to receive. The following event types are supported:

| **Event** | **Description** |
|  --- | --- |
| accepted | Mailgun accepted the request to send/forward the email and the message has been placed in queue. |
| delivered | Mailgun sent the email, and it was accepted by the recipient email server. |
| temporary_fail | Mailgun could not deliver the email to the recipient email server due to a temporary issue (deferred message, DNS did not resolve) and will re-attempt delivery |
| permanent_fail | Mailgun could not deliver the email to the recipient email server due to a permanent failure (recipient address does not exist, etc) and will NOT re-attempt delivery. |
| opened | The email recipient opened the email and enabled image viewing. Open tracking must be enabled in the Mailgun control panel, and the CNAME record must be pointing to mailgun.org. |
| clicked | The email recipient clicked on a link in the email. Click tracking must be enabled in the Mailgun control panel, and the CNAME record must be pointing to mailgun.org. |
| unsubscribed | The email recipient clicked on the unsubscribe link. Unsubscribe tracking must be enabled in the Mailgun control panel. |
| complained | The email recipient clicked on the spam complaint button within their email client. Feedback loops enable the notification to be received by Mailgun. |