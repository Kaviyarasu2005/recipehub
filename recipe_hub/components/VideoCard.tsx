
import React, { useState, useRef, useEffect } from 'react';
import { Video } from '../types';
import { UserAvatar } from './UserAvatar';
import { Play, MoreVertical, CheckCircle2, Heart, Share2, Trash2 } from 'lucide-react';

interface VideoCardProps {
  video: Video;
  variant?: 'standard' | 'compact' | 'continue';
  onPlay?: (video: Video) => void;
  onToggleFavorite?: (video: Video) => void;
  onDelete?: (video: Video) => void;
  onNavigateToProfile?: (user: string) => void;
  isFavorite?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  variant = 'standard',
  onPlay,
  onToggleFavorite,
  onDelete,
  onNavigateToProfile,
  isFavorite = false
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [actualDuration, setActualDuration] = useState(video.duration || '00:00');

  useEffect(() => {
    if (video.video_url && (!video.duration || video.duration === '00:00')) {
      const vid = document.createElement('video');
      vid.src = video.video_url;
      vid.onloadedmetadata = () => {
        if (!vid.duration || isNaN(vid.duration)) return;
        const mins = Math.floor(vid.duration / 60);
        const secs = Math.floor(vid.duration % 60);
        setActualDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      };
    }
  }, [video.video_url, video.duration]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const videoUrl = window.location.origin + '/video/' + video.id;
    
    if (action === 'WhatsApp') {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('Check out this recipe: ' + videoUrl)}`;
      window.open(whatsappUrl, '_blank');
    } else if (action === 'Copy Link') {
      navigator.clipboard.writeText(videoUrl);
      alert("Link copied to clipboard!");
    }
    setMenuOpen(false);
  };

  return (
    <div className="group cursor-pointer relative" onClick={() => onPlay?.(video)}>
      <div className="relative aspect-video rounded-[32px] overflow-hidden mb-3 shadow-md border border-[#e5b3eb] bg-zinc-100 transition-all duration-300">
        <img
          src={video.thumbnail_url || video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 overflow-hidden"
          onError={(e) => {
            e.currentTarget.src = "/default-thumbnail.png"
          }}
        />

        {/* Hover Controls Container */}
        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">

          {/* Top Right Like Button */}
          <div className="absolute top-3 right-3">
            <div className="relative group/tooltip">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(video); }}
                className={`p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all active:scale-90 ${isFavorite ? 'bg-[#a832d3] text-white' : 'bg-white/90 text-zinc-900 hover:bg-[#a832d3] hover:text-white'}`}
              >
                <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
              </button>
              <span className="absolute top-full mt-2 right-0 px-2 py-1 bg-zinc-900 text-white text-[10px] font-bold rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap">
                {isFavorite ? 'Unlike' : 'Like'}
              </span>
            </div>
          </div>

          {/* Play Center Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full border border-white/30 transform scale-90 group-hover:scale-100 transition-transform">
              <Play size={24} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        </div>

        {/* Trending Badge */}
        {video.isTrending && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-[#a832d3] shadow-sm flex items-center gap-1 border border-white z-20">
            <span>🔥</span> TRENDING
          </div>
        )}

        {/* Continue Watching Progress */}
        {video.watchedProgress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 z-20">
            <div
              className="h-full bg-[#a832d3] transition-all duration-500"
              style={{ width: `${video.watchedProgress}%` }}
            ></div>
          </div>
        )}

        {/* Video Duration */}
        <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded-lg text-[10px] font-bold text-white tracking-wider group-hover:opacity-0 transition-opacity z-20">
          {actualDuration}
        </div>
      </div>

      {/* Text Info Section with Integrated Menu Button */}
      <div className="flex justify-between items-start gap-2 px-1">
        <div className="flex-1 min-w-0">
          <h3 className="text-[#1a0e1b] font-bold text-base mb-1 truncate group-hover:text-[#a832d3] transition-colors">
            {video.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <div
              onClick={(e) => { e.stopPropagation(); onNavigateToProfile?.(video.creator_id || video.creator); }}
              className="flex items-center gap-2 hover:text-[#a832d3] transition-colors cursor-pointer"
            >
              <UserAvatar
                src={video.creator_avatar || video.creatorAvatar}
                name={video.creator}
                fallback={video.creator}
                size={24}
                className="border border-[#e5b3eb]"
              />
              <span className="truncate max-w-[100px]">{video.creator}</span>
              {video.isVerified && <CheckCircle2 size={12} className="text-[#a832d3]" />}
            </div>
            <span>•</span>
            <span className="whitespace-nowrap">{video.views}</span>
          </div>
        </div>

        {/* More Options Button (⋮) - Now located here below the image */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className={`p-1.5 rounded-full transition-all hover:bg-[#F6CEFC]/30 active:scale-90 ${menuOpen ? 'text-[#a832d3] bg-[#F6CEFC]/30' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            <MoreVertical size={20} />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-zinc-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={(e) => handleAction('WhatsApp', e)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-[#a832d3]/5 hover:text-[#a832d3] transition-colors"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                   <div className="w-2 h-2 bg-white rounded-full"></div>
                </div> 
                WhatsApp
              </button>
              <button
                onClick={(e) => handleAction('Copy Link', e)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-[#a832d3]/5 hover:text-[#a832d3] transition-colors"
              >
                <Share2 size={16} /> Copy Link
              </button>
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(video); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors border-t border-zinc-50 mt-1 pt-3"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
