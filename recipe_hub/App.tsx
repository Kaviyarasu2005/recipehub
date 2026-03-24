import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Page, Video, UserProfile, UserRole, Language, Job, ContentStatus, UserNotification } from './types';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Profile } from './pages/Profile';
import { Splash } from './pages/Splash';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { UploadPage } from './pages/Upload';
import { RecipeDetail } from './pages/RecipeDetail';
import { Jobs } from './pages/Jobs';
import { AdminDashboard } from './pages/AdminDashboard';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { Notifications } from './pages/Notifications';
import { useNavigate } from 'react-router-dom';
import { AuthResponse, ApiVideo, fetchApprovedVideos, fetchProfile, ApiUser, likeVideoApi, fetchVideoDetail, fetchJobsApi, createJobApi, deleteJobApi, updateJobStatusApi, fetchNotificationsApi, applyToJobApi } from './api';
import { supabase } from './src/lib/supabase';
import { Briefcase, Bell, Clock, CircleHelp } from 'lucide-react';

const buildMediaUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/') ? path : `/${path}`;
};

const mapApiVideoToVideo = (api: ApiVideo): Video => {
  const createdAt = api.created_at ? new Date(api.created_at) : null;
  const postedTime = createdAt ? createdAt.toLocaleDateString() : '';

  return {
    id: String(api.id),
    title: api.title,
    creator: api.creator_username || 'Chef',
    views: `${api.view_count ?? 0} views`,
    likes: api.like_count ?? 0,
    postedTime,
    duration: '00:00',
    thumbnail: buildMediaUrl(api.thumbnail_url),
    category: api.category || 'Veg',
    description: api.description,
    creatorAvatar: buildMediaUrl((api as any).creator_avatar),
    creator_id: String((api as any).creator_id),
    ingredients: api.ingredients || [],
    instructions: api.instructions || [],
    status: api.status || 'approved',
    user_id: String(api.user),
    video_url: buildMediaUrl(api.video_url),
  } as any;
};

