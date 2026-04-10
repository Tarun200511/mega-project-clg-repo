import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Clock, Wifi } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Field Dashboard',
  '/analyze':   'Execute Analysis',
  '/cases':     'Case Archives',
};

export default function TopBar() {
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const title = Object.entries(pageTitles).find(([k]) => location.pathname.startsWith(k))?.[1] || 'ForensiX';

  return (
    <header className="h-14 glass border-b border-white/5 shrink-0 flex items-center px-6 gap-4 relative z-10">
      {/* Page Title */}
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-white tracking-wide">{title}</h2>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
          LIVE · ForensiX Intelligence System
        </div>
      </div>

      {/* System Clock */}
      <div className="flex items-center gap-2 text-slate-400 glass rounded-lg px-3 py-1.5 text-xs font-mono">
        <Clock className="w-3.5 h-3.5" />
        <span>{time.toLocaleTimeString()}</span>
      </div>

      {/* Network */}
      <div className="flex items-center gap-1.5 glass rounded-lg px-3 py-1.5 text-xs text-accent font-mono">
        <Wifi className="w-3.5 h-3.5" />
        <span>LOCAL</span>
      </div>

      {/* Notifications */}
      <button className="relative w-8 h-8 glass rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
      </button>
    </header>
  );
}
