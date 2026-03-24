
import React from 'react';
import { PartyPopper, ShieldAlert, Bell, Calendar, User, Search } from 'lucide-react';
import { UserProfile, UserNotification } from '../types';

interface NotificationsProps {
  notifications: UserNotification[];
  onNavigateToProfile?: (user: UserProfile) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ notifications, onNavigateToProfile }) => {
  return (
    <div className="px-6 py-10 max-w-4xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <h1 className="text-5xl font-black text-[#1a0e1b] mb-2">Bell</h1>
          <p className="text-zinc-500 text-lg font-bold">Platform alerts and community interactions.</p>
        </div>
      </div>

      <div className="space-y-6 mb-20">
        {notifications.length > 0 ? (
          notifications.map((note) => (
            <div 
              key={note.id}
              className={`group bg-white rounded-[40px] p-10 flex items-start gap-8 shadow-sm transition-all hover:shadow-xl border border-white ${
                !note.read ? 'border-l-[12px] border-l-[#a832d3]' : ''
              }`}
            >
              <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center flex-shrink-0 ${note.type === 'warning' ? 'bg-red-50 text-red-500' : 'bg-[#F6CEFC]/50 text-[#a832d3]'}`}>
                {note.type === 'warning' ? <ShieldAlert size={32} /> : <Bell size={32} />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-2xl font-black text-[#1a0e1b]">{note.title}</h3>
                   <span className="text-zinc-300 font-bold text-sm">{note.time}</span>
                </div>
                <p className="text-zinc-600 text-lg leading-relaxed font-medium mb-6">{note.message}</p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                  <User size={12} /> Sent by: {note.senderName}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white/40 rounded-[64px] border-2 border-dashed border-white">
            <div className="bg-white p-8 rounded-full shadow-sm mb-6 text-zinc-200">
              <Bell size={48} />
            </div>
            <h3 className="text-2xl font-black text-zinc-400">Your tray is empty</h3>
            <p className="text-zinc-400 font-bold mt-2">Check back later for system announcements.</p>
          </div>
        )}
      </div>
    </div>
  );
};
