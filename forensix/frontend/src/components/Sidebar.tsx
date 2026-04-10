import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Crosshair, FolderOpen, LogOut,
  ShieldAlert, Activity, ChevronRight, Database
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',     path: '/dashboard', badge: null },
  { icon: Crosshair,       label: 'New Analysis',  path: '/analyze',   badge: 'AI' },
  { icon: FolderOpen,      label: 'Case Archives', path: '/cases',     badge: null },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('fx_token');
    localStorage.removeItem('fx_agent');
    navigate('/login');
  };

  return (
    <aside className="w-64 flex flex-col h-full shrink-0 glass border-r border-white/5 relative z-20">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-blue">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent border-2 border-bg-deep pulse-dot" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-widest gradient-text">ForensiX</div>
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Field System v2.0</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="text-[10px] text-slate-600 uppercase tracking-[0.15em] font-semibold px-3 mb-3">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onMouseEnter={() => setHovered(item.path)}
            onMouseLeave={() => setHovered(null)}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
               ${isActive
                 ? 'bg-primary/15 text-primary border border-primary/25 shadow-glow-blue'
                 : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
               }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator line */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                )}
                <item.icon className={`w-4.5 h-4.5 transition-colors ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                {item.badge && (
                  <span className="badge badge-blue">{item.badge}</span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary/60" />}
              </>
            )}
          </NavLink>
        ))}

        <div className="text-[10px] text-slate-600 uppercase tracking-[0.15em] font-semibold px-3 mt-6 mb-3">System</div>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500">
          <Database className="w-4.5 h-4.5" />
          <span className="text-sm">Local Database</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-accent pulse-dot" />
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500">
          <Activity className="w-4.5 h-4.5" />
          <span className="text-sm">AI Modules</span>
          <span className="ml-auto text-[10px] text-accent font-mono">4/4</span>
        </div>
      </nav>

      {/* Agent Profile + Logout */}
      <div className="p-3 border-t border-white/5">
        <div className="glass rounded-xl p-3 mb-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-sm">
            {(localStorage.getItem('fx_agent') || 'AG')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {localStorage.getItem('fx_agent') || 'Field Agent'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">AUTHORIZED</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn-ghost w-full justify-center text-danger/70 hover:text-danger hover:bg-danger/10 hover:border-danger/20 text-sm py-2"
        >
          <LogOut className="w-4 h-4" />
          Secure Logout
        </button>
      </div>
    </aside>
  );
}
