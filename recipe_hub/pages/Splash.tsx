
import React, { useEffect, useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface SplashProps {
  onFinish: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    const timer = setTimeout(() => {
      onFinish();
    }, 5000); // Changed to 5 seconds

    return () => {
      clearInterval(dotInterval);
      clearTimeout(timer);
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-[#F6CEFC] flex items-center justify-center z-[100] transition-opacity duration-1000 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="/recipehub_branding_image_1773477065421.png"
          alt="Branding"
          className="w-full h-full object-cover opacity-20 filter blur-sm scale-110"
        />
      </div>
      <div className="flex flex-col items-center relative z-10">
        <div className="bg-[#a832d3] p-6 rounded-[32px] text-white mb-8 animate-bounce shadow-[0_0_50px_rgba(168,50,211,0.2)]">
          <UtensilsCrossed size={60} strokeWidth={2.5} />
        </div>
        <h1 className="text-[#1a0e1b] text-8xl font-black tracking-tight mb-2 drop-shadow-sm">Recipehub</h1>
        <p className="text-[#a832d3] text-xl tracking-[0.3em] font-bold uppercase mb-12">Discover. Cook. Share.</p>

        <div className="flex gap-3">
          <div className={`w-3 h-3 rounded-full bg-[#a832d3] transition-all duration-300 shadow-sm ${dots.length >= 1 ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`}></div>
          <div className={`w-3 h-3 rounded-full bg-[#a832d3] transition-all duration-300 shadow-sm ${dots.length >= 2 ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`}></div>
          <div className={`w-3 h-3 rounded-full bg-[#a832d3] transition-all duration-300 shadow-sm ${dots.length >= 3 ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`}></div>
        </div>
      </div>
    </div>
  );
};
