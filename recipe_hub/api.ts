import { supabase } from './src/lib/supabase';
import type { InstructionStep, ContentStatus, Job, UserNotification } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://recipehub-backend-b0oz.onrender.com/api';

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE.replace(/\/+$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  // Ensure /api/ prefix if not present
  const apiPath = normalized.startsWith('/api/') ? normalized : `/api${normalized}`;
  return `${base}${apiPath}`;
}

async function getAuthHeaders() {
  const token = sessionStorage.getItem('recipehub_access_token');
  return token ? { Authorization: `Token ${token}` } : {};
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data === 'object' && data) {
        if ('detail' in data) message = (data as any).detail;
        else if ('error' in data) message = (data as any).error;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ---------- Auth ----------

export interface ApiUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
  avatar: string | null;
  profile_picture?: string;
  role: 'user' | 'company' | 'admin';
  followers_count: number;
  following_count: number;
  videos_count: number;
  industry?: string;
  location?: string;
  contact_number?: string;
  hr_name?: string;
}

export interface AuthResponse {
  user_id: string;
  token: string;
  email: string;
  username: string;
}

export async function loginApi(credentials: any): Promise<AuthResponse> {
  const res = await fetch(buildUrl('/accounts/auth/login/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return handleJson<AuthResponse>(res);
}

export async function signupApi(data: any): Promise<any> {
  const res = await fetch(buildUrl('/accounts/auth/signup/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleJson<any>(res);
}

export async function searchUsersApi(query: string): Promise<ApiUser[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/accounts/auth/search_users/?q=${query}`), {
    headers,
  });
  return handleJson<ApiUser[]>(res);
}

export async function fetchProfile(username?: string): Promise<ApiUser> {
  const headers = await getAuthHeaders();
  const url = username ? buildUrl(`/accounts/profile/${username}/`) : buildUrl('/accounts/profile/');
  const res = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  return handleJson<ApiUser>(res);
}

export async function updateProfileApi(data: Partial<ApiUser>): Promise<ApiUser> {
  const headers = await getAuthHeaders();
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {

      if (key === 'avatar' && (value as any) instanceof File) {
        formData.append('profile_picture', value as any);
      }
      else if (key === 'profile_picture' && (value as any) instanceof File) {
        formData.append('profile_picture', value as any);
      }
      else {
        formData.append(key, String(value));
      }

    }
  });

  const res = await fetch(buildUrl('/accounts/profile/'), {
    method: 'PATCH',
    headers: headers, // Fetch will automatically set content-type for FormData
    body: formData,
    credentials: 'include',
  });
  return handleJson<ApiUser>(res);
}

// ---------- Videos ----------

export interface PaginatedResponse<T> {
  count: number;
  results: T[];
  num_pages?: number;
  current_page?: number;
}

export interface ApiVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  creator_username: string;
  view_count: number;
  like_count: number;
  ingredients?: string;
  instructions?: string;
  status?: ContentStatus;
  user?: string;
  category?: string;
  created_at: string;
}

export interface ApiComment {
  id: string;
  username: string;
  avatar?: string;
  text: string;
  created_at: string;
}

export interface ApiNotification {
  id: string | number;
  text: string;
  is_read: boolean;
  created_at: string;
}

export async function fetchApprovedVideos(page = 1): Promise<PaginatedResponse<ApiVideo>> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/videos/feed/?page=${page}`), {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  return handleJson<PaginatedResponse<ApiVideo>>(res);
}

export async function createVideoApi(formData: FormData, onProgress?: (percent: number) => void): Promise<ApiVideo> {
  const url = buildUrl('/videos/');
  const headers = await getAuthHeaders();

  // Use XMLHttpRequest to expose upload progress while keeping the same API shape.
  return new Promise<ApiVideo>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, String(value));
    });

    xhr.withCredentials = true;

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {

          const raw = JSON.parse(xhr.responseText)

          const data: ApiVideo = {
            ...raw,
            ingredients: raw.ingredients,
            instructions: raw.instructions
          }

          resolve(data)

        } catch {
          reject(new Error('Failed to parse upload response'))
        }
      }
      else {
        try {
          const data = JSON.parse(xhr.responseText);
          const message = (data && (data.detail || data.error)) || `Request failed with status ${xhr.status}`;
          reject(new Error(message));
        } catch {
          reject(new Error(`Request failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error while uploading video'));
    };

    xhr.send(formData);
  });
}

export async function likeVideoApi(videoId: string): Promise<{ status: string; like_count: number }> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/videos/${videoId}/like/`), {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    credentials: 'include',
  });
  return handleJson<any>(res);
}

export async function recordViewApi(videoId: string): Promise<{ status: string; view_count: number }> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/videos/${videoId}/record_view/`), {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    credentials: 'include',
  });
  return handleJson<any>(res);
}

export async function commentVideoApi(videoId: string, text: string): Promise<ApiComment> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/videos/${videoId}/comment/`), {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text }),
    credentials: 'include',
  });
  return handleJson<ApiComment>(res);
}

