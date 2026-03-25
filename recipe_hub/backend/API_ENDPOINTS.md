# API Endpoints Reference

All endpoints are prefixed with the base URL: `https://recipehub-backend-b0oz.onrender.com`

## Authentication

### POST /auth/login
Login user and get JWT tokens.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "user": {...},
  "refresh": "string",
  "access": "string"
}
```

### POST /auth/signup
Register new user.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "password2": "string",
  "first_name": "string (optional)",
  "last_name": "string (optional)",
  "role": "user|company|admin"
}
```

**Response:**
```json
{
  "user": {...},
  "refresh": "string",
  "access": "string"
}
```

---

## Videos

### GET /videos?status=approved
Get list of videos. Filter by status (pending, approved, rejected).

**Query Parameters:**
- `status` (optional): Filter by status. Default: approved

**Response:**
```json
{
  "count": 0,
  "next": null,
  "previous": null,
  "results": [...]
}
```

### GET /videos/search?q={query}
Search videos by title or description.

**Query Parameters:**
- `q` (required): Search query

**Response:**
```json
[...]
```

### GET /videos/{id}
Get video details.

**Response:**
```json
{
  "id": 1,
  "title": "string",
  "description": "string",
  "video_url": "string",
  "thumbnail": "string",
  "duration": 0,
  "views": 0,
  "likes": 0,
  "status": "string",
  "created_by": {...},
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### POST /videos
Create new video. **Requires Authentication**

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "video_url": "string",
  "thumbnail": "file (optional)",
  "duration": 0
}
```

### PATCH /videos/{id}
Update video. **Requires Authentication** (owner only)

### DELETE /videos/{id}
Delete video. **Requires Authentication** (owner only)

---

## Users

### GET /users/{id}
Get user profile.

**Response:**
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "role": "string",
  "avatar": "string",
  "bio": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### PATCH /users/{id}
Update user profile. **Requires Authentication** (owner only)

**Request Body:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "bio": "string",
  "avatar": "file"
}
```

---

## Jobs

### GET /jobs?status=approved
Get list of jobs. Filter by status.

**Query Parameters:**
- `status` (optional): Filter by status. Default: approved

**Response:**
```json
{
  "count": 0,
  "next": null,
  "previous": null,
  "results": [...]
}
```

### GET /jobs/{id}
Get job details.

**Response:**
```json
{
  "id": 1,
  "title": "string",
  "description": "string",
  "company": {...},
  "location": "string",
  "salary_min": "decimal",
  "salary_max": "decimal",
  "status": "string",
  "application_count": 0,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### POST /jobs
Create new job. **Requires Authentication** (company role only)

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "location": "string",
  "salary_min": "decimal",
  "salary_max": "decimal"
}
```

### POST /jobs/{id}/apply
Apply for a job. **Requires Authentication**

**Request Body:**
```form-data
{
  "cover_letter": "string",
  "resume": "file (optional)"
}
```

**Response:**
```json
{
  "id": 1,
  "job": {...},
  "applicant": {...},
  "cover_letter": "string",
  "resume": "string",
  "status": "pending",
  "applied_at": "datetime"
}
```

### GET /jobs/company/{id}
Get jobs posted by a specific company.

**Response:**
```json
[...]
```

### GET /jobs/{id}/applicants
Get applicants for a job. **Requires Authentication** (company owner or admin only)

**Response:**
```json
[...]
```

---

## Admin

### GET /admin/stats
Get admin statistics. **Requires Authentication** (admin role only)

**Response:**
```json
{
  "users": {
    "total": 0,
    "regular": 0,
    "companies": 0,
    "admins": 0
  },
  "videos": {
    "total": 0,
    "approved": 0,
    "pending": 0,
    "rejected": 0
  },
  "jobs": {
    "total": 0,
    "approved": 0,
    "pending": 0,
    "rejected": 0
  },
  "applications": {
    "total": 0,
    "pending": 0,
    "accepted": 0,
    "rejected": 0
  },
  "notifications": {
    "total": 0,
    "unread": 0
  }
}
```

### PATCH /admin/jobs/{id}/status
Update job status. **Requires Authentication** (admin role only)

**Request Body:**
```json
{
  "status": "pending|approved|rejected"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "string",
  "status": "approved",
  ...
}
```

### GET /admin/users
Get all users. **Requires Authentication** (admin role only)

**Response:**
```json
[...]
```

---

## Notifications

### GET /notifications
Get user notifications. **Requires Authentication**

**Response:**
```json
{
  "count": 0,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "notification_type": "string",
      "title": "string",
      "message": "string",
      "is_read": false,
      "created_at": "datetime"
    }
  ]
}
```

---

## Authentication Header

All protected endpoints require JWT authentication:

```
Authorization: Bearer <access_token>
```

The access token is obtained from `/auth/login` or `/auth/signup` endpoints.

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Error message",
  "field_name": ["Error details"]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied"
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```
