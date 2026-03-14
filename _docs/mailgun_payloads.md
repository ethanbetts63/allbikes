# Webhook Payloads

Payloads for account level and domain level webhooks are identical, which now both include an addition of account.id and domain.name fields for identifying which account it derived from. When something happens to your email, your URL will be called with application/JSON payload. See below for examples of each event type:

 These examples do not include an exhaustive list of all fields returned in the payloads. At times we may introduce new additive fields, so we do not recommend hardcoding the fieds outlined in these examples.

## Accepted Event


```JSON
{
    "account": {
        "id": "1234567890303a4bd1f33898"
    },
    "api-key-id": "12345678-87654321",
    "domain": {
        "name": "sample.mailgun.com"
    },
    "envelope": {
        "sender": "sender@sample.mailgun.com",
        "targets": "recipient@sample.mailgun.com",
        "transport": "smtp"
    },
    "event": "accepted",
    "flags": {
        "is-authenticated": true,
        "is-test-mode": false
    },
    "id": "CCXMjJ7nQi2N3BPigGOdgQ",
    "log-level": "info",
    "message": {
        "headers": {
            "from": "Sample Sender <sender@sample.mailgun.com>",
            "message-id": "20260203192638.000be97f99f8cea1@sample.mailgun.com",
            "subject": "Sample webhook payload",
            "to": "recipient@sample.mailgun.com"
        },
        "size": 341
    },
    "method": "HTTP",
    "recipient": "recipient@sample.mailgun.com",
    "recipient-domain": "sample.mailgun.com",
    "storage": {
        "key": "XXXXAQVV4uE1s5YYj9ZJq7Ge6flueUXXXX",
        "url": "https:\/\/storage-us-west1.api.mailgun.net\/v3\/domains\/sample.mailgun.com\/messages\/BAABAQcQSe_CqzXJ2_tP9JxkOh_fa1aQZA"
    },
    "tags": [
        "webhook_payload"
    ],
    "timestamp": 1770146798.372891,
    "user-variables": []
}
```

## Delivered Event


```JSON
{
    "event": "delivered",
    "id": "MXcc2gEpS-eN8HfkOnmK2w",
    "timestamp": 1770146431.6585283,
    "flags": {
        "is-authenticated": true,
        "is-routed": false,
        "is-big": false,
        "is-system-test": false,
        "is-test-mode": false
    },
    "message": {
        "attachments": [],
        "headers": {
            "message-id": "20260203192030.53383e583ab41f62@sample.mailgun.com",
            "from": "Sample Sender <sender@sample.mailgun.com>",
            "to": "recipient@mailgun.com",
            "subject": "Sample webhook payload"
        },
        "size": 341
    },
    "storage": {
        "key": "XXXXAQVV4uE1s5YYj9ZJq7Ge6flueUXXXX",
        "url": "https:\/\/storage-us-east4.api.mailgun.net\/v3\/domains\/mailgun.com\/messages\/BAABAAdzYub9ZBnyVMlI_YnQHR1rCYY1Yg"
    },
    "log-level": "info",
    "recipient": "recipient@sample.mailgun.com",
    "recipient-domain": "sample.mailgun.com",
    "primary-dkim": "smtp._domainkey.sample.mailgun.com",
    "tags": [
        "webhook_payload"
    ],
    "recipient-provider": "Other",
    "campaigns": [],
    "account": {
        "id": "1234567890303a4bd1f33898"
    },
    "delivery-status": {
        "attempt-no": 1,
        "code": 250,
        "message": "OK",
        "description": null,
        "session-seconds": 1.276,
        "enhanced-code": null,
        "mx-host": "mailgun-com.mail.protection.outlook.com",
        "certificate-verified": true,
        "tls": true,
        "utf8": true,
        "first-delivery-attempt-seconds": 0.062
    },
    "domain": {
        "name": "sample.mailgun.com"
    },
    "envelope": {
        "sender": "sender@sample.mailgun.com",
        "targets": "recipient@sample.mailgun.com",
        "transport": "smtp",
        "sending-ip": "161.38.194.10"
    },
    "user-variables": []
}
```

## Opened Event