const mapApiUserToProfile = (user: ApiUser): UserProfile => ({
  id: String(user.id),
  name: user.first_name || user.username || 'Chef',
  handle: `@${user.username}`,
  role: (user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User') as any,
  bio: user.bio || '',
  avatar: buildMediaUrl(user.avatar),
  stats: {
    videos: (user as any).videos_count || 0,
    followers: Number((user as any).followers_count || 0),
    following: (user as any).following_count || 0
  },
  email: user.email,
  companyDetails: user.industry ? {
    industry: user.industry as any,
    description: user.bio || '',
    location: user.location || '',
    contactNumber: user.contact_number || '',
    hrName: user.hr_name || ''
  } : undefined,
});

const getDashboardByRole = (role: UserRole | undefined): Page => {
  if (role === 'Admin') return 'adminDashboard';
  if (role === 'Company') return 'companyDashboard';
  return 'home';
};

const ComingSoon: React.FC<{ title: string; message?: string; icon?: React.ReactNode }> = ({ title, message, icon }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in-95">
    <div className="bg-white/40 p-12 rounded-[48px] border border-white shadow-sm backdrop-blur-md max-w-lg w-full">
      <div className="text-[#a832d3] mb-6 flex justify-center">{icon || <Clock size={48} />}</div>
      <h2 className="text-3xl font-black mb-4">{title}</h2>
      <p className="text-zinc-500 font-medium text-lg leading-relaxed">{message || "This feature is currently under development."}</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<Page>('splash');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [favorites, setFavorites] = useState<Video[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [language, setLanguage] = useState<Language>('English');
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Handle persistent session from Django token
    const checkSession = async () => {
      setIsAuthLoading(true);
      const token = sessionStorage.getItem('recipehub_access_token');
      if (token) {
        try {
          const user = await fetchProfile();
          const profile = mapApiUserToProfile(user);
          setCurrentUser(profile);
          setIsLoggedIn(true);
          setViewingUser(profile);
        } catch (err) {
          console.error("Token expired or invalid:", err);
          sessionStorage.removeItem('recipehub_access_token');
          setIsLoggedIn(false);
        }
      }
      setIsAuthLoading(false);
    };

    checkSession();

    // Still listen for Supabase signing out to keep everything in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setViewingUser(null);
        sessionStorage.removeItem('recipehub_access_token');
      }
    });

    const parseHash = async (hash: string) => {
      const cleanHash = hash.replace('#', '').replace(/^\/+/, '');

      if (cleanHash === 'home' || !cleanHash) {
        setCurrentPage('home');
        return;
      }

      if (cleanHash.startsWith('recipe/')) {
        const videoId = cleanHash.split('/')[1];
        if (videoId) {
          try {
            const apiVideo = await fetchVideoDetail(videoId);
            setSelectedVideo(mapApiVideoToVideo(apiVideo));
            setCurrentPage('recipeDetail');
          } catch (err) {
            console.error("Failed to fetch video detail on refresh", err);
            setCurrentPage('home');
          }
        }
        return;
      }

      if (cleanHash.startsWith('profile/')) {
        const username = cleanHash.split('/')[1];
        if (username) {
          try {
            const apiUser = await fetchProfile(username);
            setViewingUser(mapApiUserToProfile(apiUser));
            setCurrentPage('profile');
          } catch (err) {
            console.error("Failed to fetch profile on refresh", err);
            setCurrentPage('home');
          }
        }
        return;
      }

      if (['login', 'signup', 'adminLogin'].includes(cleanHash) && sessionStorage.getItem('recipehub_access_token')) {
        handleNavigate(getDashboardByRole(currentUser?.role), true);
        return;
      }

      setCurrentPage(cleanHash as Page);
    };

    const handleInitialRouting = () => {
      parseHash(window.location.hash);
    };
    handleInitialRouting();

    const onHashChange = () => {
      parseHash(window.location.hash);
    };

    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadVideos = async () => {
      try {
        const res = await fetchApprovedVideos();
        if (!cancelled) {
          setAllVideos((res.results || []).map(mapApiVideoToVideo));
        }
      } catch (err) {
        console.error('Failed to load videos from backend', err);
      }
    };
    loadVideos();
    return () => {
      cancelled = true;
    };
  }, []);

  // Effect to handle automated role-based redirection for logged in users
  useEffect(() => {
    if (currentPage === 'splash' || isAuthLoading) return;

    if (isLoggedIn && currentUser) {
      const dashboard = getDashboardByRole(currentUser.role);

      // If user is on a page that should redirect to their dashboard (home, login, etc.)
      if (['home', 'login', 'signup', 'adminLogin'].includes(currentPage)) {
        if (dashboard !== 'home' && currentPage !== dashboard) {
          handleNavigate(dashboard, true);
          return;
        }
      }

      // Security: ensure users don't access dashboards they don't belong to
      if (currentPage === 'adminDashboard' && currentUser.role !== 'Admin') {
        handleNavigate('home', true);
      } else if (currentPage === 'companyDashboard' && currentUser.role !== 'Company') {
        handleNavigate('home', true);
      }
    } else if (!isLoggedIn) {
      // Redirect protected pages to login if not authenticated
      const protectedPages = ['profile', 'adminDashboard', 'companyDashboard', 'upload', 'notifications'];
      if (protectedPages.includes(currentPage)) {
        handleNavigate('login', true);
      }
    }
  }, [isLoggedIn, currentUser, currentPage, isAuthLoading]);

  // Load jobs (public) and notifications (authenticated) once
  useEffect(() => {
    fetchJobsApi()
      .then(setJobs)
      .catch(err => console.error("Failed to load jobs", err));

    if (!isLoggedIn) return;

    fetchNotificationsApi()
      .then((items) => {
        const mapped: UserNotification[] = items.map((n) => ({
          id: String(n.id),
          recipientId: 'all',
          senderName: 'RecipeHub',
          title: 'Notification',
          message: n.text,
          time: new Date(n.created_at).toLocaleString(),
          type: n.is_read ? 'system' : 'announcement',
          read: n.is_read,
        }));
        setNotifications(mapped);
      })
      .catch(err => console.error("Failed to load notifications", err));
  }, [isLoggedIn]);

  const handleNavigate = (page: Page, replace = false) => {
    if (replace) {
      window.history.replaceState(null, '', `#${page}`);
    } else {
      window.location.hash = page;
    }
    setCurrentPage(page);
  };

  const handleLogin = async (auth: AuthResponse) => {
    const { token } = auth;
    sessionStorage.setItem('recipehub_access_token', token);

    try {
      const user = await fetchProfile();
      const profile = mapApiUserToProfile(user);
      setCurrentUser(profile);
      setViewingUser(profile);
      setIsLoggedIn(true);

      handleNavigate(getDashboardByRole(profile.role), true);
    } catch (err) {
      console.error("Failed to load profile after login:", err);
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setViewingUser(null);
    sessionStorage.removeItem('recipehub_access_token');
    await supabase.auth.signOut();
    handleNavigate('home');
  };

  const handleNavigateToProfile = async (target: UserProfile | string) => {
    if (target === currentUser?.id || target === (currentUser as any)?.username || (typeof target !== 'string' && target.id === currentUser?.id)) {
      setViewingUser(null);
      handleNavigate('profile');
      return;
    }
    const username = typeof target === 'string' ? target : target.handle.replace('@', '');
    handleNavigate(`profile/${username}`);
  };

  const renderContent = () => {
    // Standard rendering logic follows...
    switch (currentPage) {
      case 'home':
        return <Home
          videos={allVideos.filter(v => v.status === 'approved' || !v.status)}
          onPlay={v => { setSelectedVideo(v); handleNavigate(`recipe/${v.id}`); }}
          onToggleFavorite={async (v) => {
            if (!isLoggedIn) return;
            try {
              const res = await likeVideoApi(v.id);
              if (res.status === 'liked') setFavorites(f => [...f, v]);
              else setFavorites(f => f.filter(x => x.id !== v.id));
              setAllVideos(prev => prev.map(vid => vid.id === v.id ? { ...vid, likes: res.like_count } : vid));
            } catch (err) {
              console.error("Like failed", err);
            }
          }}
          favorites={favorites}
          onSearch={q => { setSearchQuery(q); handleNavigate('search'); }}
          onNavigate={handleNavigate}
          translate={k => k}
          onNavigateToProfile={handleNavigateToProfile}
          isLoggedIn={isLoggedIn}
        />;
      case 'profile':
        if (!isLoggedIn) return null;
        const profileUser = viewingUser ?? currentUser;
        if (!profileUser) return null;
        return <Profile
          user={profileUser}
          isOwnProfile={profileUser.id === currentUser?.id}
          onNavigate={handleNavigate}
          onPlay={v => { setSelectedVideo(v); handleNavigate(`recipe/${v.id}`); }}
          onToggleFavorite={async (v) => {
            if (!isLoggedIn) return;
            try {
              const res = await likeVideoApi(v.id);
              if (res.status === 'liked') setFavorites(f => [...f, v]);
              else setFavorites(f => f.filter(x => x.id !== v.id));
              setAllVideos(prev => prev.map(vid => vid.id === v.id ? { ...vid, likes: res.like_count } : vid));
            } catch (err) {
              console.error("Like failed", err);
            }
          }}
          favorites={favorites}
          onUpdateProfile={p => {
            setCurrentUser(p);
            if (viewingUser?.id === p.id) {
              setViewingUser(p);
            }
          }}
          videos={allVideos}
          onNavigateToProfile={handleNavigateToProfile}
          currentUser={currentUser}
        />;
      case 'adminDashboard': {
        if (!currentUser) {
          return (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="bg-white/40 p-8 rounded-[32px] border border-white shadow-md">
                <p className="font-black text-lg text-zinc-800">Loading admin dashboard...</p>
              </div>
            </div>
          );
        }
        if (!isLoggedIn || currentUser.role !== 'Admin') {
          return <ComingSoon title="Admin access required" message="Sign in with an admin account to view the control panel." icon={<Clock size={48} />} />;
        }
        return (
          <AdminDashboard
            currentUser={currentUser}
            users={[]}
            videos={allVideos}
            jobs={jobs}
            onUpdateJobStatus={async (id, status) => {
              try {
                const updated = await updateJobStatusApi(id, status);
                setJobs(prev => prev.map(j => j.id === id ? updated : j));
              } catch (err) {
                console.error("Failed to update job status", err);
              }
            }}
            onSendNotification={async (note) => {
              try {
                const { broadcastNotificationApi } = await import('./api');
                await broadcastNotificationApi(note.message);
                toast.success('Broadcast sent successfully');
                // Refresh local notifications
                const items = await fetchNotificationsApi();
                const mapped: UserNotification[] = items.map((n) => ({
                  id: String(n.id),
                  recipientId: 'all',
                  senderName: 'RecipeHub',
                  title: 'Notification',
                  message: n.text,
                  time: new Date(n.created_at).toLocaleString(),
                  type: n.is_read ? 'system' : 'announcement',
                  read: n.is_read,
                }));
                setNotifications(mapped);
              } catch (err) {
                console.error("Failed to send broadcast", err);
                toast.error('Failed to send broadcast');
              }
            }}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );
      }
      case 'companyDashboard': {
        if (!currentUser) {
          return (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="bg-white/40 p-8 rounded-[32px] border border-white shadow-md">
                <p className="font-black text-lg text-zinc-800">Loading company dashboard...</p>
              </div>
            </div>
          );
        }
        if (!isLoggedIn || currentUser.role !== 'Company') {
          return <ComingSoon title="Company access required" message="Sign in with a company account to manage postings." icon={<Clock size={48} />} />;
        }
        return (
          <CompanyDashboard
            currentUser={currentUser}
            users={[]}
            jobs={jobs}
            onAddJob={async (data) => {
              try {
                const newJob = await createJobApi(data);
                setJobs(prev => [newJob, ...prev]);
              } catch (err) {
                console.error("Failed to create job", err);
              }
            }}
            onDeleteJob={async (id) => {
              try {
                await deleteJobApi(id);
                setJobs(prev => prev.filter(j => j.id !== id));
              } catch (err) {
                console.error("Failed to delete job", err);
              }
            }}
            onUpdateProfile={p => {
              setCurrentUser(p);
              setViewingUser(p);
            }}
            onSendNotification={async (note) => {
              try {
                const { broadcastNotificationApi } = await import('./api');
                await broadcastNotificationApi(note.message);
                toast.success('Broadcast sent successfully');
                const items = await fetchNotificationsApi();
                const mapped: UserNotification[] = items.map((n) => ({
                  id: String(n.id),
                  recipientId: 'all',
                  senderName: 'RecipeHub',
                  title: 'Notification',
                  message: n.text,
                  time: new Date(n.created_at).toLocaleString(),
                  type: n.is_read ? 'system' : 'announcement',
                  read: n.is_read,
                }));
                setNotifications(mapped);
              } catch (err) {
                console.error("Failed to send broadcast", err);
                toast.error('Failed to send broadcast');
              }
            }}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );
      }
      case 'login':
        if (isLoggedIn) return null;
        return <Login onNavigate={handleNavigate} onLoginSuccess={handleLogin} />;
      case 'adminLogin':
        if (isLoggedIn) return null;
        return <Login onNavigate={handleNavigate} onLoginSuccess={handleLogin} isAdminMode={true} />;
      case 'signup':
        if (isLoggedIn) return null;
        return <Signup onNavigate={handleNavigate} />;
      case 'upload': return <UploadPage onNavigate={handleNavigate} onUpload={v => setAllVideos(p => [v, ...p])} userName={currentUser?.name || ''} />;
      case 'search': return <Search videos={allVideos} query={searchQuery} onPlay={v => { setSelectedVideo(v); handleNavigate(`recipe/${v.id}`); }} onToggleFavorite={v => setFavorites(f => f.find(x => x.id === v.id) ? f.filter(x => x.id !== v.id) : [...f, v])} favorites={favorites} onNavigateToProfile={handleNavigateToProfile} />;
      case 'recipeDetail': return selectedVideo ? <RecipeDetail video={selectedVideo} onNavigateToProfile={handleNavigateToProfile} onNavigateBack={() => navigate(-1)} isLoggedIn={isLoggedIn} /> : null;
      case 'help': return <ComingSoon title="Help Center" message="This feature is currently under development. It will be available in a future update." icon={<CircleHelp size={48} />} />;
      case 'jobs':
        return (
          <Jobs
            user={currentUser || ({ id: 'guest' } as any)}
            jobs={jobs}
            onAddJob={() => { }}
            onUpdateStatus={() => { }}
            onDeleteJob={() => { }}
            onApplyJob={async (jobId) => {
              try {
                await applyToJobApi(jobId, '');
                toast.success('Applied to job successfully');
              } catch (err) {
                console.error('Job apply failed', err);
                toast.error('Unable to apply for this job');
              }
            }}
            onNavigate={handleNavigate}
          />
        );
      case 'notifications':
        return <Notifications notifications={notifications} />;
      default:
        return <Home
          videos={allVideos.filter(v => v.status === 'approved' || !v.status)}
          onPlay={v => { setSelectedVideo(v); handleNavigate(`recipe/${v.id}`); }}
          onToggleFavorite={async (v) => {
            if (!isLoggedIn) return;
            try {
              const res = await likeVideoApi(v.id);
              if (res.status === 'liked') setFavorites(f => [...f, v]);
              else setFavorites(f => f.filter(x => x.id !== v.id));
              setAllVideos(prev => prev.map(vid => vid.id === v.id ? { ...vid, likes: res.like_count } : vid));
            } catch (err) {
              console.error("Like failed", err);
            }
          }}
          favorites={favorites}
          onSearch={q => { setSearchQuery(q); handleNavigate('search'); }}
          onNavigate={handleNavigate}
          translate={k => k}
          onNavigateToProfile={handleNavigateToProfile}
          isLoggedIn={isLoggedIn}
        />;
    }
  };

  if (currentPage === 'splash' || isAuthLoading) {
    return (
      <Splash
        onFinish={() => {
          if (!isAuthLoading) {
            handleNavigate(isLoggedIn ? getDashboardByRole(currentUser?.role) : 'home');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F6CEFC]">
      <Toaster position="top-right" />
      {['home', 'profile', 'search', 'recipeDetail', 'upload', 'help', 'jobs', 'notifications'].includes(currentPage) && (
        <Header onNavigate={handleNavigate} currentPage={currentPage} onSearch={q => { setSearchQuery(q); handleNavigate('search'); }} isLoggedIn={isLoggedIn} onLogout={handleLogout} currentUserAvatar={currentUser?.avatar} language={language} onLanguageChange={setLanguage} userRole={currentUser?.role} onNavigateToProfile={() => { if (currentUser && currentUser.role !== 'Admin') { setViewingUser(null); handleNavigateToProfile(currentUser); } }} />
      )}
      <main className="max-w-[1600px] mx-auto p-4">{renderContent()}</main>
    </div>
  );
};

export default App;
