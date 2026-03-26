# Quick Start Guide

## 1. Setup (First Time)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env if needed (defaults work for development)

# Run migrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser
# Follow prompts, then set role to 'admin' in Django admin
```

## 2. Run Server

```bash
# Make sure virtual environment is activated
python manage.py runserver
```

Server runs on `https://recipehub-backend-b0oz.onrender.com`

## 3. Test API

### Using curl:

```bash
# Signup
curl -X POST https://recipehub-backend-b0oz.onrender.com/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123","password2":"testpass123","role":"user"}'

# Login
curl -X POST https://recipehub-backend-b0oz.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

# Get videos (no auth required)
curl https://recipehub-backend-b0oz.onrender.com/videos?status=approved

# Get videos with auth (replace TOKEN with access token from login)
curl https://recipehub-backend-b0oz.onrender.com/videos \
  -H "Authorization: Bearer TOKEN"
```

### Using Python requests:

```python
import requests

BASE_URL = "https://recipehub-backend-b0oz.onrender.com"

# Login
response = requests.post(f"{BASE_URL}/auth/login", json={
    "username": "testuser",
    "password": "testpass123"
})
data = response.json()
token = data["access"]

# Get videos
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(f"{BASE_URL}/videos", headers=headers)
print(response.json())
```

## 4. Access Django Admin

1. Go to `https://recipehub-backend-b0oz.onrender.com/django-admin/`
2. Login with superuser credentials
3. Manage users, videos, jobs, etc.

## 5. Common Tasks

### Create a Company User

```python
python manage.py shell
```

```python
from accounts.models import User
user = User.objects.create_user(
    username='company1',
    email='company@example.com',
    password='password123',
    role='company'
)
```

### Create Test Data

Use Django admin or Django shell to create test videos, jobs, etc.

## Troubleshooting

### Port already in use
```bash
python manage.py runserver 8001
```

### Migration errors
```bash
python manage.py makemigrations
python manage.py migrate
```

### CORS errors
Check `.env` file and ensure `CORS_ALLOWED_ORIGINS` includes your frontend URL.

### Import errors
Make sure virtual environment is activated and dependencies are installed:
```bash
pip install -r requirements.txt
```