```JSON
{
    "event": "opened",
    "id": "q7DMpbLFRKW1QuiLC9XV4Q",
    "timestamp": 1770327074.5549328,
    "log-level": "info",
    "account": {
        "id": "1234567890303a4bd1f33898"
    },
    "domain": {
        "name": "sample.mailgun.com"
    },
    "message": {
        "headers": {
            "message-id": "20260205213049.8e3a7bf607f78309@sample.mailgun.com"
        }
    },
    "campaigns": [],
    "delivered-at": 1770327049,
    "recipient": "recipient@sample.mailgun.com",
    "recipient-domain": "sample.mailgun.com",
    "recipient-provider": "Other",
    "tags": [
        "webhook_payload"
    ],
    "ip": "38.142.208.162",
    "client-info": {
        "client-name": "Chrome",
        "client-os": "OS X",
        "client-type": "browser",
        "device-type": "desktop",
        "user-agent": "Mozilla\/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit\/537.36 (KHTML, like Gecko) Chrome\/144.0.0.0 Safari\/537.36",
        "bot": null
    },
    "geolocation": {
        "city": "San Antonio",
        "country": "US",
        "region": "TX",
        "timezone": "America\/Chicago"
    },
    "user-variables": []
}
```

## Clicked Event


```JSON
{
    "event": "clicked",
    "id": "A9dLUrCXQjK92TlnW3zkIA",
    "timestamp": 1770327118.6648676,
    "log-level": "info",
    "account": {
        "id": "1234567890303a4bd1f33898"
    },
    "domain": {
        "name": "sample.mailgun.com"
    },
    "message": {
        "headers": {
            "message-id": "20260205213049.8e3a7bf607f78309@sample.mailgun.com"
        }
    },
    "campaigns": [],
    "delivered-at": 1770327049,
    "recipient": "recipient@sample.mailgun.com",
    "recipient-domain": "sample.mailgun.com",
    "recipient-provider": "Other",
    "tags": [
        "webhook_payload"
    ],
    "ip": "9.169.124.21",
    "client-info": {
        "client-name": "Chrome Mobile",
        "client-os": "Android",
        "client-type": "mobile browser",
        "device-type": "mobile",
        "user-agent": "Mozilla\/5.0 (Linux; Android 9; itel A27) AppleWebKit\/537.36 (KHTML, like Gecko) Chrome\/133.0.6943.143 Mobile Safari\/537.36",
        "bot": null
    },
    "geolocation": {
        "city": "Unknown",
        "country": "GB",
        "region": "Unknown",
        "timezone": "Europe\/London"
    },
    "user-variables": [],
    "url": "https:\/\/sample.mailgun.com"
}
```

## Permanent Failed Event


```JSON
{
    "event": "failed",
    "id": "2kFItcrLQuKTdp-Ia2Xr7w",
    "timestamp": 1770918175.5923693,
    "flags": {
        "is-authenticated": true,
        "is-routed": false,
        "is-big": false,
        "is-system-test": false,
        "is-test-mode": false
    },
    "message": {
        "attachments": [],
        "headers": {
            "message-id": "20260212174255.58bbb7ce85a423e5@mailgun.com",
            "from": "Sample Sender <sender@sample.mailgun.com>",
            "to": "badrecipient@sample.mailgun.com",
            "subject": "Sample webhook payload"
        },
        "size": 384
    },
    "storage": {
        "key": "XXXXAQVV4uE1s5YYj9ZJq7Ge6flueUXXXX",
        "url": "https:\/\/storage-us-east4.api.mailgun.net\/v3\/domains\/sample.mailgun.com\/messages\/BAABAAfjqLGlFIjZf6pPUoM8bTIKzkQ5Zg"
    },
    "log-level": "error",
    "recipient": "badrecipient@sample.mailgun.com",
    "recipient-domain": "sample.mailgun.com",
    "primary-dkim": "new._domainkey.sample.mailgun.com",
    "tags": [
        "webhook_payload"
    ],
    "reason": "bounce",
    "recipient-provider": "Other",
    "severity": "permanent",
    "campaigns": [],
    "account": {
        "id": "1234567890303a4bd1f33898"
    },
    "delivery-status": {
        "attempt-no": 1,
        "code": 550,
        "message": "5.5.0 Requested action not taken: mailbox unavailable (S2017062302). [BN3PEPF0000B36D.namprd21.prod.outlook.com 2026-02-12T17:42:55.527Z 08DE657A58651558]",
        "description": null,
        "session-seconds": 0.208,
        "enhanced-code": "5.5.0",
        "mx-host": "802679870.pamx1.hotmail.com",
        "certificate-verified": true,
        "tls": true,
        "utf8": true,
        "first-delivery-attempt-seconds": 0.066,
        "bounce-type": "hard"
    },
    "domain": {
        "name": "sample.mailgun.com"
    },
    "envelope": {
        "sender": "sender@sample.mailgun.com",
        "targets": "badrecipient@sample.mailgun.com",
        "transport": "smtp",
        "sending-ip": "161.38.194.10"
    },
    "user-variables": []
}
```

## Temporary Failed Event


