# Recipe Hub Backend

Django REST Framework backend for Recipe Hub application.

## Tech Stack

- **Python 3.8+**
- **Django 5.0.1**
- **Django REST Framework 3.14.0**
- **SimpleJWT 5.3.1** (for authentication)
- **django-cors-headers 4.3.1** (for CORS)
- **SQLite** (default, can be switched to PostgreSQL)

## Project Structure

```
backend/
├── recipehub/          # Main Django project
│   ├── settings.py     # Project settings
│   ├── urls.py         # Main URL routing
│   └── ...
├── accounts/           # User authentication & profiles
├── videos/             # Recipe/Video management
├── jobs/               # Job postings & applications
├── notifications/      # User notifications
├── adminpanel/         # Admin stats & approvals
├── manage.py
├── requirements.txt
└── .env.example
```

## Django Apps

### 1. **accounts** - Authentication & User Management
- Custom User model with roles (user, company, admin)
- JWT-based authentication
- User profile management

### 2. **videos** - Recipe/Video Management
- Video/Recipe model with approval workflow
- Search functionality
- Status filtering (pending, approved, rejected)

### 3. **jobs** - Job Postings & Applications
- Job model for company postings
- JobApplication model for user applications
- Company-specific job listings

### 4. **notifications** - User Notifications
- Notification model for various events
- Read/unread status tracking

### 5. **adminpanel** - Admin Dashboard
- Statistics endpoint
- Job approval/rejection
- User management

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and update:
- `SECRET_KEY` - Django secret key (generate a new one for production)
- `DEBUG` - Set to `False` in production
- `ALLOWED_HOSTS` - Add your domain in production
- `CORS_ALLOWED_ORIGINS` - Add your frontend URL

### 4. Database Setup

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (Admin)

```bash
python manage.py createsuperuser
```

Follow prompts to create admin user. Set role to 'admin' in Django admin panel.

### 6. Run Development Server

```bash
python manage.py runserver
```

Server will run on `https://recipehub-backend-b0oz.onrender.com/api`

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login

### Videos
- `GET /videos?status=approved` - List videos (filter by status)
- `GET /videos/search?q={query}` - Search videos
- `POST /videos` - Create video (authenticated)
- `GET /videos/<id>` - Get video details
- `PATCH /videos/<id>` - Update video (authenticated)
- `DELETE /videos/<id>` - Delete video (authenticated)

### Users
- `GET /users/<id>` - Get user profile
- `PATCH /users/<id>` - Update user profile (authenticated)

### Jobs
- `GET /jobs?status=approved` - List jobs (filter by status)
- `POST /jobs` - Create job (company only)
- `GET /jobs/<id>` - Get job details
- `POST /jobs/<id>/apply` - Apply for job (authenticated)
- `GET /jobs/company/<id>` - Get jobs by company
- `GET /jobs/<id>/applicants` - Get applicants (company/admin only)

### Admin
- `GET /admin/stats` - Get statistics (admin only)
- `PATCH /admin/jobs/<id>/status` - Update job status (admin only)
- `GET /admin/users` - List all users (admin only)

### Notifications
- `GET /notifications` - Get user notifications (authenticated)

## Authentication

All protected endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Usage

After login/signup, you'll receive:
```json
{
  "user": {...},
  "refresh": "refresh_token_here",
  "access": "access_token_here"
}
```

- **Access Token**: Use in `Authorization: Bearer <access_token>` header
- **Refresh Token**: Use to get new access tokens (not implemented in this version)

## Connecting React Frontend

### Axios Configuration

Create an `api.js` file in your React project:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://recipehub-backend-b0oz.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Example API Calls

```javascript
import api from './api';

// Login
const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  localStorage.setItem('access_token', response.data.access);
  return response.data;
};

// Get videos
const getVideos = async (status = 'approved') => {
  const response = await api.get(`/videos?status=${status}`);
  return response.data;
};

// Search videos
const searchVideos = async (query) => {
  const response = await api.get(`/videos/search?q=${query}`);
  return response.data;
};

// Get user profile
const getUser = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

// Update user profile
const updateUser = async (userId, data) => {
  const response = await api.patch(`/users/${userId}`, data);
  return response.data;
};

// Get jobs
const getJobs = async (status = 'approved') => {
  const response = await api.get(`/jobs?status=${status}`);
  return response.data;
};

// Apply for job
const applyForJob = async (jobId, coverLetter, resume) => {
  const formData = new FormData();
  formData.append('cover_letter', coverLetter);
  if (resume) formData.append('resume', resume);
  
  const response = await api.post(`/jobs/${jobId}/apply`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Get company jobs
const getCompanyJobs = async (companyId) => {
  const response = await api.get(`/jobs/company/${companyId}`);
  return response.data;
};

// Get notifications
const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};
```

## User Roles

- **user**: Regular users who can view content, apply for jobs
- **company**: Companies that can post jobs and view applicants
- **admin**: Administrators who can approve/reject content and view stats

## Database Models

- **User**: Custom user model with roles
- **Video**: Recipe/video content with approval workflow
- **Job**: Job postings by companies
- **JobApplication**: Applications for jobs
- **Notification**: User notifications

## Development Notes

- Media files (images, resumes) are stored in `backend/media/`
- SQLite database is at `backend/db.sqlite3`
- CORS is configured for `localhost:5173` and `localhost:3000` by default
- JWT tokens expire after 1 hour (access) and 7 days (refresh)

## Production Checklist

- [ ] Change `SECRET_KEY` in `.env`
- [ ] Set `DEBUG=False`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set up PostgreSQL (recommended)
- [ ] Configure static file serving
- [ ] Set up proper CORS origins
- [ ] Use environment variables for sensitive data
- [ ] Set up SSL/HTTPS
- [ ] Configure proper media file storage (S3, etc.)
