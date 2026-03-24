import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  ShieldAlert,
  CheckCircle,
  XCircle,
  TrendingUp,
  LayoutDashboard,
  Search,
  LogOut,
  Video,
  Eye,
  Trash2,
  Bell,
  X,
  Info,
  Building2,
  UserCircle
} from 'lucide-react';
import { Page, UserProfile, Job, Video as VideoType, ContentStatus, UserNotification } from '../types';
import { fetchAdminMetricsApi, fetchAdminUsersApi, fetchAdminCompaniesApi, banUserApi, approveVideoApi, adminDeleteVideoApi, adminApproveJobApi } from '../api';

interface AdminDashboardProps {
  currentUser: UserProfile;
  users: UserProfile[];
  videos: VideoType[];
  jobs: Job[];
  onUpdateJobStatus: (id: string, status: ContentStatus) => void;
  onSendNotification: (note: UserNotification) => void;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  users,
  videos,
  jobs,
  onUpdateJobStatus,
  onSendNotification,
  onNavigate,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'jobs' | 'videos'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', message: '', recipient: 'all' });

  const [metrics, setMetrics] = useState({ total_users: 0, total_companies: 0, total_videos: 0, pending_jobs: 0 });
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminCompanies, setAdminCompanies] = useState<any[]>([]);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        if (activeTab === 'overview') {
          const m = await fetchAdminMetricsApi();
          setMetrics(m);
        } else if (activeTab === 'users') {
          const u = await fetchAdminUsersApi();
          setAdminUsers(u);
        } else if (activeTab === 'companies') {
          const c = await fetchAdminCompaniesApi();
          setAdminCompanies(c);
        }
      } catch (err) {
        console.error("Failed to load admin data", err);
      }
    };
    loadAdminData();
  }, [activeTab]);

  const stats = [
    { id: 'users', label: 'Total Users', value: metrics.total_users, icon: <Users />, color: 'bg-blue-600' },
    { id: 'companies', label: 'Companies', value: metrics.total_companies, icon: <Building2 />, color: 'bg-indigo-600' },
    { id: 'videos', label: 'Platform Videos', value: metrics.total_videos, icon: <Video />, color: 'bg-purple-600' },
    { id: 'jobs', label: 'Pending Jobs', value: metrics.pending_jobs, icon: <ShieldAlert />, color: 'bg-amber-600' }
  ];

  const handleSendNote = (e: React.FormEvent) => {
    e.preventDefault();
    const newNote: UserNotification = {
      id: `note-${Date.now()}`,
      recipientId: noteForm.recipient,
      senderName: 'Platform Administrator',
      title: noteForm.title,
      message: noteForm.message,
      time: 'Just now',
      type: 'announcement',
      read: false
    };
    onSendNotification(newNote);
    setShowNotificationModal(false);
    setNoteForm({ title: '', message: '', recipient: 'all' });
    alert("Official Notification Dispatched");
  };

  const filteredUsers = adminUsers.filter(u =>
  (u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCompanies = adminCompanies.filter(c =>
  (c.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#0d090d] text-white flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-80 bg-black border-r border-white/5 p-8 flex flex-col">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-red-600 p-2.5 rounded-2xl shadow-lg shadow-red-600/20">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black">Admin Panel</h1>
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">RecipeHub Root</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'overview', label: 'Summary', icon: <LayoutDashboard size={18} /> },
            { id: 'jobs', label: 'Job Approval', icon: <Briefcase size={18} /> },
            { id: 'users', label: 'Users', icon: <Users size={18} /> },
            { id: 'companies', label: 'Companies', icon: <Building2 size={18} /> },
            { id: 'videos', label: 'Video Stats', icon: <Video size={18} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-[#1a151a] text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1a151a]/50'
                }`}
            >
              {tab.icon} {tab.label}
              {tab.id === 'jobs' && jobs.filter(j => j.status === 'pending').length > 0 && (
                <span className="ml-auto bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {jobs.filter(j => j.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-white/5 space-y-6">
          <button
            onClick={() => { setNoteForm({ ...noteForm, recipient: 'all' }); setShowNotificationModal(true); }}
            className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all shadow-lg active:scale-95"
          >
            <Bell size={16} /> Broadcast Alert
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold text-zinc-500 hover:text-red-400 transition-all active:scale-95">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar">
        {activeTab === 'overview' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black">System Pulse</h2>
                <p className="text-zinc-500 font-bold mt-2">Real-time metrics from the RecipeHub ecosystem.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div
                  key={stat.id}
                  className="bg-black/50 rounded-[40px] p-10 border border-white/5 flex flex-col items-center text-center group transition-all hover:scale-[1.02] shadow-sm"
                >
                  <div className={`${stat.color} p-5 rounded-3xl text-white mb-6 shadow-xl group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className="text-4xl font-black">{stat.value}</h3>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900/20 p-8 rounded-[40px] border border-white/5 flex items-start gap-6">
              <div className="bg-emerald-600/10 p-4 rounded-2xl text-emerald-500"><CheckCircle size={28} /></div>
              <div>
                <h4 className="font-black text-xl mb-2">Platform Status: Healthy</h4>
                <p className="text-zinc-500 font-medium">Auto-moderation is active for recipe videos. Job verification queue is currently at {jobs.filter(j => j.status === 'pending').length} entries requiring your attention.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            <div className="flex items-center justify-between gap-6">
              <h2 className="text-3xl font-black">User Directory</h2>
              <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input
                  type="text"
                  placeholder="Search user ID or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-1 focus:ring-zinc-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredUsers.filter(u => u.id).map(u => (
                <div key={u.id} className="bg-black border border-white/5 p-6 rounded-[32px] flex items-center justify-between group hover:bg-[#1a151a] transition-all">
                  <div className="flex items-center gap-5">
                    <div className="text-[10px] font-black text-zinc-700 font-mono tracking-tighter uppercase">ID: {u.id}</div>
                    {u.avatar ? (
                      <img src={u.avatar} className="w-12 h-12 rounded-full border border-white/10 shadow-sm" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-black text-xs">
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-black text-white">{u.first_name || u.username}</h4>
                      <p className="text-xs text-[#a832d3] font-bold">@{u.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to ban ${u.username}?`)) {
                          try {
                            await banUserApi(String(u.id));
                            setAdminUsers(prev => prev.filter(x => x.id !== u.id));
                            alert('User banned successfully');
                          } catch (err) {
                            alert('Failed to ban user');
                          }
                        }
                      }}
                      className="bg-red-900/20 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all"
                    >
                      Ban User
                    </button>
                    <button
                      onClick={() => setSelectedUser(u as any)}
                      className="flex items-center gap-2 bg-white/5 text-zinc-400 px-6 py-3 rounded-2xl font-black text-xs hover:bg-white/10 transition-all active:scale-95"
                    >
                      <UserCircle size={16} /> View Profile
                    </button>
                    <button
                      onClick={() => { setNoteForm({ ...noteForm, recipient: u.id }); setShowNotificationModal(true); }}
                      className="bg-white/5 text-white p-3 rounded-2xl hover:bg-[#a832d3] transition-all active:scale-95"
                    >
                      <Bell size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            <h2 className="text-3xl font-black">Verified Companies</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.filter(c => c.id).map(c => (
                <div key={c.id} className="bg-black border border-white/5 p-8 rounded-[40px] flex flex-col items-center text-center hover:bg-[#1a151a] transition-all">
                  {c.avatar ? (
                    <img src={c.avatar} className="w-20 h-20 rounded-full border-2 border-white/10 mb-6 shadow-lg" alt="" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center font-black text-2xl mb-6">
                      {c.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h4 className="text-xl font-black mb-1">{c.first_name || c.username}</h4>
                  <p className="text-[#a832d3] font-bold text-xs uppercase tracking-widest mb-6">Service Partner</p>
                  <button
                    onClick={() => setSelectedUser(c as any)}
                    className="w-full bg-white/5 py-4 rounded-2xl font-black text-xs hover:bg-white/10 transition-all active:scale-95"
                  >
                    Review Profile
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            <h2 className="text-3xl font-black">Job Approval Queue</h2>
            <div className="space-y-4">
              {jobs.filter(j => j.status === 'pending' && j.id).map(job => (
                <div key={job.id} className="bg-black border border-white/5 p-10 rounded-[48px] shadow-sm hover:border-[#a832d3]/20 transition-all">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h3 className="text-3xl font-black mb-2">{job.title}</h3>
                      <p className="text-zinc-500 font-bold flex items-center gap-2">
                        <Building2 size={16} /> {job.companyName} • {job.location}
                      </p>
                    </div>
                    <div className="bg-amber-600/10 text-amber-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border border-amber-600/20">
                      Verification Required
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 p-6 bg-white/5 rounded-3xl">
                    <div><p className="text-[10px] text-zinc-500 font-black uppercase mb-1">Salary</p><p className="font-bold">{job.salary}</p></div>
                    <div><p className="text-[10px] text-zinc-500 font-black uppercase mb-1">Experience</p><p className="font-bold">{job.experience}</p></div>
                    <div><p className="text-[10px] text-zinc-500 font-black uppercase mb-1">Working Hours</p><p className="font-bold">{job.workingHours}</p></div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={async () => {
                        try {
                          await adminApproveJobApi(job.id);
                          onUpdateJobStatus(job.id, 'approved');
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm hover:brightness-110 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      <CheckCircle size={20} /> Approve Posting
                    </button>
                    <button
                      onClick={() => onUpdateJobStatus(job.id, 'rejected')}
                      className="flex-1 bg-white/5 text-red-500 border border-red-500/10 py-5 rounded-2xl font-black text-sm hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      <XCircle size={20} /> Reject
                    </button>
                  </div>
                </div>
              ))}
              {jobs.filter(j => j.status === 'pending').length === 0 && (
                <div className="py-24 text-center bg-black/50 rounded-[64px] border border-dashed border-white/5">
                  <p className="text-zinc-700 font-black text-xl">All job requirements processed.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            <h2 className="text-3xl font-black">Video Insights</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {videos.filter(v => v.id).map(v => (
                <div key={v.id} className="bg-black border border-white/5 rounded-2xl overflow-hidden group cursor-pointer">
                  <div className="relative aspect-video">
                    <img src={v.thumbnail} className="w-full h-full object-cover brightness-75 group-hover:scale-110 transition-transform duration-500" alt="" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye size={24} />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold truncate mb-1">{v.title}</p>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter mb-2">{v.views}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await approveVideoApi(v.id);
                            alert("Video approved successfully");
                          } catch (e) {
                            alert("Failed to approve video");
                          }
                        }}
                        className="flex-1 bg-emerald-600/20 text-emerald-400 p-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-colors flex justify-center"
                        title="Verify Content"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm("Delete this video permanently?")) {
                            try {
                              await adminDeleteVideoApi(v.id);
                              alert("Video deleted");
                            } catch (e) {
                              alert("Failed to delete");
                            }
                          }
                        }}
                        className="flex-1 bg-red-500/10 text-red-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-colors flex justify-center"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* READ-ONLY PROFILE MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#110d11] w-full max-w-2xl rounded-[48px] p-10 shadow-2xl relative animate-in zoom-in-95 border border-white/10">
            <button onClick={() => setSelectedUser(null)} className="absolute top-8 right-8 text-zinc-500 hover:text-white p-2 transition-colors"><X size={24} /></button>
            <div className="flex flex-col items-center mb-10">
              {selectedUser.avatar ? (
                <img src={selectedUser.avatar} className="w-32 h-32 rounded-full border-4 border-white/10 mb-6 shadow-2xl" alt="" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center font-black text-4xl mb-6">
                  {selectedUser.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="text-3xl font-black mb-1">{selectedUser.name}</h2>
              <p className="text-[#a832d3] font-black">{selectedUser.handle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">Email Address</p>
                <p className="font-bold">{selectedUser.email || 'N/A'}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">Account Role</p>
                <p className="font-bold">{selectedUser.role}</p>
              </div>
            </div>

            <div className="bg-white/5 p-8 rounded-3xl mb-10 border border-white/5">
              <p className="text-[10px] text-zinc-500 font-black uppercase mb-2">User Bio</p>
              <p className="text-zinc-300 font-medium leading-relaxed italic">{selectedUser.bio || 'No bio provided.'}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => { setNoteForm({ ...noteForm, recipient: selectedUser.id }); setShowNotificationModal(true); }}
                className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-sm hover:bg-[#a832d3] hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <Bell size={18} /> Send Official Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST MODAL */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1a151a] w-full max-w-lg rounded-[48px] p-10 shadow-2xl relative animate-in zoom-in-95 border border-white/20">
            <button onClick={() => setShowNotificationModal(false)} className="absolute top-8 right-8 text-zinc-500 p-2 hover:text-white transition-colors"><X size={24} /></button>

            <div className="flex items-center gap-3 mb-8">
              <div className="bg-[#a832d3] p-3 rounded-2xl text-white shadow-lg"><Bell size={24} /></div>
              <h3 className="text-2xl font-black">System Alert</h3>
            </div>

            <form onSubmit={handleSendNote} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-1">Target Recipient</label>
                <div className="bg-white/5 py-4 px-6 rounded-2xl font-bold text-zinc-400 border border-white/5">
                  {noteForm.recipient === 'all' ? '📢 Universal Broadcast (All Users)' : `👤 Direct User ID: ${noteForm.recipient}`}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-1">Subject Header</label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}
                  placeholder="e.g. System Maintenance"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-[#a832d3]/50 transition-all text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-1">Message Content</label>
                <textarea
                  value={noteForm.message}
                  onChange={e => setNoteForm({ ...noteForm, message: e.target.value })}
                  placeholder="Detail the instructions or alert for the user(s)..."
                  className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 px-6 font-medium outline-none focus:ring-2 focus:ring-[#a832d3]/50 h-32 resize-none text-white"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-white text-black py-5 rounded-[24px] font-black hover:bg-[#a832d3] hover:text-white transition-all shadow-xl active:scale-95">
                Submit Alert
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