```JSON
{
    "event": "failed",
    "id": "YusK9KhoTwe2C00iRxsEqQ",
    "timestamp": 1770919267.4288595,
    "flags": {
        "is-authenticated": true,
        "is-routed": false,
        "is-big": false,
        "is-system-test": false,
        "is-test-mode": false
    },
    "message": {
        "attachments": [],
        "headers": {
            "message-id": "20260212180106.5c8f35804ae3fd54@sample.mailgun.com",
            "from": "Sample Sender <sender@sample.mailgun.com>",
            "to": "tempfailrecipient@sample.mailgun.com",
            "subject": "Sample webhook payload"
        },
        "size": 392
    },
    "storage": {
        "key": "XXXXAQVV4uE1s5YYj9ZJq7Ge6flueUXXXX",
        "url": "https:\/\/storage-us-west1.api.mailgun.net\/v3\/domains\/sample.mailgun.com\/messages\/BAABAQdkRjek67WfRENNirr66rsdtk9IYg"
    },
    "log-level": "warn",
    "recipient": "tempfailrecipient@sample.mailgun.com",
    "recipient-domain": "free.fr",
    "primary-dkim": "smtp._domainkey.sample.mailgun.com",
    "tags": [
        "webhook_payload"
    ],
    "reason": "generic",
    "recipient-provider": "Free FR",
    "severity": "temporary",
    "campaigns": [],
    "account": {
        "id": "1234567890303a4bd1f33898"
    },
    "delivery-status": {
        "attempt-no": 1,
        "code": 421,
        "message": "Your IP (161.38.194.10) is temporary blacklisted by an anti-troyan rule, retry later and\/or visit http:\/\/sample.mailgun.com\/",
        "description": null,
        "session-seconds": 0.478,
        "retry-seconds": 600,
        "enhanced-code": null,
        "mx-host": "mx1.sample.mailgun.com",
        "first-delivery-attempt-seconds": 0.365
    },
    "domain": {
        "name": "sample.mailgun.com"
    },
    "envelope": {
        "sender": "postmaster@sample.mailgun.com",
        "targets": "tempfailrecipient@sample.mailgun.com",
        "transport": "smtp",
        "sending-ip": "161.38.194.10"
    },
    "user-variables": []
}
```

## Unsubscribed Event


```JSON
{
    "event": "unsubscribed",
    "id": "89QcW8YuSv6lhSeN3n4qnA",
    "timestamp": 1770327090.4656289,
    "log-level": "info",
    "account": {
        "id": "1234567890303a4bd1f33898"
    },
    "domain": {
        "name": "sample.mailgun.com"
    },
    "message": {
        "headers": {
            "message-id": "20260205213049.8e3a7bf607f78309@sample.mailgun.com"
        }
    },
    "campaigns": [],
    "recipient": "recipient@sample.mailgun.com",
    "recipient-domain": "sample.mailgun.com",
    "recipient-provider": "Other",
    "tags": [
        "*"
    ],
    "ip": "38.142.208.162",
    "client-info": {
        "client-name": "Chrome",
        "client-os": "OS X",
        "client-type": "browser",
        "device-type": "desktop",
        "user-agent": "Mozilla\/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit\/537.36 (KHTML, like Gecko) Chrome\/144.0.0.0 Safari\/537.36",
        "bot": null
    },
    "geolocation": {
        "city": "San Antonio",
        "country": "US",
        "region": "TX",
        "timezone": "America\/Chicago"
    },
    "user-variables": [],
    "storage": []
}
```

## Spam Complaint Event


```JSON
{
    "event": "complained",
    "id": "rIVDlyk8SY-mJauQoYmNFA",
    "timestamp": 1770920772.2684145,
    "log-level": "warn",
    "account": {
        "id": "1234567890303a4bd1f33898"
    },
    "domain": {
        "name": "sample.mailgun.com"
    },
    "message": {
        "headers": {
            "to": "recipient@sample.mailgun.com",
            "message-id": "20260212182531.0d5ed3254c319957@sample.mailgun.com",
            "from": "Sample Sender <sender@sample.mailgun.com>",
            "subject": "Sample webhook payload"
        },
        "size": 11002
    },
    "campaigns": [],
    "recipient": "recipient@sample.mailgun.com",
    "recipient-domain": "sample.mailgun.com",
    "recipient-provider": "Other",
    "tags": [
        "webhook_payload"
    ],
    "user-variables": [],
    "envelope": {
        "sending-ip": "161.38.194.10"
    },
    "storage": {
        "key": "XXXXAQVV4uE1s5YYj9ZJq7Ge6flueUXXXX",
        "url": "https:\/\/storage-us-west1.api.mailgun.net\/v3\/domains\/sample.mailgun.com\/messages\/BAABAQVV4uE1s5YYj9ZJq7Ge6flueUcDZQ"
    }
}
```