import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Video, Page, UserProfile } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { UserPlus, Check, Utensils, Heart, Edit2, Upload, X, Camera, ChevronRight, Search as SearchIcon, Loader2 } from 'lucide-react';
import { VideoCard } from '../components/VideoCard';
import { followUserApi, unfollowUserApi, resolveMediaUrl } from '../api';

interface ProfileProps {
  user: UserProfile;
  isOwnProfile?: boolean;
  onNavigate: (page: Page) => void;
  onPlay: (video: Video) => void;
  onToggleFavorite: (video: Video) => void;
  favorites: Video[];
  onUpdateProfile?: (updatedUser: UserProfile) => void;
  onFollowUser?: (userId: string) => void;
  onDeleteVideo?: (video: Video) => void;
  videos: Video[];
  onNavigateToProfile?: (target: UserProfile | string) => void;
  currentUser?: UserProfile | null;
}

export const Profile: React.FC<ProfileProps> = ({
  user, isOwnProfile = false, onNavigate, onPlay, onToggleFavorite, favorites, onUpdateProfile, onDeleteVideo, videos, onNavigateToProfile, currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'videos' | 'favorites'>('videos');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState<'followers' | 'following' | null>(null);
  const [statsSearchQuery, setStatsSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name,
    handle: user.handle,
    bio: user.bio,
    avatar: user.avatar
  });

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<UserProfile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const [followersCount, setFollowersCount] = useState(user.stats.followers);

  useEffect(() => {
    setEditForm({ name: user.name, handle: user.handle, bio: user.bio, avatar: user.avatar });
    setFollowersCount(user.stats.followers);
  }, [user]);

  useEffect(() => {
    const searchUsers = async () => {
      if (userSearchQuery.length < 2) {
        setUserSuggestions([]);
        return;
      }
      setIsSearchingUsers(true);
      try {
        const { searchUsersApi } = await import('../api');
        const results = await searchUsersApi(userSearchQuery);
        setUserSuggestions(results.map((u: any) => ({
          id: String(u.id),
          name: u.first_name || u.username,
          handle: `@${u.username}`,
          avatar: u.avatar || '',
          role: 'User',
          bio: u.bio || '',
          stats: {
            videos: Number(u.videos_count || 0),
            followers: Number(u.followers_count || 0),
            following: Number(u.following_count || 0)
          }
        } as UserProfile)));
      } catch (err) {
        console.error("User search failed", err);
      } finally {
        setIsSearchingUsers(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  const [profileVideos, setProfileVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  const userVideos = useMemo(() => profileVideos, [profileVideos]);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { updateProfileApi } = await import('../api');
      const updatedApiUser = await updateProfileApi({
        first_name: editForm.name,
        bio: editForm.bio,
        avatar: avatarFile as any // Send the File object if we have one
      } as any);

      const updatedProfile: UserProfile = {
        ...user,
        name: updatedApiUser.first_name || updatedApiUser.username,
        bio: updatedApiUser.bio,
        avatar: updatedApiUser.avatar || updatedApiUser.profile_picture || ''
      };

      onUpdateProfile?.(updatedProfile);
      setIsEditModalOpen(false);
      alert("Profile Updated Successfully");
    } catch (err) {
      console.error("Update failed", err);
      alert("Update failed: " + err);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditForm(prev => ({ ...prev, avatar: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const [statsListData, setStatsListData] = useState<UserProfile[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  useEffect(() => {
    const loadUserVideos = async () => {
      if (!user.id) return;
      setIsLoadingVideos(true);
      try {
        const { fetchUserVideosApi } = await import('../api');
        const res = await fetchUserVideosApi(user.id);
        const mapped = (res.results || []).map((api: any) => ({
          id: String(api.id),
          title: api.title,
          creator: api.creator_username || 'Chef',
          views: `${api.view_count ?? 0} views`,
          likes: api.like_count ?? 0,
          postedTime: api.created_at ? new Date(api.created_at).toLocaleDateString() : '',
          duration: '00:00',
          thumbnail: resolveMediaUrl(api.thumbnail_url),
          category: api.category || 'Veg',
          description: api.description,
          creatorAvatar: resolveMediaUrl(api.creator_avatar),
          creator_id: String(api.creator_id || api.user),
          ingredients: api.ingredients || [],
          instructions: api.instructions || [],
          status: api.status || 'approved',
          user_id: String(api.user),
          video_url: resolveMediaUrl(api.video_url),
        } as Video));
        setProfileVideos(mapped);
      } catch (err) {
        console.error("Failed to load user videos", err);
      } finally {
        setIsLoadingVideos(false);
      }
    };
    loadUserVideos();
  }, [user.id]);

  useEffect(() => {
    const checkFollow = async () => {
      if (!isOwnProfile && user.id) {
        try {
          const { checkFollowStatusApi } = await import('../api');
          const res = await checkFollowStatusApi(user.id);
          setIsFollowing(res.is_following);
        } catch (err) {
          console.error("Check follow failed", err);
        }
      }
    };
    checkFollow();
  }, [user.id, isOwnProfile]);

  const handleFollowToggle = async () => {
    setIsFollowLoading(true);
    try {
      const { followUserApi, unfollowUserApi } = await import('../api');
      let res;
      if (isFollowing) {
        res = await unfollowUserApi(user.id);
        setIsFollowing(false);
      } else {
        res = await followUserApi(user.id);
        setIsFollowing(true);
      }
      
      setFollowersCount(String(res.followers_count));
      
      // Update global current user state if we have the callback and data
      if (onUpdateProfile && currentUser && res.current_user_following_count !== undefined) {
        onUpdateProfile({
          ...currentUser,
          stats: {
            ...currentUser.stats,
            following: res.current_user_following_count
          }
        });
      }
    } catch (err) {
      console.error("Follow action failed", err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const loadStatsList = async (type: 'followers' | 'following') => {
    setIsStatsLoading(true);
    try {
      const { fetchFollowersApi, fetchFollowingApi } = await import('../api');
      const apiUsers = type === 'followers'
        ? await fetchFollowersApi(user.id)
        : await fetchFollowingApi(user.id);

      // Map ApiUser to UserProfile – ideally this logic should be in a shared helper
      // but App.tsx has mapApiUserToProfile. Let's assume we can reuse it or inline a basic version.
      // For now, let's map it manually to match what Profile expects.
      setStatsListData(apiUsers.map(u => ({
        id: String(u.id),
        name: u.first_name || u.username || 'Chef',
        handle: `@${u.username}`,
        avatar: resolveMediaUrl(u.avatar || ''),
        role: u.role as any,
        bio: u.bio || '',
        stats: { videos: 0, followers: 0, following: 0 }
      })));
    } catch (err) {
      console.error(`Failed to load ${type}`, err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const getStatsList = () => {
    return statsListData;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 px-4 md:px-6 py-6 md:py-10">
      <aside className="w-full lg:w-80 flex-shrink-0">
        <div className="bg-white/40 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-white shadow-sm backdrop-blur-md flex flex-col items-center">
            <UserAvatar 
              src={user.avatar} 
              name={user.name}
              fallback={user.name}
              size={128}
              className="border-[4px] md:border-[6px] border-white shadow-lg"
            />
          <h1 className="text-2xl md:text-4xl font-black mb-1 text-center">{user.name}</h1>
          <p className="text-[#a832d3] font-extrabold mb-6 md:mb-10 text-base md:text-lg">{user.handle}</p>
          <p className="text-zinc-600 text-xs md:text-sm font-medium leading-relaxed mb-6 md:mb-10 text-center opacity-80 max-w-xs">{user.bio}</p>

          <div className="w-full grid grid-cols-1 gap-2 md:gap-3 mb-6 md:mb-10">
            {isOwnProfile ? (
              <>
                <button onClick={() => setIsEditModalOpen(true)} className="w-full bg-[#a832d3] text-white font-black py-3 md:py-4 rounded-2xl md:rounded-3xl flex items-center justify-center gap-2 md:gap-3 shadow-md hover:brightness-110 active:scale-95 transition-all text-sm">
                  <Edit2 size={16} /> Edit Profile
                </button>
                <button onClick={() => onNavigate('upload')} className="w-full bg-[#1a0e1b] text-white font-black py-3 md:py-4 rounded-2xl md:rounded-3xl flex items-center justify-center gap-2 md:gap-3 shadow-sm hover:brightness-125 transition-all active:scale-95 text-sm">
                  <Upload size={16} /> Upload Recipe
                </button>
              </>
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                className={`w-full font-black py-3 md:py-5 rounded-2xl md:rounded-[24px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-3 text-sm ${isFollowing ? 'bg-white border-2 border-[#1a0e1b]' : 'bg-[#1a0e1b] text-white'}`}
              >
                {isFollowLoading ? <Loader2 className="animate-spin" size={18} /> : isFollowing ? <><Check size={18} /> Following</> : <><UserPlus size={18} /> Follow</>}
              </button>
            )}
          </div>

          {/* User Search System (Instagram Style) */}
          <div className="w-full mb-6 md:mb-10 relative">
            <p className="text-[10px] font-black text-zinc-400 mb-2 uppercase tracking-widest px-2">Find Cooks</p>
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder="Search usernames..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-white/50 border border-white rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#a832d3]/20"
              />
            </div>
            {userSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
                {userSuggestions.filter(u => u.id).map(u => (
                  <div
                    key={u.id}
                    onClick={() => { onNavigateToProfile?.(u); setUserSearchQuery(''); setUserSuggestions([]); }}
                    className="flex items-center gap-3 p-3 hover:bg-[#a832d3]/5 cursor-pointer transition-colors border-b border-zinc-50 last:border-0"
                  >
                    <UserAvatar 
                      src={u.avatar} 
                      name={u.name}
                      fallback={u.name}
                      size={32}
                      className="flex-shrink-0 border border-zinc-100"
                    />
                    <div>
                      <p className="font-bold text-xs">{u.name}</p>
                      <p className="text-[10px] text-[#a832d3] font-black">{u.handle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex w-full gap-2 md:gap-3">
            <button onClick={() => { loadStatsList('followers'); setShowStatsModal('followers'); }} className="flex-1 bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 text-center border border-white shadow-sm active:scale-95 transition-all">
              <div className="text-xl md:text-2xl font-black">{followersCount}</div>
              <div className="text-[8px] md:text-[10px] text-zinc-400 font-black tracking-widest uppercase">Followers</div>
            </button>
            <button onClick={() => { loadStatsList('following'); setShowStatsModal('following'); }} className="flex-1 bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 text-center border border-white shadow-sm active:scale-95 transition-all">
              <div className="text-xl md:text-2xl font-black">{user.stats.following}</div>
              <div className="text-[8px] md:text-[10px] text-zinc-400 font-black tracking-widest uppercase">Following</div>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <div className="flex items-center gap-6 md:gap-10 border-b border-[#e5b3eb] mb-8 md:mb-10">
          <button onClick={() => setActiveTab('videos')} className={`pb-3 md:pb-4 text-sm md:text-base font-black flex items-center gap-2 relative transition-all ${activeTab === 'videos' ? 'text-[#a832d3]' : 'text-zinc-400'}`}>
            <Utensils size={16} /> {isOwnProfile ? 'My Recipes' : 'Recipes'}
            {activeTab === 'videos' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#a832d3] rounded-full"></div>}
          </button>
          {isOwnProfile && (
            <button onClick={() => setActiveTab('favorites')} className={`pb-3 md:pb-4 text-sm md:text-base font-black flex items-center gap-2 relative transition-all ${activeTab === 'favorites' ? 'text-[#a832d3]' : 'text-zinc-400'}`}>
              <Heart size={16} fill={activeTab === 'favorites' ? "currentColor" : "none"} /> Favorites
              {activeTab === 'favorites' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#a832d3] rounded-full"></div>}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {(activeTab === 'videos' ? userVideos : favorites)
            .filter(v => v.id)
            .map(v => (
              <VideoCard key={v.id} video={v} onPlay={onPlay} onToggleFavorite={onToggleFavorite} isFavorite={!!favorites.find(f => f.id === v.id)} onDelete={isOwnProfile ? onDeleteVideo : undefined} />
            ))}
          {(activeTab === 'videos' ? userVideos : favorites).length === 0 && (
            <div className="col-span-full py-16 md:py-20 text-center bg-white/20 rounded-[32px] md:rounded-[40px] border border-dashed border-white">
              {isLoadingVideos ? (
                 <Loader2 className="animate-spin mx-auto text-[#a832d3]" size={32} />
              ) : (
                <p className="text-zinc-400 font-bold text-sm">No items found.</p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] md:rounded-[48px] p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <button onClick={() => setShowStatsModal(null)} className="absolute top-4 right-4 md:top-6 md:right-6 text-zinc-400 p-2 hover:text-black transition-colors"><X size={20} /></button>
            <h2 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 capitalize">{showStatsModal}</h2>

            <div className="relative mb-4 md:mb-6">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={statsSearchQuery}
                onChange={(e) => setStatsSearchQuery(e.target.value)}
                className="w-full bg-zinc-50 rounded-xl md:rounded-2xl py-2.5 md:py-3 pl-11 pr-4 font-bold border-none focus:ring-2 focus:ring-[#a832d3]/20 text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-3">
              {isStatsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="animate-spin text-[#a832d3]" size={32} />
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Loading directory...</p>
                </div>
              ) : (() => {
                const list = getStatsList();
                return list.length === 0 ? (
                  <p className="text-zinc-500 font-medium text-sm py-6 text-center">No {showStatsModal} yet.</p>
                ) : list.filter(u => u && u.id && u.id !== 'undefined').map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 md:p-4 bg-zinc-50 rounded-xl md:rounded-2xl hover:bg-[#a832d3]/5 transition-colors group cursor-pointer" onClick={() => { setShowStatsModal(null); onNavigateToProfile?.(u); }}>
                    <div className="flex items-center gap-3 md:gap-4">
                      <UserAvatar 
                        src={(u as any).avatar} 
                        name={(u as any).name}
                        fallback={(u as any).name}
                        size={48}
                        className="rounded-full border-2 border-white"
                      />
                      <div>
                        <p className="font-black text-xs md:text-sm">{(u as any).name}</p>
                        <p className="text-[10px] md:text-xs text-[#a832d3] font-bold">{(u as any).handle}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-300 group-hover:text-[#a832d3]" />
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-2xl relative animate-in zoom-in-95 max-h-[95vh] overflow-y-auto no-scrollbar">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 md:top-8 md:right-8 text-zinc-400 p-2 hover:text-black transition-colors"><X size={20} /></button>
            <h2 className="text-2xl md:text-3xl font-black mb-6 md:mb-8">Edit Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <img src={editForm.avatar} className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 md:border-4 border-[#e5b3eb] bg-zinc-50 object-cover shadow-sm" alt="" />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={20} className="text-white" />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                <p className="text-[8px] md:text-[10px] text-zinc-400 mt-2 font-black tracking-widest uppercase">Change Photo</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Full Name</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-zinc-50 rounded-xl md:rounded-2xl py-3 md:py-4 px-4 md:px-6 font-bold text-sm" placeholder="Your Name" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Profile Bio</label>
                  <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} className="w-full bg-zinc-50 rounded-xl md:rounded-2xl py-3 md:py-4 px-4 md:px-6 h-20 md:h-24 resize-none font-medium text-sm" placeholder="Short bio..." />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#1a0e1b] text-white font-black py-4 md:py-5 rounded-2xl md:rounded-3xl shadow-xl text-sm md:text-base">Save Profile</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
