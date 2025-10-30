

here is the new documentation :

Post : 
{
  "fallbackDestination": {
    "message": "string",
    "type": "number",
    "numberE164CheckEnabled": true,
    "number": "string",
    "extension": "string",
    "callerId": "string",
    "transferPlan": {
      "mode": "blind-transfer",
      "message": "string",
      "sipVerb": "refer",
      "twiml": "string",
      "summaryPlan": {
        "messages": [
          {}
        ],
        "enabled": true,
        "timeoutSeconds": 60
      }
    },
    "description": "string"
  },
  "provider": "byo-phone-number",
  "numberE164CheckEnabled": true,
  "number": "string",
  "credentialId": "string",
  "name": "string",
  "assistantId": "string",
  "squadId": "string",
  "server": {
    "timeoutSeconds": 20,
    "url": "string",
    "secret": "string",
    "headers": {},
    "backoffPlan": {
      "maxRetries": 0,
      "type": "fixed",
      "baseDelaySeconds": 1
    }
  }
}

2. Get List phone numbers :
Name	Description
limit
number
(query)
This is the maximum number of items to return. Defaults to 100.

limit
createdAtGt
string($date-time)
(query)
This will return items where the createdAt is greater than the specified value.

createdAtGt
createdAtLt
string($date-time)
(query)
This will return items where the createdAt is less than the specified value.

createdAtLt
createdAtGe
string($date-time)
(query)
This will return items where the createdAt is greater than or equal to the specified value.

createdAtGe
createdAtLe
string($date-time)
(query)
This will return items where the createdAt is less than or equal to the specified value.

createdAtLe
updatedAtGt
string($date-time)
(query)
This will return items where the updatedAt is greater than the specified value.

updatedAtGt
updatedAtLt
string($date-time)
(query)
This will return items where the updatedAt is less than the specified value.

updatedAtLt
updatedAtGe
string($date-time)
(query)
This will return items where the updatedAt is greater than or equal to the specified value.

updatedAtGe
updatedAtLe
string($date-time)
(query)
This will return items where the updatedAt is less than or equal to the specified value.

updatedAtLe
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
[
  {
    "fallbackDestination": {
      "message": "string",
      "type": "number",
      "numberE164CheckEnabled": true,
      "number": "string",
      "extension": "string",
      "callerId": "string",
      "transferPlan": {
        "mode": "blind-transfer",
        "message": "string",
        "sipVerb": "refer",
        "twiml": "string",
        "summaryPlan": {
          "messages": [
            {}
          ],
          "enabled": true,
          "timeoutSeconds": 60
        }
      },
      "description": "string"
    },
    "provider": "byo-phone-number",
    "numberE164CheckEnabled": true,
    "id": "string",
    "orgId": "string",
    "createdAt": "2025-03-09T20:16:58.146Z",
    "updatedAt": "2025-03-09T20:16:58.146Z",
    "status": "active",
    "name": "string",
    "assistantId": "string",
    "squadId": "string",
    "server": {
      "timeoutSeconds": 20,
      "url": "string",
      "secret": "string",
      "headers": {},
      "backoffPlan": {
        "maxRetries": 0,
        "type": "fixed",
        "baseDelaySeconds": 1
      }
    },
    "number": "string",
    "credentialId": "string"
  },
  {
    "fallbackDestination": {
      "message": "string",
      "type": "number",
      "numberE164CheckEnabled": true,
      "number": "string",
      "extension": "string",
      "callerId": "string",
      "transferPlan": {
        "mode": "blind-transfer",
        "message": "string",
        "sipVerb": "refer",
        "twiml": "string",
        "summaryPlan": {
          "messages": [
            {}
          ],
          "enabled": true,
          "timeoutSeconds": 60
        }
      },
      "description": "string"
    },
    "provider": "twilio",
    "id": "string",
    "orgId": "string",
    "createdAt": "2025-03-09T20:16:58.146Z",
    "updatedAt": "2025-03-09T20:16:58.146Z",
    "status": "active",
    "name": "string",
    "assistantId": "string",
    "squadId": "string",
    "server": {
      "timeoutSeconds": 20,
      "url": "string",
      "secret": "string",
      "headers": {},
      "backoffPlan": {
        "maxRetries": 0,
        "type": "fixed",
        "baseDelaySeconds": 1
      }
    },
    "number": "string",
    "twilioAccountSid": "string",
    "twilioAuthToken": "string"
  },
  {
    "fallbackDestination": {
      "message": "string",
      "type": "number",
      "numberE164CheckEnabled": true,
      "number": "string",
      "extension": "string",
      "callerId": "string",
      "transferPlan": {
        "mode": "blind-transfer",
        "message": "string",
        "sipVerb": "refer",
        "twiml": "string",
        "summaryPlan": {
          "messages": [
            {}
          ],
          "enabled": true,
          "timeoutSeconds": 60
        }
      },
      "description": "string"
    },
    "provider": "vonage",
    "id": "string",
    "orgId": "string",
    "createdAt": "2025-03-09T20:16:58.147Z",
    "updatedAt": "2025-03-09T20:16:58.147Z",
    "status": "active",
    "name": "string",
    "assistantId": "string",
    "squadId": "string",
    "server": {
      "timeoutSeconds": 20,
      "url": "string",
      "secret": "string",
      "headers": {},
      "backoffPlan": {
        "maxRetries": 0,
        "type": "fixed",
        "baseDelaySeconds": 1
      }
    },
    "number": "string",
    "credentialId": "string"
  },
  {
    "fallbackDestination": {
      "message": "string",
      "type": "number",
      "numberE164CheckEnabled": true,
      "number": "string",
      "extension": "string",
      "callerId": "string",
      "transferPlan": {
        "mode": "blind-transfer",
        "message": "string",
        "sipVerb": "refer",
        "twiml": "string",
        "summaryPlan": {
          "messages": [
            {}
          ],
          "enabled": true,
          "timeoutSeconds": 60
        }
      },
      "description": "string"
    },
    "provider": "vapi",
    "id": "string",
    "orgId": "string",
    "createdAt": "2025-03-09T20:16:58.147Z",
    "updatedAt": "2025-03-09T20:16:58.147Z",
    "status": "active",
    "number": "string",
    "name": "string",
    "assistantId": "string",
    "squadId": "string",
    "server": {
      "timeoutSeconds": 20,
      "url": "string",
      "secret": "string",
      "headers": {},
      "backoffPlan": {
        "maxRetries": 0,
        "type": "fixed",
        "baseDelaySeconds": 1
      }
    },
    "numberDesiredAreaCode": "str",
    "sipUri": "string",
    "authentication": {
      "realm": "string",
      "username": "stringstringstringst",
      "password": "stringstringstringst"
    }
  }
]


