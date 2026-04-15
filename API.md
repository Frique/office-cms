# API Reference

## Base URL

```
http://localhost:3000
```

## Authentication

Session-based. Login via `POST /auth/login` to receive a session cookie.

---

## Auth Endpoints

### POST /auth/login

Login with admin credentials.

**Request:**
```json
{
  "email": "admin@offices.local",
  "password": "changeme123"
}
```

**Response (200):**
```json
{
  "success": true,
  "redirect": "/admin"
}
```

**Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

### POST /auth/logout

Destroy the current session.

**Response (200):**
```json
{ "success": true }
```

---

### GET /auth/check

Check if the current session is authenticated.

**Response:**
```json
{
  "authenticated": true,
  "email": "admin@offices.local"
}
```

---

## Public API

### GET /api/offices

List all published offices.

**Response:**
```json
{
  "offices": [
    {
      "id": "uuid",
      "name": "North Office",
      "location": "Nairobi, Kenya",
      "description": "A beautiful office...",
      "contact_email": "north@example.com",
      "contact_phone": "+254 700 000 000",
      "contact_address": "123 Street, City",
      "photos": ["/uploads/uuid/photo_123.webp"],
      "published": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET /api/offices/:id

Get a single office by ID.

**Response (200):**
```json
{
  "office": { ... }
}
```

**Response (404):**
```json
{ "error": "Office not found" }
```

---

## Admin API (Requires Authentication)

### GET /admin/api/offices

List all offices (including unpublished).

**Response:** Same as public `/api/offices` but includes drafts.

---

### POST /admin/api/offices

Create a new office.

**Request:**
```json
{
  "name": "South Office",
  "location": "Mombasa, Kenya",
  "description": "Coastal office with sea views.",
  "contact_email": "south@example.com",
  "contact_phone": "+254 700 111 000",
  "contact_address": "456 Beach Rd, Mombasa",
  "published": true
}
```

**Response (201):**
```json
{
  "office": { "id": "new-uuid", ... }
}
```

---

### PUT /admin/api/offices/:id

Update an existing office.

**Request:** Same fields as POST (all optional).

**Response (200):**
```json
{
  "office": { ... }
}
```

---

### DELETE /admin/api/offices/:id

Delete an office and all its photos.

**Response (200):**
```json
{ "success": true }
```

---

## Upload API (Requires Authentication)

### POST /api/upload/:officeId

Upload a photo for an office.

**Request:** `multipart/form-data` with `photo` field.

- Max size: 5MB
- Formats: JPEG, PNG, WebP

**Response (200):**
```json
{
  "success": true,
  "url": "/uploads/uuid/photo_1234567890.webp",
  "photos": ["/uploads/uuid/photo_1234567890.webp"]
}
```

---

### DELETE /api/upload/:officeId/:photoIndex

Delete a photo by its index.

**Response (200):**
```json
{
  "success": true,
  "photos": []
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Auth (`/auth/login`) | 15 requests/minute |
| API endpoints | 100 requests/minute |

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthorized |
| 404 | Not found |
| 429 | Rate limit exceeded |
| 500 | Server error |
