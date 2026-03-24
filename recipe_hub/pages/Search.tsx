
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, Loader2, Search as SearchIcon, ChefHat, Info } from 'lucide-react';
import { VideoCard } from '../components/VideoCard';
import { Video, UserProfile } from '../types';

// Updated SearchProps to include videos list for dynamic searching
interface SearchProps {
  videos: Video[];
  query: string;
  onPlay: (video: Video) => void;
  onToggleFavorite: (video: Video) => void;
  favorites: Video[];
  onNavigateToProfile?: (user: UserProfile | string) => void;
}

export const Search: React.FC<SearchProps> = ({ videos, query, onPlay, onToggleFavorite, favorites, onNavigateToProfile }) => {
  const [visibleCount, setVisibleCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter logic based on query using the passed videos prop instead of static mock data
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase().trim();
    const queryParts = lowerQuery.split(/\s+/);

    return videos.filter(video => {
      // Check Title
      const titleMatch = video.title.toLowerCase().includes(lowerQuery);
      if (titleMatch) return true;

      // Check Creator
      const creatorMatch = video.creator.toLowerCase().includes(lowerQuery);
      if (creatorMatch) return true;

      // Check Ingredients (support both full string and parts for broad matching)
      if (video.ingredients) {
        const ingredientsString = video.ingredients.join(' ').toLowerCase();

        // Match if full query is in ingredients OR if all parts of query match some ingredient
        const fullIngredientMatch = ingredientsString.includes(lowerQuery);
        const allPartsMatch = queryParts.every(part => ingredientsString.includes(part));

        return fullIngredientMatch || allPartsMatch;
      }

      return false;
    });
  }, [query, videos]);

  // Reset visibility on query change
  useEffect(() => {
    setVisibleCount(8);
  }, [query]);

  const visibleResults = searchResults.slice(0, visibleCount);
  const hasMore = visibleCount < searchResults.length;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 4);
      setIsLoadingMore(false);
    }, 600);
  };

  return (
    <div className="px-6 py-8 animate-in fade-in duration-500">
      <div className="mb-12">
        <div className="flex items-center gap-3 text-zinc-400 mb-2 font-black uppercase tracking-widest text-[10px]">
          <SearchIcon size={14} />
          <span>Search results for</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[#1a0e1b] text-4xl font-black">"{query}"</h1>
            <p className="text-[#a832d3] font-bold mt-1">Found {searchResults.length} recipes matching your search</p>
          </div>

          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-white px-4 py-2 rounded-full text-[10px] font-black text-zinc-500">
            <Info size={14} />
            TIP: Try searching for ingredients like "avocado egg"
          </div>
        </div>
      </div>

      {searchResults.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {visibleResults
              .filter(video => video.id)
              .map((video, idx) => (
                <div
                  key={video.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                  style={{ animationDelay: `${(idx % 8) * 50}ms` }}
                >
                  <VideoCard
                    video={video}
                    onPlay={onPlay}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={!!favorites.find(f => f.id === video.id)}
                    onNavigateToProfile={onNavigateToProfile as any}
                  />
                </div>
              ))}
          </div>

          {hasMore && (
            <div className="mt-16 flex justify-center pb-12">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-3 bg-white text-[#1a0e1b] px-10 py-4 rounded-3xl hover:bg-[#a832d3] hover:text-white transition-all border border-[#e5b3eb] font-black shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Expanding results...
                  </>
                ) : (
                  <>
                    View More Recipes
                    <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}

          {!hasMore && searchResults.length > 0 && (
            <div className="mt-16 text-center text-zinc-400 font-bold pb-12">
              <div className="w-12 h-1 bg-[#a832d3]/20 mx-auto mb-4 rounded-full"></div>
              You've seen all matches for "{query}"
            </div>
          )}
        </>
      ) : (
        <div className="py-24 flex flex-col items-center justify-center bg-white/30 rounded-[64px] border-2 border-dashed border-white">
          <div className="bg-white p-8 rounded-[40px] shadow-sm mb-6 text-[#a832d3]/20">
            <ChefHat size={80} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-black text-[#1a0e1b] mb-2">No recipes found</h2>
          <p className="text-zinc-500 font-medium max-w-sm text-center px-6">
            We couldn't find anything matching "{query}". Try searching for specific ingredients or broader categories.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mt-8 text-[#a832d3] font-black hover:underline underline-offset-4"
          >
            Try a different search
          </button>
        </div>
      )}
    </div>
  );
};