export async function fetchCommentsApi(videoId: string): Promise<ApiComment[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/videos/${videoId}/comment/`), {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  return handleJson<ApiComment[]>(res);
}

// ---------- Notifications ----------

export async function fetchNotificationsApi(): Promise<ApiNotification[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl('/notifications/'), {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  const data = await handleJson<any>(res);
  // Normalize: handle both paginated {results: [...]} and flat array responses
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export async function broadcastNotificationApi(message: string): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl('/notifications/broadcast/'), {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return handleJson<any>(res);
}

// ---------- Follow ----------

export async function followUserApi(userId: string): Promise<{ message: string; followers_count: number; following_count: number; is_following: boolean }> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/accounts/follow/${userId}/`), {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    credentials: 'include',
  });
  return handleJson<any>(res);
}

export async function fetchUserVideosApi(userId: string): Promise<PaginatedResponse<ApiVideo>> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/videos/?user=${userId}`), {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  return handleJson<PaginatedResponse<ApiVideo>>(res);
}

export async function fetchVideoDetail(videoId: string): Promise<ApiVideo> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/videos/${videoId}/`), {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  return handleJson<ApiVideo>(res);
}

export async function checkFollowStatusApi(targetId: string): Promise<{ is_following: boolean }> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/accounts/follow/${targetId}/check_follow/`), {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  return handleJson<{ is_following: boolean }>(res);
}

export async function fetchFollowersApi(userId: string): Promise<ApiUser[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/accounts/follow/${userId}/followers/`), {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  return handleJson<ApiUser[]>(res);
}

export async function fetchFollowingApi(userId: string): Promise<ApiUser[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/accounts/follow/${userId}/following/`), {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  return handleJson<ApiUser[]>(res);
}

export async function unfollowUserApi(userId: string): Promise<{ message: string; followers_count: number; following_count: number; is_following: boolean }> {
  // Use the same toggle endpoint
  return followUserApi(userId);
}

// ---------- Storage ----------

export function mapApiJobToJob(api: any): Job {
  return {
    id: String(api.id),
    companyId: String(api.user),
    companyName: api.company_name || 'Organization',
    companyLogo: api.company_logo,
    companyIndustry: api.company_industry,
    title: api.title,
    description: api.description,
    skills: Array.isArray(api.skills) ? api.skills : [],
    salary: api.salary,
    jobType: api.job_type,
    workingHours: api.working_hours,
    weeklyOff: api.weekly_off,
    location: api.location,
    experience: api.experience,
    contactMethod: api.contact_method,
    status: api.status,
    postedAt: api.created_at,
    lastDate: api.last_date,
    applicantIds: api.applicant_ids || []
  };
}

export async function uploadToSupabase(file: File, bucket: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}

// ---------- Jobs ----------

export async function fetchJobsApi(): Promise<Job[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl('/jobs/'), {
    headers,
  });
  const data = await handleJson<any>(res);
  const items = Array.isArray(data) ? data : (data?.results || []);
  return items.map(mapApiJobToJob);
}

export async function createJobApi(data: any): Promise<Job> {
  const headers = await getAuthHeaders();
  // Map camelCase to snake_case for backend
  const backendData = {
    title: data.title,
    description: data.description,
    salary: data.salary,
    location: data.location,
    skills: Array.isArray(data.skills) ? data.skills.join(', ') : data.skills,
    job_type: data.jobType,
    working_hours: data.workingHours,
    weekly_off: data.weeklyOff,
    experience: data.experience,
    contact_method: data.contactMethod,
    last_date: data.lastDate
  };

  const res = await fetch(buildUrl('/jobs/'), {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(backendData),
  });
  const result = await handleJson<any>(res);
  return mapApiJobToJob(result);
}

export async function deleteJobApi(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/jobs/${id}/`), {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete job');
}

export async function updateJobStatusApi(id: string, status: ContentStatus): Promise<Job> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/jobs/${id}/`), {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status }),
  });
  const result = await handleJson<any>(res);
  return mapApiJobToJob(result);
}

export async function applyToJobApi(jobId: string, resumeUrl: string): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/jobs/${jobId}/apply/`), {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ resume_url: resumeUrl }),
  });
  return handleJson<any>(res);
}

// ---------- Admin ----------

export async function fetchAdminMetricsApi(): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl('/admin/metrics/'), { headers });
  return handleJson<any>(res);
}

export async function fetchAdminUsersApi(): Promise<ApiUser[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl('/admin/users/'), { headers });
  return handleJson<ApiUser[]>(res);
}

export async function fetchAdminCompaniesApi(): Promise<ApiUser[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl('/admin/companies/'), { headers });
  return handleJson<ApiUser[]>(res);
}

export async function banUserApi(id: string): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/admin/users/${id}/ban/`), { method: 'PATCH', headers });
  return handleJson<any>(res);
}

export async function approveVideoApi(id: string): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/admin/videos/${id}/approve/`), { method: 'POST', headers });
  return handleJson<any>(res);
}

export async function adminDeleteVideoApi(id: string): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/admin/videos/${id}/`), { method: 'DELETE', headers });
  if (!res.ok) throw new Error('Failed to delete video');
}

export async function adminApproveJobApi(id: string): Promise<Job> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(`/admin/jobs/${id}/approve/`), { method: 'POST', headers });
  const result = await handleJson<any>(res);
  return mapApiJobToJob(result);
}