3. Get Phone number (id) :
GET
/phone-number/{id}
Get Phone Number


Parameters
Try it out
Name	Description
id *
string
(path)
id
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "fallbackDestination": {
    "message": "string",
    "type": "number",
    "numberE164CheckEnabled": true,
    "number": "string",
    "extension": "string",
    "callerId": "string",
    "transferPlan": {
      "mode": "blind-transfer",
      "message": "string",
      "sipVerb": "refer",
      "twiml": "string",
      "summaryPlan": {
        "messages": [
          {}
        ],
        "enabled": true,
        "timeoutSeconds": 60
      }
    },
    "description": "string"
  },
  "provider": "byo-phone-number",
  "numberE164CheckEnabled": true,
  "id": "string",
  "orgId": "string",
  "createdAt": "2025-03-09T20:18:16.047Z",
  "updatedAt": "2025-03-09T20:18:16.047Z",
  "status": "active",
  "name": "string",
  "assistantId": "string",
  "squadId": "string",
  "server": {
    "timeoutSeconds": 20,
    "url": "string",
    "secret": "string",
    "headers": {},
    "backoffPlan": {
      "maxRetries": 0,
      "type": "fixed",
      "baseDelaySeconds": 1
    }
  },
  "number": "string",
  "credentialId": "string"
}

4. Update phone number (id)
PATCH
/phone-number/{id}
Update Phone Number


Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "fallbackDestination": {
    "message": "string",
    "type": "number",
    "numberE164CheckEnabled": true,
    "number": "string",
    "extension": "string",
    "callerId": "string",
    "transferPlan": {
      "mode": "blind-transfer",
      "message": "string",
      "sipVerb": "refer",
      "twiml": "string",
      "summaryPlan": {
        "messages": [
          {}
        ],
        "enabled": true,
        "timeoutSeconds": 60
      }
    },
    "description": "string"
  },
  "numberE164CheckEnabled": true,
  "name": "string",
  "assistantId": "string",
  "squadId": "string",
  "server": {
    "timeoutSeconds": 20,
    "url": "string",
    "secret": "string",
    "headers": {},
    "backoffPlan": {
      "maxRetries": 0,
      "type": "fixed",
      "baseDelaySeconds": 1
    }
  },
  "number": "string",
  "credentialId": "string"
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "fallbackDestination": {
    "message": "string",
    "type": "number",
    "numberE164CheckEnabled": true,
    "number": "string",
    "extension": "string",
    "callerId": "string",
    "transferPlan": {
      "mode": "blind-transfer",
      "message": "string",
      "sipVerb": "refer",
      "twiml": "string",
      "summaryPlan": {
        "messages": [
          {}
        ],
        "enabled": true,
        "timeoutSeconds": 60
      }
    },
    "description": "string"
  },
  "provider": "byo-phone-number",
  "numberE164CheckEnabled": true,
  "id": "string",
  "orgId": "string",
  "createdAt": "2025-03-09T20:18:53.682Z",
  "updatedAt": "2025-03-09T20:18:53.682Z",
  "status": "active",
  "name": "string",
  "assistantId": "string",
  "squadId": "string",
  "server": {
    "timeoutSeconds": 20,
    "url": "string",
    "secret": "string",
    "headers": {},
    "backoffPlan": {
      "maxRetries": 0,
      "type": "fixed",
      "baseDelaySeconds": 1
    }
  },
  "number": "string",
  "credentialId": "string"
}


5. Delete Phone number (id):

DELETE
/phone-number/{id}
Delete Phone Number


Parameters
Try it out
Name	Description
id *
string
(path)
id
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "fallbackDestination": {
    "message": "string",
    "type": "number",
    "numberE164CheckEnabled": true,
    "number": "string",
    "extension": "string",
    "callerId": "string",
    "transferPlan": {
      "mode": "blind-transfer",
      "message": "string",
      "sipVerb": "refer",
      "twiml": "string",
      "summaryPlan": {
        "messages": [
          {}
        ],
        "enabled": true,
        "timeoutSeconds": 60
      }
    },
    "description": "string"
  },
  "provider": "byo-phone-number",
  "numberE164CheckEnabled": true,
  "id": "string",
  "orgId": "string",
  "createdAt": "2025-03-09T20:19:51.198Z",
  "updatedAt": "2025-03-09T20:19:51.198Z",
  "status": "active",
  "name": "string",
  "assistantId": "string",
  "squadId": "string",
  "server": {
    "timeoutSeconds": 20,
    "url": "string",
    "secret": "string",
    "headers": {},
    "backoffPlan": {
      "maxRetries": 0,
      "type": "fixed",
      "baseDelaySeconds": 1
    }
  },
  "number": "string",
  "credentialId": "string"
}

