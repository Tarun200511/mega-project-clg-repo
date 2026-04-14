import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Clock, Wifi, Bot, Sparkles } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Field Dashboard',
  '/analyze':   'Execute Analysis',
  '/cases':     'Case Archives',
};

interface TopBarProps {
  onOpenBot?: () => void;
}

export default function TopBar({ onOpenBot }: TopBarProps) {
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const [notifPulse, setNotifPulse] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const title = Object.entries(pageTitles).find(([k]) => location.pathname.startsWith(k))?.[1] || 'ForensiX';

  return (
    <header className="h-14 border-b border-white/5 shrink-0 flex items-center px-6 gap-3 relative z-10"
      style={{ background: 'rgba(7,11,20,0.9)', backdropFilter: 'blur(16px)' }}>
      
      {/* Page Title */}
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-white tracking-wide">{title}</h2>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
          LIVE · ForensiX Intelligence System
        </div>
      </div>

      {/* Exhibit Mode Badge */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber/20 bg-amber/8 text-amber text-[10px] font-mono font-bold tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-amber pulse-dot" />
        EXHIBIT MODE
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

      {/* AI Bot button */}
      <button
        onClick={onOpenBot}
        className="relative flex items-center gap-1.5 glass rounded-lg px-3 py-1.5 text-xs text-violet-300 font-medium hover:bg-violet/15 hover:border-violet/30 border border-transparent transition-all duration-200"
        title="Open ForensiX AI Bot"
      >
        <Bot className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Ask AI</span>
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent border border-bg-deep flex items-center justify-center">
          <Sparkles className="w-1.5 h-1.5 text-white" />
        </span>
      </button>

      {/* Notifications */}
      <button
        onClick={() => setNotifPulse(false)}
        className="relative w-8 h-8 glass rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
      >
        <Bell className="w-4 h-4" />
        {notifPulse && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary pulse-dot" />}
      </button>
    </header>
  );
}
