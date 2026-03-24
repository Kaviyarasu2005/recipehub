import React, { useState, useEffect, useRef } from 'react';
import { Video, UserProfile } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { Play, Check, Star, Send, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Share2, ArrowLeft, Loader2 } from 'lucide-react';
import { likeVideoApi, commentVideoApi, fetchCommentsApi, ApiComment, fetchVideoDetail } from '../api';

interface RecipeDetailProps {
  video: Video;
  onNavigateToProfile?: (target: UserProfile | string) => void;
  onNavigateBack?: () => void;
  isLoggedIn?: boolean;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({ video, onNavigateToProfile, onNavigateBack, isLoggedIn }) => {
  const [fullVideo, setFullVideo] = useState<Video>(video);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes || 0);
  const [engagement, setEngagement] = useState<'liked' | 'none'>('none');
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fullData = await fetchVideoDetail(video.id);
        // Map backend ApiVideo to frontend Video type
        const updatedVideo: Video = {
          ...video,
          ingredients: fullData.ingredients || [],
          instructions: fullData.instructions || [],
          description: fullData.description,
          video_url: fullData.video_url
        };
        setFullVideo(updatedVideo);
      } catch (err) {
        console.error("Failed to load full video details", err);
      }
    };
    loadData();

    const loadComments = async () => {
      setIsLoadingComments(true);
      try {
        const data = await fetchCommentsApi(video.id);
        setComments(data);
      } catch (err) {
        console.error("Failed to load comments", err);
      } finally {
        setIsLoadingComments(false);
      }
    };
    loadComments();
  }, [video.id]);

  // View count logic: Record view after 5 seconds of playing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setTimeout(async () => {
        try {
          const { recordViewApi } = await import('../api');
          const res = await recordViewApi(video.id);
          // Update the UI view count if possible
          setFullVideo(prev => ({ ...prev, views: `${res.view_count} views` }));
        } catch (err) {
          console.error("Failed to record view", err);
        }
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, video.id]);

  const ingredients = fullVideo.ingredients ?? [];
  const instructions = fullVideo.instructions ?? [];

  // Persist playback progress for "Continue Watching"
  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const current = event.currentTarget.currentTime;
    try {
      localStorage.setItem(
        'continueWatching',
        JSON.stringify({
          videoId: video.id,
          timestamp: current,
        }),
      );
    } catch {
      // ignore storage errors
    }
  };

  // When revisiting the same video, resume from last saved timestamp
  useEffect(() => {
    try {
      const raw = localStorage.getItem('continueWatching');
      if (!raw) return;
      const parsed = JSON.parse(raw) as { videoId?: string | number; timestamp?: number };
      if (!parsed?.videoId || parsed.videoId.toString() !== video.id.toString()) return;
      if (!parsed.timestamp || !videoRef.current) return;
      videoRef.current.currentTime = parsed.timestamp;
    } catch {
      // ignore parse errors
    }
  }, [video.id]);

  const handleLike = async () => {
    if (!isLoggedIn) {
      alert("Please log in to like videos");
      return;
    }
    try {
      const res = await likeVideoApi(video.id);
      setEngagement(res.status === 'liked' ? 'liked' : 'none');
      setLikesCount(res.like_count);
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) newChecked.delete(index);
    else newChecked.add(index);
    setCheckedIngredients(newChecked);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Please log in to comment");
      return;
    }
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await commentVideoApi(video.id, commentText);
      setComments([newComment, ...comments]);
      setCommentText('');
      setUserRating(0);
    } catch (err) {
      alert("Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const visibleComments = showAllComments ? comments : comments.slice(0, 2);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in duration-500">
      <button
        onClick={onNavigateBack ?? (() => window.history.back())}
        className="flex items-center gap-2 text-[#1a0e1b] font-bold mb-6 hover:text-[#a832d3] transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft size={20} /> Back
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="relative aspect-video rounded-[40px] overflow-hidden mb-8 shadow-2xl bg-zinc-900 group border border-white/20">
            {fullVideo.video_url ? (
              <video
                ref={videoRef}
                controls
                className="w-full h-full object-cover"
                poster={fullVideo.thumbnail_url || fullVideo.thumbnail}
                autoPlay={false}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              >
                <source src={fullVideo.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img 
                src={video.thumbnail_url || video.thumbnail} 
                alt={video.title} 
                className="w-full h-full object-cover opacity-80 overflow-hidden" 
                onError={(e) => {
                  e.currentTarget.src = "/default-thumbnail.png"
                }}
              />
            )}
            {!fullVideo.video_url && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-[#a832d3] rounded-full flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform cursor-pointer">
                  <Play size={32} fill="currentColor" />
                </div>
              </div>
            )}
          </div>

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-[#1a0e1b] mb-4 leading-tight">{video.title}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/30 pb-6">
              <div className="text-sm font-bold text-zinc-500 flex items-center gap-1.5">
                <span>{video.views}</span>
                <span className="text-zinc-300">•</span>
                <span>{video.postedTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/60 backdrop-blur-sm rounded-full border border-white p-1 shadow-sm overflow-hidden">
                  <button onClick={handleLike} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:bg-zinc-100 ${engagement === 'liked' ? 'text-[#a832d3] bg-[#a832d3]/10' : 'text-zinc-600'}`}>
                    <ThumbsUp size={18} fill={engagement === 'liked' ? "currentColor" : "none"} />
                    <span className="font-black text-sm">{likesCount.toLocaleString()}</span>
                  </button>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setIsShareOpen(!isShareOpen)} 
                    className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-white px-5 py-2.5 rounded-full font-black text-sm text-zinc-600 hover:bg-white transition-all active:scale-95 shadow-sm"
                  >
                    <Share2 size={18} /> <span>Share</span>
                  </button>
                  
                  {isShareOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-zinc-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={() => {
                          const videoUrl = window.location.origin + '/video/' + video.id;
                          const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('Check out this recipe: ' + videoUrl)}`;
                          window.open(whatsappUrl, '_blank');
                          setIsShareOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-[#a832d3]/5 hover:text-[#a832d3] transition-colors"
                      >
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                           <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div> 
                        WhatsApp
                      </button>
                      <button
                        onClick={() => {
                          const videoUrl = window.location.origin + '/video/' + video.id;
                          navigator.clipboard.writeText(videoUrl);
                          alert("Link copied to clipboard!");
                          setIsShareOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-[#a832d3]/5 hover:text-[#a832d3] transition-colors"
                      >
                        <Share2 size={16} /> Copy Link
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/40 border border-white rounded-[40px] p-8 mb-10 shadow-sm">
            <p className="text-zinc-700 text-lg leading-relaxed font-medium mb-6">
              {video.description || "No description provided for this recipe."}
            </p>
            <div
              onClick={() => onNavigateToProfile?.(video.creator_id || video.creator)}
              className="flex items-center gap-4 bg-white/40 p-3 rounded-3xl w-fit cursor-pointer hover:bg-white transition-all group"
            >
              <UserAvatar 
                src={video.creator_avatar || video.creatorAvatar} 
                name={video.creator}
                fallback={video.creator}
                size={40}
                className="border border-white shadow-sm overflow-hidden group-hover:scale-110 transition-transform"
              />
              <div>
                <p className="font-black text-[#1a0e1b] text-sm leading-none mb-1 group-hover:text-[#a832d3] transition-colors">{video.creator}</p>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Recipe Creator</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-white rounded-[40px] p-8 md:p-10 mb-12 shadow-xl shadow-pink-100/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-10">
              <div className="text-center sm:text-left">
                <h4 className="font-black text-[#1a0e1b] text-2xl mb-2">Join the conversation</h4>
                <p className="text-zinc-500 font-medium">What do you think of this recipe?</p>
              </div>
            </div>
            <form onSubmit={handleCommentSubmit} className="relative group">
              <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Share your experience..." className="w-full bg-zinc-50 border border-zinc-100 rounded-[32px] p-6 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#a832d3]/20 transition-all resize-none min-h-[120px] font-medium" />
              <button type="submit" disabled={!commentText.trim() || isSubmittingComment} className="absolute bottom-6 right-6 bg-[#1a0e1b] text-white p-4 rounded-[20px] hover:brightness-125 transition-all shadow-lg active:scale-95 disabled:opacity-30 flex items-center gap-2">
                {isSubmittingComment ? <Loader2 className="animate-spin" size={18} /> : <><span className="font-black text-sm">Post</span> <Send size={18} /></>}
              </button>
            </form>
          </div>

          <section className="mb-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-[#1a0e1b] flex items-center gap-3">Comments <span className="bg-[#a832d3]/10 text-[#a832d3] text-sm px-4 py-1 rounded-full">{comments.length}</span></h2>
              {comments.length > 2 && (
                <button onClick={() => setShowAllComments(!showAllComments)} className="flex items-center gap-1 text-[#a832d3] font-black text-sm hover:brightness-75 transition-all">
                  {showAllComments ? 'Show Less' : 'View All'} {showAllComments ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              )}
            </div>
            <div className="space-y-6">
              {isLoadingComments ? (
                <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-[#a832d3]" /></div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 font-bold">No comments yet. Be the first!</div>
              ) : (
                visibleComments.map((comment) => (
                  <div key={comment.id} className="bg-white/60 border border-white rounded-[32px] p-6 md:p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        onClick={() => onNavigateToProfile?.(comment.username)}
                        className="flex items-center gap-4 cursor-pointer group"
                      >
                        <UserAvatar 
                          src={comment.avatar} 
                          name={comment.username}
                          fallback={comment.username}
                          size={48}
                          className="border-2 border-white shadow-sm overflow-hidden group-hover:scale-110 transition-transform"
                        />
                        <div>
                          <p className="font-black text-[#1a0e1b] text-lg leading-none mb-1 group-hover:text-[#a832d3] transition-colors">{comment.username}</p>
                          <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{new Date(comment.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-zinc-700 text-base font-medium leading-relaxed">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <div className="space-y-8 pb-10">
            <div className="bg-white/80 backdrop-blur-md rounded-[48px] p-8 border border-white shadow-xl shadow-pink-100/20">
              <h2 className="text-2xl font-black text-[#1a0e1b] mb-8 flex items-center justify-between">Ingredients <span className="text-xs bg-[#F6CEFC] px-3 py-1 rounded-full text-[#a832d3] font-black">{ingredients.length}</span></h2>
              <ul className="space-y-4">
                {ingredients.length === 0 ? (
                  <li className="text-zinc-500 font-medium py-4">No ingredients listed for this recipe.</li>
                ) : ingredients.map((ingredient, idx) => {
                  const isChecked = checkedIngredients.has(idx);
                  return (
                    <li key={idx} className="flex items-center gap-4 cursor-pointer group" onClick={() => toggleIngredient(idx)}>
                      <div className={`flex-shrink-0 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-[#1a0e1b] border-[#1a0e1b]' : 'border-zinc-200 group-hover:border-[#a832d3]'}`}>
                        {isChecked ? <Check size={14} className="text-white" strokeWidth={4} /> : null}
                      </div>
                      <span className={`text-lg font-bold leading-tight transition-all ${isChecked ? 'text-zinc-300 line-through' : 'text-zinc-700'}`}>{ingredient}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="bg-white rounded-[48px] p-8 border border-white shadow-xl shadow-pink-100/20">
              <h2 className="text-2xl font-black text-[#1a0e1b] mb-8">Cooking Steps</h2>
              <div className="space-y-8">
                {instructions.length === 0 ? (
                  <p className="text-zinc-500 font-medium py-4">No steps listed for this recipe.</p>
                ) : instructions.map((step, idx) => (
                  <div key={idx} className="flex gap-5 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#F6CEFC] text-[#a832d3] flex items-center justify-center font-black text-lg shadow-sm border border-white group-hover:bg-[#a832d3] group-hover:text-white transition-all">{idx + 1}</div>
                    <div>
                      <h3 className="text-sm font-black text-[#1a0e1b] mb-1 uppercase tracking-tighter">{step.title || `Step ${idx + 1}`}</h3>
                      <p className="text-zinc-600 text-sm leading-relaxed font-medium">{typeof step === 'string' ? step : step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
