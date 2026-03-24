
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Crown, UtensilsCrossed, Menu, LogOut, Briefcase, Clock, Trash2, CircleHelp, User, Info, LayoutDashboard, ShieldAlert } from 'lucide-react';
import { Page, UserProfile, Language, UserRole } from '../types';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  onNavigateToProfile?: (user?: UserProfile) => void;
  currentPage: Page;
  onSearch: (query: string) => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
  currentUserAvatar?: string;
  isPremium?: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  userRole?: UserRole;
}

export const Header: React.FC<HeaderProps> = ({ 
  onNavigate, onNavigateToProfile, currentPage, onSearch, isLoggedIn, onLogout, currentUserAvatar, isPremium, language, onLanguageChange, userRole
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('recipehub_search_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const handleClickOutside = (e: MouseEvent) => { 
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); 
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowHistory(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...history.filter(h => h !== query)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('recipehub_search_history', JSON.stringify(newHistory));
    onSearch(query);
    setShowHistory(false);
  };

  const removeFromHistory = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h !== item);
    setHistory(newHistory);
    localStorage.setItem('recipehub_search_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('recipehub_search_history');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#F6CEFC]/90 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between gap-4 md:gap-6 border-b border-white/20">
      <div className="flex items-center gap-6">
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-white/40 rounded-full transition-all text-[#1a0e1b]"><Menu size={24} /></button>
          {showMenu && (
            <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-[32px] shadow-2xl border border-zinc-100 overflow-hidden z-[60] animate-in zoom-in-95">
              <div className="p-4 border-b border-zinc-50">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-4 mb-2">Menu</p>
                <button onClick={() => { onNavigate('home'); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-[#a832d3]/5 hover:text-[#a832d3] rounded-2xl transition-colors"><UtensilsCrossed size={18} /> Home</button>
                <button onClick={() => { onNavigate('help'); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-[#a832d3]/5 hover:text-[#a832d3] rounded-2xl transition-colors"><CircleHelp size={18} /> Help</button>
                <button onClick={() => { onNavigate('about'); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-[#a832d3]/5 hover:text-[#a832d3] rounded-2xl transition-colors"><Info size={18} /> About</button>
                
                {isLoggedIn && (
                  <>
                    <button onClick={() => { onNavigate('profile'); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-[#a832d3]/5 hover:text-[#a832d3] rounded-2xl transition-colors"><User size={18} /> Account info</button>
                    {userRole === 'Company' && (
                      <button onClick={() => { onNavigate('companyDashboard'); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-[#a832d3]/5 hover:text-[#a832d3] rounded-2xl transition-colors"><LayoutDashboard size={18} /> Job Dashboard</button>
                    )}
                    {userRole === 'Admin' && (
                      <button onClick={() => { onNavigate('adminDashboard'); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-[#a832d3]/5 hover:text-[#a832d3] rounded-2xl transition-colors"><ShieldAlert size={18} /> Admin Dashboard</button>
                    )}
                    <button onClick={() => { onLogout?.(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-colors mt-2"><LogOut size={18} /> Logout</button>
                  </>
                )}
                {!isLoggedIn && (
                  <button onClick={() => { onNavigate('login'); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#a832d3] hover:bg-[#a832d3]/5 rounded-2xl transition-colors mt-2"><LogOut size={18} /> Login</button>
                )}
              </div>
            </div>
          )}
        </div>
        <div onClick={() => onNavigate('home')} className="flex items-center gap-2.5 cursor-pointer group">
          <div className="bg-[#a832d3] p-2 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform"><UtensilsCrossed size={18} /></div>
          <span className="text-[#1a0e1b] font-black text-xl tracking-tight hidden sm:block">Recipehub</span>
        </div>
      </div>

      <div className="flex-1 max-w-xl relative group mx-2 hidden md:block" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a832d3]" size={20} strokeWidth={2.5} />
          <input 
            type="text" 
            placeholder="Search by recipe or ingredients..."
            className={`w-full bg-white border-2 border-[#e5b3eb] py-2.5 pl-12 pr-4 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#a832d3]/20 transition-all shadow-sm ${showHistory && history.length > 0 ? 'rounded-t-[24px]' : 'rounded-full'}`}
            value={searchValue} 
            onFocus={() => setShowHistory(true)}
            onChange={(e) => setSearchValue(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchValue)}
          />
        </div>
        {showHistory && history.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border-x-2 border-b-2 border-[#e5b3eb] rounded-b-[24px] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 z-50">
            <div className="flex items-center justify-between px-5 py-2 border-b border-zinc-50 bg-zinc-50/50">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recent Searches</span>
              <button onClick={clearHistory} className="text-[10px] font-black text-[#a832d3] hover:underline uppercase tracking-widest">Clear All</button>
            </div>
            {history.map((item, idx) => (
              <div key={idx} onClick={() => { setSearchValue(item); handleSearchSubmit(item); }} className="flex items-center justify-between px-5 py-3 hover:bg-[#a832d3]/5 cursor-pointer group/item transition-colors">
                <div className="flex items-center gap-3 text-zinc-600">
                  <Clock size={14} className="text-zinc-300" />
                  <span className="text-sm font-bold group-hover/item:text-[#a832d3]">{item}</span>
                </div>
                <button onClick={(e) => removeFromHistory(e, item)} className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/item:opacity-100"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isLoggedIn && (
            <button 
              onClick={() => onNavigate('premium')} 
              className="hidden sm:flex items-center gap-2 bg-[#a832d3] text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-purple-900/10"
            >
              <Crown size={14} /> {isPremium ? 'Premium Active' : 'Go Premium'}
            </button>
        )}
        <button onClick={() => onNavigate('jobs')} className="hidden lg:flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-[#a832d3] font-black text-xs transition-colors"><Briefcase size={18} /> CAREERS</button>
        {isLoggedIn ? (
          <>
            <div className="relative group/tooltip">
              <button onClick={() => onNavigate('notifications')} className={`relative p-2 ${currentPage === 'notifications' ? 'text-[#a832d3]' : 'text-zinc-600'}`}>
                <Bell size={22} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#a832d3] rounded-full animate-pulse"></span>
              </button>
            </div>
            <button 
              onClick={() => onNavigateToProfile?.()} 
              className={`w-10 h-10 rounded-full border-2 overflow-hidden transition-all hover:scale-110 ${currentPage === 'profile' ? 'border-[#a832d3]' : 'border-white'} ${isPremium ? 'premium-avatar-glow' : ''}`}
            >
              <img src={currentUserAvatar} className="w-full h-full object-cover bg-white" />
            </button>
          </>
        ) : (
          <button 
            onClick={() => onNavigate('login')}
            className="px-6 py-2.5 rounded-xl bg-[#1a0e1b] text-white text-sm font-bold hover:brightness-110 transition-all shadow-lg active:scale-95"
          >
            Log In
          </button>
        )}
      </div>
    </header>
  );
};
