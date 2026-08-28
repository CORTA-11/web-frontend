# Browser API contract

The frontend integrates with the reviewed v1 contract maintained by `core-api`:

- Source: `core-api/api/openapi.yaml`
- Browser prefix: `/api/v1`
- Authentication: opaque HttpOnly session cookie
- Unsafe requests: `X-CSRF-Token` from the current auth response

This file intentionally does not duplicate the OpenAPI document. Update the source contract first, then align the typed frontend client and its intercepted browser tests.
