# Frontend Integration Guide

This guide shows how to connect your React frontend to the Django backend.

## Axios Setup

### 1. Install Axios

```bash
npm install axios
```

### 2. Create API Configuration

Create `src/api.js` or `src/utils/api.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
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

// Handle 401 errors (token expired)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Remove invalid token
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## API Service Functions

Create `src/services/apiService.js`:

```javascript
import api from '../api';

// ==================== AUTH ====================

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// ==================== VIDEOS ====================

export const videoService = {
  getVideos: async (status = 'approved') => {
    const response = await api.get(`/videos?status=${status}`);
    return response.data;
  },

  searchVideos: async (query) => {
    const response = await api.get(`/videos/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  getVideo: async (id) => {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  },

  createVideo: async (videoData) => {
    const formData = new FormData();
    Object.keys(videoData).forEach(key => {
      if (videoData[key] !== null && videoData[key] !== undefined) {
        formData.append(key, videoData[key]);
      }
    });
    
    const response = await api.post('/videos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateVideo: async (id, videoData) => {
    const formData = new FormData();
    Object.keys(videoData).forEach(key => {
      if (videoData[key] !== null && videoData[key] !== undefined) {
        formData.append(key, videoData[key]);
      }
    });
    
    const response = await api.patch(`/videos/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteVideo: async (id) => {
    const response = await api.delete(`/videos/${id}`);
    return response.data;
  },
};

// ==================== USERS ====================

export const userService = {
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const formData = new FormData();
    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    });
    
    const response = await api.patch(`/users/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// ==================== JOBS ====================

export const jobService = {
  getJobs: async (status = 'approved') => {
    const response = await api.get(`/jobs?status=${status}`);
    return response.data;
  },

  getJob: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  createJob: async (jobData) => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  applyForJob: async (jobId, applicationData) => {
    const formData = new FormData();
    Object.keys(applicationData).forEach(key => {
      if (applicationData[key] !== null && applicationData[key] !== undefined) {
        formData.append(key, applicationData[key]);
      }
    });
    
    const response = await api.post(`/jobs/${jobId}/apply`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getCompanyJobs: async (companyId) => {
    const response = await api.get(`/jobs/company/${companyId}`);
    return response.data;
  },

  getJobApplicants: async (jobId) => {
    const response = await api.get(`/jobs/${jobId}/applicants`);
    return response.data;
  },
};

// ==================== ADMIN ====================

export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  updateJobStatus: async (jobId, status) => {
    const response = await api.patch(`/admin/jobs/${jobId}/status`, { status });
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
};

// ==================== NOTIFICATIONS ====================

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
};
```

## React Hook Example

Create `src/hooks/useAuth.js`:

```javascript
import { useState, useEffect } from 'react';
import { authService } from '../services/apiService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authService.login(username, password);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      const data = await authService.signup(userData);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return { user, loading, login, signup, logout };
};
```

## Usage Example

```javascript
import React, { useState, useEffect } from 'react';
import { videoService } from './services/apiService';
import { useAuth } from './hooks/useAuth';

function VideoList() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const data = await videoService.getVideos('approved');
      setVideos(data.results || data); // Handle pagination
      setLoading(false);
    } catch (error) {
      console.error('Error loading videos:', error);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Videos</h1>
      {videos.map(video => (
        <div key={video.id}>
          <h3>{video.title}</h3>
          <p>{video.description}</p>
        </div>
      ))}
    </div>
  );
}

export default VideoList;
```

## Error Handling

```javascript
try {
  const data = await videoService.getVideos();
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Error:', error.response.data);
    console.error('Status:', error.response.status);
  } else if (error.request) {
    // Request made but no response
    console.error('No response from server');
  } else {
    // Something else happened
    console.error('Error:', error.message);
  }
}
```

## Environment Variables

Create `.env` in your React project:

```env
VITE_API_BASE_URL=http://localhost:8000
# or for Create React App:
# REACT_APP_API_BASE_URL=http://localhost:8000
```

Update `api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
// or for Create React App:
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
```
