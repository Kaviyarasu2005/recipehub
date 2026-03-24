
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Crown, UtensilsCrossed, Menu, LogOut, Briefcase, Clock, Trash2, User, LayoutDashboard, ShieldAlert, X, UploadCloud, CircleHelp } from 'lucide-react';
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
  onNavigate, onNavigateToProfile, currentPage, onSearch, isLoggedIn, onLogout, currentUserAvatar, language, onLanguageChange, userRole
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = userRole === 'Admin';
  const isHomePage = currentPage === 'home';

  const renderAvatar = (src?: string, name?: string, size = 40) => {
    if (src && src.trim() !== '') {
      return (
        <img src={src} className="w-full h-full object-cover bg-white" alt="Profile" />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#a832d3] text-white font-black uppercase" style={{ fontSize: size * 0.4 }}>
        {name ? name.charAt(0) : '?'}
      </div>
    );
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('recipehub_search_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
    }
  }, [isMobileSearchOpen]);

  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...history.filter(h => h !== query)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('recipehub_search_history', JSON.stringify(newHistory));
    onSearch(query);
    setShowHistory(false);
    setIsMobileSearchOpen(false);
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
    <>
      <header className="sticky top-0 z-50 bg-[#F6CEFC]/95 backdrop-blur-lg px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-2 md:gap-6 border-b border-white/30">
        <div className="flex items-center gap-2 md:gap-6">
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-white/40 rounded-full transition-all text-[#1a0e1b]"><Menu size={22} /></button>
            {showMenu && (
              <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-[32px] shadow-2xl border border-zinc-100 overflow-hidden z-[60] animate-in zoom-in-95">
                <div className="p-4 border-b border-zinc-50">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-4 mb-2">Navigation</p>
                  {!isAdmin && (
                    <>
                      <button
                        onClick={() => { onNavigate('home'); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-[#a832d3]/5 hover:text-[#a832d3] rounded-2xl transition-colors"
                      >
                        <UtensilsCrossed size={18} /> Home
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { alert("Help Center will be implemented soon."); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-[#a832d3]/5 hover:text-[#a832d3] rounded-2xl transition-colors"
                  >
                    <CircleHelp size={18} /> Help Center
                  </button>
                  {isLoggedIn && (
                    <>
                      {userRole === 'Company' && (
                        <button onClick={() => { onNavigate('companyDashboard'); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-[#a832d3]/5 hover:text-[#a832d3] rounded-2xl transition-colors"><LayoutDashboard size={18} /> Business Hub</button>
                      )}
                      {userRole === 'Admin' && (
                        <button onClick={() => { onNavigate('adminDashboard'); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-[#a832d3]/5 hover:text-[#a832d3] rounded-2xl transition-colors"><ShieldAlert size={18} /> Admin Panel</button>
                      )}
                      <button onClick={() => { onLogout?.(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-colors mt-2"><LogOut size={18} /> Sign Out</button>
                    </>
                  )}
                  {!isLoggedIn && (
                    <button onClick={() => { onNavigate('login'); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#a832d3] hover:bg-[#a832d3]/5 rounded-2xl transition-colors mt-2"><LogOut size={18} /> Login / Register</button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div onClick={() => onNavigate(isAdmin ? 'adminDashboard' : 'home')} className="flex items-center gap-2 cursor-pointer group">
            <div className="bg-[#a832d3] p-1.5 md:p-2 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform"><UtensilsCrossed size={16} className="md:w-5 md:h-5" /></div>
            <span className="text-[#1a0e1b] font-black text-lg md:text-xl tracking-tight whitespace-nowrap">Recipehub</span>
          </div>
        </div>

        {/* Desktop & Tablet Search Bar - Only on Home Page */}
        <div className="flex-1 max-w-sm lg:max-w-xl relative group mx-2 hidden md:block" ref={searchRef}>
          {!isAdmin && isHomePage && (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a832d3]" size={18} strokeWidth={2.5} />
              <input
                type="text"
                placeholder="Search recipes..."
                className={`w-full bg-white/80 border-2 border-[#e5b3eb] py-2 pl-11 pr-4 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#a832d3]/20 transition-all shadow-sm ${showHistory && history.length > 0 ? 'rounded-t-[24px]' : 'rounded-full'}`}
                value={searchValue}
                onFocus={() => setShowHistory(true)}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchValue)}
              />
            </div>
          )}
          {!isAdmin && isHomePage && showHistory && history.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border-x-2 border-b-2 border-[#e5b3eb] rounded-b-[24px] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 z-50">
              <div className="flex items-center justify-between px-5 py-2 border-b border-zinc-50 bg-zinc-50/50">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recent</span>
                <button onClick={clearHistory} className="text-[10px] font-black text-[#a832d3] hover:underline uppercase tracking-widest">Clear</button>
              </div>
              {history.map((item, idx) => (
                <div key={idx} onClick={() => { setSearchValue(item); handleSearchSubmit(item); }} className="flex items-center justify-between px-5 py-2.5 hover:bg-[#a832d3]/5 cursor-pointer group/item transition-colors">
                  <div className="flex items-center gap-3 text-zinc-600">
                    <Clock size={12} className="text-zinc-300" />
                    <span className="text-xs font-bold group-hover/item:text-[#a832d3]">{item}</span>
                  </div>
                  <button onClick={(e) => removeFromHistory(e, item)} className="p-1.5 text-zinc-300 hover:text-red-500 rounded-lg transition-all"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          {/* Mobile-Only Search Toggle Icon - Only on Home Page */}
          {!isAdmin && isHomePage && (
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-2 md:hidden text-[#a832d3] hover:bg-white/40 rounded-full transition-colors"
              aria-label="Search"
            >
              <Search size={22} />
            </button>
          )}

          {!isAdmin && (
            <button
              onClick={() => onNavigate('jobs')}
              className="hidden md:flex items-center justify-center gap-2 p-2 md:px-4 md:py-2 text-zinc-600 hover:text-[#a832d3] font-black text-[10px] md:text-xs transition-colors"
              title="Careers"
            >
              <Briefcase size={20} /> <span className="hidden lg:block">CAREERS</span>
            </button>
          )}
          {isLoggedIn ? (
            <>
              <button onClick={() => onNavigate('notifications')} className={`relative p-2 ${currentPage === 'notifications' ? 'text-[#a832d3]' : 'text-zinc-600'}`}>
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#a832d3] rounded-full animate-pulse"></span>
              </button>
              <button
                onClick={() => { if (!isAdmin) onNavigateToProfile?.(); else onNavigate('adminDashboard'); }}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 overflow-hidden transition-all hover:scale-110 ${currentPage === 'profile' || (isAdmin && currentPage === 'adminDashboard') ? 'border-[#a832d3]' : 'border-white'}`}
              >
                {renderAvatar(currentUserAvatar, localStorage.getItem('recipehub_username') || 'C')}
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 md:px-6 md:py-2.5 rounded-xl bg-[#1a0e1b] text-white text-[10px] md:text-sm font-bold hover:brightness-110 transition-all shadow-lg active:scale-95 whitespace-nowrap"
            >
              Log In
            </button>
          )}
        </div>
      </header>

      {/* Mobile Search Overlay - Only active when mobile search icon is tapped */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-top duration-300 p-4 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 text-zinc-400"><X size={24} /></button>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a832d3]" size={18} />
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Search recipes or ingredients..."
                className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl py-3 pl-12 pr-4 text-base font-bold outline-none focus:border-[#a832d3]/30"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchValue)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {history.length > 0 && (
              <div className="px-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recent Searches</span>
                  <button onClick={clearHistory} className="text-[10px] font-black text-[#a832d3] uppercase tracking-widest">Clear All</button>
                </div>
                <div className="space-y-1">
                  {history.map((item, idx) => (
                    <div key={idx} onClick={() => { setSearchValue(item); handleSearchSubmit(item); }} className="flex items-center justify-between py-4 border-b border-zinc-50">
                      <div className="flex items-center gap-3 text-zinc-700">
                        <Clock size={16} className="text-zinc-300" />
                        <span className="text-sm font-bold">{item}</span>
                      </div>
                      <button onClick={(e) => removeFromHistory(e, item)} className="p-2 text-zinc-300"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-8 text-center px-8">
              <p className="text-xs text-zinc-400 font-medium">Try searching for "Pasta", "Vegan", or "Breakfast"</p>
            </div>
          </div>

          <button
            onClick={() => handleSearchSubmit(searchValue)}
            className="w-full bg-[#a832d3] text-white py-4 rounded-2xl font-black text-lg mb-2 shadow-lg"
          >
            Search
          </button>
        </div>
      )}
    </>
  );
};
