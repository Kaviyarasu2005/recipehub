import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Play, Plus, SlidersHorizontal, Zap, Award, Crown } from 'lucide-react';
import { VideoCard } from '../components/VideoCard';
import { Video, UserProfile } from '../types';

interface HomeProps {
  videos: Video[];
  onPlay: (video: Video) => void;
  onToggleFavorite: (video: Video) => void;
  favorites: Video[];
  onSearch: (query: string) => void;
  onNavigateToProfile?: (user: UserProfile | string) => void;
  onNavigate: (page: any) => void;
  translate: (key: string) => string;
  isLoggedIn?: boolean;
}

export const Home: React.FC<HomeProps> = ({
  videos,
  onPlay,
  onToggleFavorite,
  favorites,
  onSearch,
  onNavigateToProfile,
  onNavigate,
  isLoggedIn = false
}) => {
  const FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Veg', value: 'veg' },
    { label: 'Non-Veg', value: 'non-veg' },
    { label: 'Drinks', value: 'drinks' },
    { label: 'Dessert', value: 'dessert' },
  ];

  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ time: 'all', difficulty: 'all', rating: 'all' });
  const [isLoading, setIsLoading] = useState(false);
  const [infiniteLimit, setInfiniteLimit] = useState(4);
  const filterRef = useRef<HTMLDivElement>(null);

  const [continueVideo, setContinueVideo] = useState<Video | null>(null);

  // Derived Top Chefs from loaded videos to avoid extra network requests
  const topChefs = useMemo(() => {
    const chefMap: Record<string, { id: string; name: string; views: number; avatar?: string }> = {};

    videos.forEach(v => {
      const chefName = v.creator || 'Chef';
      const views = parseInt(String(v.views).replace(/[^0-9]/g, '')) || 0;

      if (!chefMap[chefName]) {
        chefMap[chefName] = { 
          id: v.user_id || chefName, 
          name: chefName, 
          views, 
          avatar: v.creatorAvatar 
        };
      } else {
        chefMap[chefName].views += views;
        if ((v.creator_avatar || v.creatorAvatar) && !chefMap[chefName].avatar) {
          chefMap[chefName].avatar = v.creator_avatar || v.creatorAvatar;
        }
      }
    });

    return Object.values(chefMap)
      .sort((a, b) => b.views - a.views)
      .slice(0, 3);
  }, [videos]);

  const trendingRecipes = useMemo(() => videos.slice(0, 5), [videos]);
  const hasVideos = videos.length > 0;

  useEffect(() => {
    if (!hasVideos) return;
    const timer = setInterval(() => setFeaturedIndex((prev) => (prev + 1) % (trendingRecipes.length || 1)), 7000);
    return () => clearInterval(timer);
  }, [trendingRecipes.length, hasVideos]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (filterValue: string) => {
    setIsLoading(true);
    setSelectedFilter(filterValue);
    setTimeout(() => setIsLoading(false), 800);
  };

  const filteredVideos = useMemo(() => {
    if (selectedFilter === 'all') return videos;

    const normalized = selectedFilter.toLowerCase();
    return videos.filter((v) => v.category?.toLowerCase() === normalized);
  }, [selectedFilter, videos]);

  // Continue Watching section: read last watched video from localStorage and map to a Video
  useEffect(() => {
    try {
      const raw = localStorage.getItem('continueWatching');
      if (!raw) {
        setContinueVideo(null);
        return;
      }
      const parsed = JSON.parse(raw) as { videoId?: string | number };
      if (!parsed?.videoId) {
        setContinueVideo(null);
        return;
      }
      const match = videos.find((v) => String(v.id) === String(parsed.videoId));
      setContinueVideo(match || null);
    } catch {
      setContinueVideo(null);
    }
  }, [videos]);

  const currentFeatured = hasVideos ? (trendingRecipes[featuredIndex] || videos[0]) : null;

  return (
    <div className="pb-20 px-4 md:px-6">
      {currentFeatured ? (
        <section className="relative min-h-[320px] md:h-[480px] rounded-[32px] md:rounded-[48px] overflow-hidden mb-8 md:mb-12 group shadow-2xl border-2 md:border-4 border-white/50">
          <div className="absolute inset-0 w-full h-full">
            <img 
              key={currentFeatured.thumbnail_url || currentFeatured.thumbnail} 
              src={currentFeatured.thumbnail_url || currentFeatured.thumbnail} 
              className="absolute inset-0 w-full h-full object-cover brightness-75 transition-opacity" 
              alt=""
              onError={(e) => {
                e.currentTarget.src = "/default-thumbnail.png"
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0e1b] via-[#1a0e1b]/30 to-transparent"></div>
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 max-w-4xl">
            <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tighter drop-shadow-lg">{currentFeatured.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => onPlay(currentFeatured)} className="flex items-center gap-2 bg-[#a832d3] text-white px-8 py-4 rounded-3xl font-black hover:scale-105 transition-all"><Play size={18} fill="currentColor" /> Watch Now</button>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative min-h-[320px] flex items-center justify-center bg-white/30 border-2 border-dashed border-white/50 rounded-[48px] mb-12">
          <div className="text-center px-6">
            <Zap className="text-[#a832d3]/40 mx-auto mb-4" size={48} />
            <h2 className="text-[#1a0e1b] text-xl font-black">No recipes appearing?</h2>
            <p className="text-zinc-500 text-sm mt-2">Check the backend API at /api/videos/feed/ or upload your first recipe.</p>
          </div>
        </section>
      )}

      {continueVideo && (
        <section className="mb-10 md:mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#1a0e1b] text-2xl font-black">Continue Watching</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <VideoCard
              key={continueVideo.id}
              video={continueVideo}
              onPlay={onPlay}
              onToggleFavorite={onToggleFavorite}
              isFavorite={!!favorites.find((f) => f.id === continueVideo.id)}
              onNavigateToProfile={onNavigateToProfile as any}
            />
          </div>
        </section>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 w-full">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleFilterChange(filter.value)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-black transition-all ${selectedFilter === filter.value ? 'bg-[#a832d3] text-white' : 'bg-white border border-[#e5b3eb]'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <section className="mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {filteredVideos
            .slice(0, infiniteLimit)
            .filter(v => v.id)
            .map(v => (<VideoCard key={v.id} video={v} onPlay={onPlay} onToggleFavorite={onToggleFavorite} isFavorite={!!favorites.find(f => f.id === v.id)} onNavigateToProfile={onNavigateToProfile as any} />))}
        </div>
        {filteredVideos.length > infiniteLimit && (
          <div className="flex justify-center mt-12"><button onClick={() => setInfiniteLimit(prev => prev + 4)} className="bg-[#a832d3] text-white px-10 py-4 rounded-3xl font-black shadow-lg">Show More</button></div>
        )}
      </section>

      {topChefs.length > 0 && (
        <section className="mb-16">
          <h2 className="text-[#1a0e1b] text-2xl font-black flex items-center gap-2 mb-8"><Award className="text-[#FFD700]" size={20} /> Master Chefs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topChefs.map((chef, idx) => (
              <div key={chef.id} onClick={() => onNavigateToProfile?.(chef.id)} className="bg-white/40 border border-white p-6 rounded-[32px] flex items-center gap-4 hover:scale-105 transition-all cursor-pointer shadow-sm group">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-[#a832d3] overflow-hidden flex items-center justify-center font-black text-white text-2xl shadow-lg group-hover:rotate-3 transition-transform">
                    {chef.avatar ? (
                      <img 
                        src={chef.avatar} 
                        className="w-full h-full object-cover" 
                        alt="" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = chef.name[0].toUpperCase();
                        }}
                      />
                    ) : (
                      chef.name[0].toUpperCase()
                    )}
                  </div>
                  {idx === 0 && <Crown className="absolute -top-3 -right-3 text-[#FFD700] drop-shadow-md" size={24} fill="#FFD700" />}
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#1a0e1b] group-hover:text-[#a832d3] transition-colors">{chef.name}</h3>
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">{chef.views.toLocaleString()} Total Views</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 md:mt-16 bg-white/40 border border-white rounded-[40px] p-8 md:p-10 shadow-sm">
        <h2 className="text-2xl font-black text-[#1a0e1b] mb-3">About RecipeHub</h2>
        <p className="text-zinc-600 leading-relaxed font-medium">
          RecipeHub is a community platform where cooks share and discover recipes through beautiful,
          easy-to-follow cooking videos. Whether you are trying a dish for the first time or refining a
          family favorite, RecipeHub gives you a calm, focused space to learn from creators, bookmark
          your favorites, and return to in-progress recipes whenever you are ready to cook again.
        </p>
      </section>
    </div>
  );
};
