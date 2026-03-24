
import React from 'react';
import { Briefcase, MapPin, Clock, DollarSign, Calendar, Phone, Info, Building2, UserCircle2, CheckCircle, CalendarX } from 'lucide-react';
import { Job, UserProfile, Page } from '../types';

interface JobsProps {
  user: UserProfile;
  jobs: Job[];
  onAddJob: (job: Job) => void;
  onUpdateStatus: (id: string, status: 'approved') => void;
  onDeleteJob: (id: string) => void;
  onApplyJob: (jobId: string) => void;
  // Add onNavigate to satisfy parent component's prop passing
  onNavigate?: (page: Page) => void;
}

export const Jobs: React.FC<JobsProps> = ({ user, jobs, onApplyJob }) => {
  const filteredJobs = jobs.filter(j => j.status === 'approved');

  const handleApplyClick = (job: Job) => {
    if (!user || user.id === 'guest') {
      alert("Registration Required: Please login to apply for this position.");
      return;
    }
    onApplyJob(job.id);
  };

  const isApplied = (job: Job) => job.applicantIds.includes(user.id);
  
  const isExpired = (job: Job) => {
    if (!job.lastDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today > new Date(job.lastDate);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-in fade-in duration-500">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#1a0e1b] flex items-center gap-4 mb-2">
            <Briefcase className="text-[#a832d3]" size={40} />
            Opportunities
          </h1>
          <p className="text-zinc-500 font-bold">Discover professional culinary careers from verified companies.</p>
        </div>
        <button onClick={() => alert("Career Portal FAQ: Feature coming soon!")} className="text-[#a832d3] font-black text-sm flex items-center gap-2 hover:underline">
          <Info size={18} /> How to Apply?
        </button>
      </div>

      <div className="space-y-8 pb-20">
        {filteredJobs.length > 0 ? filteredJobs.filter(job => job.id).map(job => (
          <div key={job.id} className="bg-white rounded-[40px] border border-white shadow-xl overflow-hidden animate-in slide-in-from-bottom-6 duration-500">
            {/* Company Header */}
            <div className="bg-zinc-50/80 px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center overflow-hidden shadow-sm">
                  {job.companyLogo ? (
                    <img src={job.companyLogo} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <Building2 className="text-zinc-300" size={24} />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-xl text-[#1a0e1b]">{job.companyName}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#a832d3] tracking-widest">
                    <Building2 size={12} /> {job.companyIndustry || 'Hospitality Partner'}
                  </div>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Application Deadline</p>
                <p className={`text-sm font-black ${isExpired(job) ? 'text-red-500' : 'text-zinc-900'}`}>
                  {job.lastDate ? new Date(job.lastDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Job Details */}
            <div className="p-8">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black text-[#1a0e1b]">{job.title}</h2>
                  <div className="bg-[#a832d3]/10 text-[#a832d3] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {job.jobType}
                  </div>
                </div>
                <p className="text-zinc-600 font-medium leading-relaxed">{job.description}</p>
              </div>

              {/* Requirement Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={12} /> Monthly Salary
                  </p>
                  <p className="font-black text-[#1a0e1b]">{job.salary || 'Competitive'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={12} /> Working Hours
                  </p>
                  <p className="font-black text-[#1a0e1b]">{job.workingHours || 'Standard'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} /> Weekly Off
                  </p>
                  <p className="font-black text-[#1a0e1b]">{job.weeklyOff || 'Rotating'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {job.skills.filter(skill => skill).map((skill, sIdx) => (
                  <span key={`${job.id}-${skill}-${sIdx}`} className="bg-white px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 text-zinc-600 shadow-sm">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-zinc-100">
                <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold">
                  <Phone size={16} /> HR: <span className="text-[#a832d3] font-black">{job.contactMethod}</span>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {isExpired(job) ? (
                    <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-500 px-10 py-4 rounded-2xl font-black text-sm border border-red-100">
                      <CalendarX size={20} /> Applications Closed
                    </div>
                  ) : isApplied(job) ? (
                    <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-10 py-4 rounded-2xl font-black text-sm border border-emerald-100">
                      <CheckCircle size={20} /> Applied Successfully
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleApplyClick(job)}
                      className="flex-1 sm:flex-none bg-[#1a0e1b] text-white px-12 py-4 rounded-2xl font-black hover:bg-[#a832d3] transition-all shadow-lg active:scale-95 text-sm"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-24 text-center bg-white/40 rounded-[64px] border-2 border-dashed border-white">
            <Briefcase size={64} className="text-zinc-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-zinc-400">No career openings available right now</h3>
            <p className="text-zinc-400 font-bold mt-2">Verified companies post regular updates here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
