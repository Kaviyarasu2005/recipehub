
import React, { useState, useRef } from 'react';
import {
  Briefcase, Building2, Plus, Trash2, CheckCircle,
  Clock, X, LayoutDashboard, UserCircle,
  AlertCircle, DollarSign, Calendar, Phone, FileText, Camera, UploadCloud, Users, Bell, Search, CheckSquare, Square, Send,
  UtensilsCrossed, LogOut
} from 'lucide-react';
import { Page, UserProfile, Job, IndustryType, CompanyDetails, UserNotification } from '../types';

interface CompanyDashboardProps {
  currentUser: UserProfile;
  users: UserProfile[];
  jobs: Job[];
  onAddJob: (job: Job) => void;
  onDeleteJob: (id: string) => void;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  onUpdateProfile?: (updated: UserProfile) => void;
  onSendNotification?: (note: UserNotification) => void;
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({
  currentUser, users, jobs, onAddJob, onDeleteJob, onLogout, onUpdateProfile, onSendNotification
}) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'profile'>('jobs');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState<Job | null>(null);
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [showMassNotify, setShowMassNotify] = useState(false);
  const [massNote, setMassNote] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState(currentUser.name);
  const [companyLogo, setCompanyLogo] = useState(currentUser.avatar);
  const [profileForm, setProfileForm] = useState<CompanyDetails>(currentUser.companyDetails || {
    industry: 'Restaurant',
    description: '',
    location: '',
    contactNumber: '',
    hrName: ''
  });

  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    skills: '',
    salary: '',
    jobType: 'Full-time' as 'Full-time' | 'Part-time',
    workingHours: '',
    weeklyOff: '',
    location: currentUser.companyDetails?.location || '',
    experience: '',
    contactMethod: currentUser.companyDetails?.contactNumber || '',
    lastDate: ''
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCompanyLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile?.({
      ...currentUser,
      name: companyName,
      avatar: companyLogo,
      companyDetails: { ...profileForm }
    });
    alert("Official Profile Updated Successfully");
  };

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.hrName || !profileForm.location) {
      alert("Verification Error: Please complete your Company Profile first.");
      setActiveTab('profile');
      return;
    }

    if (!jobForm.lastDate) {
      alert("Validation Error: Please specify an application deadline.");
      return;
    }

    const newJob: Job = {
      id: `job-${Date.now()}`,
      companyId: currentUser.id,
      companyName: currentUser.name,
      companyLogo: currentUser.avatar,
      companyIndustry: currentUser.companyDetails?.industry,
      title: jobForm.title,
      description: jobForm.description,
      skills: jobForm.skills.split(',').map(s => s.trim()),
      salary: jobForm.salary,
      jobType: jobForm.jobType,
      workingHours: jobForm.workingHours,
      weeklyOff: jobForm.weeklyOff,
      location: jobForm.location || profileForm.location,
      experience: jobForm.experience,
      contactMethod: jobForm.contactMethod || profileForm.contactNumber,
      status: 'pending',
      postedAt: 'Just now',
      lastDate: jobForm.lastDate,
      applicantIds: []
    };

    onAddJob(newJob);
    setShowPostModal(false);
    alert("Requirement Submitted for Admin Approval");
  };

  const handleNotifySelected = () => {
    if (selectedApplicants.length === 0 || !massNote.trim()) return;

    selectedApplicants.forEach(uid => {
      onSendNotification?.({
        id: `note-${Date.now()}-${uid}`,
        recipientId: uid,
        senderName: currentUser.name,
        title: 'Application Status Update',
        message: massNote,
        time: 'Just now',
        type: 'announcement',
        read: false
      });
    });

    alert(`Notification Broadcast successful to ${selectedApplicants.length} candidates.`);
    setShowMassNotify(false);
    setSelectedApplicants([]);
    setMassNote('');
  };

  const companyJobs = jobs.filter(j => j.companyId === currentUser.id);

  return (
    <div className="h-screen overflow-y-auto w-full bg-zinc-50 flex flex-col">
      <header className="bg-white border-b border-zinc-200 px-8 py-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="bg-[#a832d3] p-2 rounded-xl text-white shadow-lg">
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#1a0e1b]">RECIPEHUB Portal</h1>
            <p className="text-[10px] font-black uppercase text-[#a832d3] tracking-widest">Business Management</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-600 hover:text-white transition-all active:scale-95 border border-red-100"
        >
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div className="w-full min-h-screen p-6 md:p-10">
        <div className="flex gap-8 mb-10 border-b border-zinc-200">
          <button onClick={() => setActiveTab('jobs')} className={`pb-4 text-sm font-black flex items-center gap-2 relative transition-all ${activeTab === 'jobs' ? 'text-[#a832d3]' : 'text-zinc-400'}`}>
            <Briefcase size={18} /> Recruitment Center
            {activeTab === 'jobs' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#a832d3] rounded-full" />}
          </button>
          <button onClick={() => setActiveTab('profile')} className={`pb-4 text-sm font-black flex items-center gap-2 relative transition-all ${activeTab === 'profile' ? 'text-[#a832d3]' : 'text-zinc-400'}`}>
            <Building2 size={18} /> Organizational Profile
            {activeTab === 'profile' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#a832d3] rounded-full" />}
          </button>
        </div>

        {activeTab === 'jobs' ? (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-black text-[#1a0e1b]">Active Vacancies</h2>
                <p className="text-zinc-500 font-medium">Manage your hiring pipeline and applications.</p>
              </div>
              <button onClick={() => setShowPostModal(true)} className="bg-[#1a0e1b] text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-[#a832d3] transition-all shadow-xl active:scale-95">
                <Plus size={20} /> Post Vacancy
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {companyJobs.filter(job => job.id).map(job => (
                <div key={job.id} className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm flex items-center justify-between group transition-all hover:shadow-md">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-[#1a0e1b] mb-1">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-zinc-400 uppercase tracking-widest items-center">
                      <span className="flex items-center gap-1"><Users size={14} /> Total Applicants: <span className="text-[#a832d3]">{job.applicantIds.length}</span></span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-red-400"><Calendar size={14} /> Deadline: {job.lastDate ? new Date(job.lastDate).toLocaleDateString() : 'None'}</span>
                      <span>•</span>
                      <span className={`${job.status === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`}>{job.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setSelectedApplicants([]); setShowApplicantsModal(job); }}
                      className="bg-zinc-50 text-zinc-600 px-6 py-3 rounded-xl text-xs font-black hover:bg-[#a832d3] hover:text-white transition-all flex items-center gap-2 active:scale-95"
                    >
                      <Search size={14} /> Review Candidates
                    </button>
                    <button onClick={() => { if (window.confirm("Confirm deletion of this posting?")) onDeleteJob(job.id); }} className="p-4 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-95"><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
              {companyJobs.length === 0 && (
                <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-zinc-200">
                  <Briefcase size={48} className="text-zinc-200 mx-auto mb-4" />
                  <p className="font-bold text-zinc-400">No vacancies currently listed.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[48px] p-10 border border-zinc-100 shadow-sm max-w-3xl animate-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-black text-[#1a0e1b] mb-8">Maintain Organization Profile</h2>

            <form onSubmit={handleProfileSubmit} className="space-y-10">
              <div className="flex flex-col items-center gap-6 pb-6 border-b border-zinc-50">
                <div
                  className="relative group cursor-pointer w-32 h-32 rounded-[32px] border-4 border-[#F6CEFC] overflow-hidden bg-zinc-50 flex items-center justify-center transition-all hover:border-[#a832d3]"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {companyLogo ? (
                    <img src={companyLogo} className="w-full h-full object-cover" alt="Logo" />
                  ) : (
                    <Building2 className="text-zinc-200" size={48} />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={24} />
                  </div>
                </div>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Brand Mark</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Registered Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 font-black text-lg focus:ring-2 focus:ring-[#a832d3]/20 transition-all outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Industry Type</label>
                  <select
                    value={profileForm.industry}
                    onChange={e => setProfileForm({ ...profileForm, industry: e.target.value as IndustryType })}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 font-bold outline-none cursor-pointer"
                  >
                    <option>Hotel</option>
                    <option>Restaurant</option>
                    <option>Catering</option>
                    <option>Bakery</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Headquarters Location</label>
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={e => setProfileForm({ ...profileForm, location: e.target.value })}
                    placeholder="City, Country"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 font-bold outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">HR Point of Contact</label>
                  <input
                    type="text"
                    value={profileForm.hrName}
                    onChange={e => setProfileForm({ ...profileForm, hrName: e.target.value })}
                    placeholder="Lead Recruiter Name"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 font-bold outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Official Support Number</label>
                  <input
                    type="tel"
                    value={profileForm.contactNumber}
                    onChange={e => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 font-bold outline-none"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Corporate Mission & Bio</label>
                <textarea
                  value={profileForm.description}
                  onChange={e => setProfileForm({ ...profileForm, description: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl py-4 px-6 font-medium h-32 resize-none outline-none"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-[#1a0e1b] text-white py-5 rounded-[24px] font-black hover:bg-[#a832d3] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
                <CheckCircle size={20} /> Synchronize & Save
              </button>
            </form>
          </div>
        )}
      </div>

      {/* APPLICANT REVIEW MODAL */}
      {showApplicantsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[48px] p-10 shadow-2xl relative animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <button onClick={() => setShowApplicantsModal(null)} className="absolute top-8 right-8 text-zinc-400 hover:text-black p-2 transition-colors"><X size={24} /></button>
            <div className="mb-8">
              <h2 className="text-3xl font-black">{showApplicantsModal.title} Candidates</h2>
              <p className="text-zinc-500 font-bold">Review profiles and dispatch recruitment status updates.</p>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 mb-6">
              {showApplicantsModal.applicantIds.filter(uid => uid).map(uid => {
                const applicant = users.find(u => u.id === uid);
                const isSelected = selectedApplicants.includes(uid);
                return (
                  <div key={uid} className={`p-4 rounded-3xl border flex items-center justify-between transition-all ${isSelected ? 'border-[#a832d3] bg-[#a832d3]/5' : 'border-zinc-100 bg-zinc-50'}`}>
                    <div className="flex items-center gap-4">
                      <button onClick={() => isSelected ? setSelectedApplicants(p => p.filter(i => i !== uid)) : setSelectedApplicants(p => [...p, uid])}>
                        {isSelected ? <CheckSquare className="text-[#a832d3]" /> : <Square className="text-zinc-300" />}
                      </button>
                      <img src={applicant?.avatar} className="w-12 h-12 rounded-full border bg-white shadow-sm" alt="" />
                      <div>
                        <p className="font-black text-sm">{applicant?.name}</p>
                        <p className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">{applicant?.handle}</p>
                      </div>
                    </div>
                    <button onClick={() => alert(`${applicant?.name}'s Full Profile: Feature coming soon!`)} className="text-xs font-black text-[#a832d3] hover:underline px-4">View Portfolio</button>
                  </div>
                );
              })}
              {showApplicantsModal.applicantIds.length === 0 && (
                <div className="text-center py-20 text-zinc-300 font-black">No submissions received for this opening yet.</div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                disabled={selectedApplicants.length === 0}
                onClick={() => setShowMassNotify(true)}
                className="flex-1 bg-[#1a0e1b] text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 disabled:opacity-30 hover:bg-[#a832d3] transition-all active:scale-95"
              >
                <Bell size={18} /> Send Status Alert ({selectedApplicants.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECRUITMENT STATUS DISPATCH MODAL */}
      {showMassNotify && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[48px] p-10 shadow-2xl relative animate-in zoom-in-95 border border-white/50">
            <button onClick={() => setShowMassNotify(false)} className="absolute top-8 right-8 text-zinc-400 p-2 hover:text-black transition-colors"><X size={24} /></button>
            <h3 className="text-2xl font-black mb-6">Dispatch Recruitment Update</h3>
            <p className="text-xs font-bold text-zinc-400 mb-6 uppercase tracking-widest">Broadcasting to {selectedApplicants.length} selected candidates</p>
            <textarea
              value={massNote}
              onChange={e => setMassNote(e.target.value)}
              placeholder="Write common interview instructions or status update here..."
              className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl p-6 h-40 font-medium mb-6 resize-none outline-none focus:ring-2 focus:ring-[#a832d3]/20 transition-all"
            />
            <button onClick={handleNotifySelected} className="w-full bg-[#1a0e1b] text-white py-5 rounded-[24px] font-black hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95">
              <Send size={18} /> Confirm Broadcast
            </button>
          </div>
        </div>
      )}

      {/* VACANCY CREATION MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#1a0e1b]/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[48px] p-10 shadow-2xl relative animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <button onClick={() => setShowPostModal(false)} className="absolute top-8 right-8 text-zinc-400 hover:text-black p-2 transition-colors"><X size={24} /></button>
            <div className="mb-8">
              <h2 className="text-3xl font-black">Official Vacancy Posting</h2>
              <p className="text-zinc-500 font-medium">Define high-quality requirements for better applicant matches.</p>
            </div>
            <form onSubmit={handlePostJob} className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-8 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Professional Title</label>
                  <input type="text" value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} placeholder="e.g. Senior Sous Chef" required className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3.5 px-6 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Application Last Date</label>
                  <input type="date" value={jobForm.lastDate} onChange={e => setJobForm({ ...jobForm, lastDate: e.target.value })} required className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3.5 px-6 font-bold cursor-pointer" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Salary Range</label>
                  <input type="text" value={jobForm.salary} onChange={e => setJobForm({ ...jobForm, salary: e.target.value })} required className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3.5 px-6 font-bold" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Requirement Details</label>
                <textarea value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} required className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl py-4 px-6 h-24 font-medium resize-none" />
              </div>
              <button type="submit" className="w-full bg-[#1a0e1b] text-white py-5 rounded-[24px] font-black hover:bg-[#a832d3] transition-all shadow-xl active:scale-95">
                Dispatch Vacancy for Admin Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
