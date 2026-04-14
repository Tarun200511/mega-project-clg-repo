import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen, ShieldAlert, Droplets, ScanFace, AlertTriangle,
  Crosshair, TrendingUp, ArrowRight, BarChart2, Clock,
  Zap, Activity, Brain
} from 'lucide-react';
import { getCases, getCaseStats } from '../api';
import { Case, CaseStats } from '../types';
import CaseCard from '../components/CaseCard';
import ThreatGauge from '../components/ThreatGauge';

// ── Animated Counter ───────────────────────────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 20);
    const t = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(start);
    }, 40);
    return () => clearInterval(t);
  }, [value]);
  return <>{display}</>;
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, sublabel, delay = 0
}: {
  label: string; value: number; icon: React.FC<any>;
  color: string; sublabel?: string; delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border card-hover"
      style={{
        background: `linear-gradient(135deg, rgba(17,24,39,0.9), rgba(26,34,53,0.8))`,
        borderColor: `${color}22`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `all 0.4s ease ${delay}ms`,
      }}
    >
      {/* Accent top bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{ background: color }} />
      {/* Shimmer on hover */}
      <div className="absolute inset-0 shimmer-line opacity-0 hover:opacity-100 transition-opacity" />

      <div className="p-5 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-xl" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <TrendingUp className="w-4 h-4 text-slate-600" />
        </div>
        <div className="text-3xl font-black text-white font-mono stat-number">
          <AnimatedNumber value={value} />
        </div>
        <div className="text-sm text-slate-400 mt-1 font-medium">{label}</div>
        {sublabel && <div className="text-[11px] mt-0.5" style={{ color: `${color}99` }}>{sublabel}</div>}
      </div>
    </div>
  );
}

// ── Activity Item ─────────────────────────────────────────────────────────────
function ActivityItem({ case_, index }: { case_: Case; index: number }) {
  const threatPct = case_.threat_level;
  const col = threatPct >= 75 ? '#EF4444' : threatPct >= 40 ? '#F59E0B' : '#10B981';

  return (
    <Link
      to={`/case/${case_.id}`}
      className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/4 transition-all duration-200 group border border-transparent hover:border-white/8"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Threat ring */}
      <div className="shrink-0 relative w-10 h-10">
        <svg viewBox="0 0 40 40" className="-rotate-90 w-10 h-10">
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <circle cx="20" cy="20" r="16" fill="none" stroke={col} strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 16}`}
            strokeDashoffset={`${2 * Math.PI * 16 * (1 - threatPct / 100)}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 3px ${col})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold font-mono" style={{ color: col }}>
          {threatPct.toFixed(0)}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500">{case_.case_number}</span>
          {case_.weapon_detected && <ShieldAlert className="w-3 h-3 text-danger" />}
          {case_.blood_detected  && <Droplets className="w-3 h-3 text-red-400" />}
          {case_.face_detected   && <ScanFace className="w-3 h-3 text-accent" />}
        </div>
        <div className="text-sm font-medium text-white truncate">{case_.title}</div>
        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
          <Clock className="w-2.5 h-2.5" />
          {new Date(case_.created_at).toLocaleString()}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`badge text-[9px] ${case_.status === 'Open' ? 'badge-blue' : case_.status === 'Closed' ? 'badge-gray' : 'badge-amber'}`}>
          {case_.status}
        </span>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-primary shrink-0 transition-colors" />
      </div>
    </Link>
  );
}

// ── Activity Ticker ───────────────────────────────────────────────────────────
function ActivityTicker() {
  const items = [
    '🔴 YOLOv8 weapon scan complete — 1 threat object found',
    '🩸 Blood spatter HSV analysis running on evidence pool',
    '👣 Footprint tread ORB matching against 847 known treads',
    '🔍 Biometric face lookup against suspect database',
    '📊 Threat score recalculated — Level: HIGH',
    '✅ Case FX-A01B9DC2 saved to archive',
    '🛰️ AI pipeline initialized — all 4 modules ONLINE',
  ];
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-white/5 bg-primary/3 py-2">
      <div className="ticker-track flex gap-12 whitespace-nowrap" style={{ width: 'max-content' }}>
        {doubled.map((item, i) => (
          <span key={i} className="text-[11px] text-slate-500 font-mono">{item}</span>
        ))}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [cases, setCases]   = useState<Case[]>([]);
  const [stats, setStats]   = useState<CaseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCases({ limit: 20 } as any), getCaseStats()])
      .then(([cRes, sRes]) => {
        setCases(cRes.data);
        setStats(sRes.data);
      })
      .catch(() => {
        // Demo fallback
        const demo: Case = {
          id: 1, case_number: 'FX-A01B9DC2', title: 'Warehouse Incident — Block 7',
          status: 'Open', priority: 'High',
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          weapon_detected: true, blood_detected: true, face_detected: false, threat_level: 78,
        };
        const demo2: Case = {
          id: 2, case_number: 'FX-C93D21EF', title: 'Downtown Alley — Suspect Fled',
          status: 'Pending', priority: 'Critical',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString(),
          weapon_detected: true, blood_detected: false, face_detected: true, threat_level: 91,
        };
        const demo3: Case = {
          id: 3, case_number: 'FX-B44A72CF', title: 'Park Evidence — Boot Match Found',
          status: 'Open', priority: 'Medium',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date().toISOString(),
          weapon_detected: false, blood_detected: true, face_detected: false, threat_level: 45,
        };
        setCases([demo, demo2, demo3]);
        setStats({ total: 3, open: 2, closed: 0, weapon_cases: 2, blood_cases: 2, face_cases: 1, high_threat: 2 });
      })
      .finally(() => setLoading(false));
  }, []);

  const avgThreat = cases.length
    ? cases.reduce((s, c) => s + c.threat_level, 0) / cases.length
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-white">Field Intelligence Dashboard</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Real-time AI forensics overview · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl glass text-xs font-mono text-accent border border-accent/20">
            <Zap className="w-3.5 h-3.5" />
            All Systems Nominal
          </div>
          <Link to="/analyze" className="btn-primary">
            <Crosshair className="w-4 h-4" />
            Execute New Analysis
          </Link>
        </div>
      </div>

      {/* Activity Ticker */}
      <div className="rounded-xl overflow-hidden">
        <ActivityTicker />
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Cases"    value={stats.total}        icon={FolderOpen}    color="#3B82F6" sublabel={`${stats.open} currently open`} delay={0}   />
          <StatCard label="Weapons Found"  value={stats.weapon_cases} icon={ShieldAlert}   color="#EF4444" sublabel="threats detected"               delay={100} />
          <StatCard label="Blood Detected" value={stats.blood_cases}  icon={Droplets}      color="#F87171" sublabel="spatter patterns found"         delay={200} />
          <StatCard label="High Threat"    value={stats.high_threat}  icon={AlertTriangle} color="#F59E0B" sublabel="threat score ≥ 70%"             delay={300} />
        </div>
      )}

      {/* Main content split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: threat gauge + module status */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          {/* Threat gauge */}
          <div
            className="rounded-2xl p-6 border border-white/5 flex flex-col items-center gap-4"
            style={{ background: 'linear-gradient(135deg, rgba(17,24,39,0.9), rgba(30,45,70,0.7))' }}
          >
            <div className="text-xs text-slate-500 font-mono uppercase tracking-widest self-start flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              Average Threat Level
            </div>
            <ThreatGauge value={avgThreat} sublabel={`across ${cases.length} case${cases.length !== 1 ? 's' : ''}`} />
          </div>

          {/* Module status */}
          <div className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(17,24,39,0.85)' }}>
            <div className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Module Status
            </div>
            {[
              { name: 'YOLOv8 Detector',    status: 'ONLINE',  color: '#10B981', pct: 98 },
              { name: 'OpenCV Blood HSV',   status: 'ONLINE',  color: '#10B981', pct: 100 },
              { name: 'ORB Footprint',      status: 'ONLINE',  color: '#10B981', pct: 96 },
              { name: 'Face Recognition',   status: 'STANDBY', color: '#F59E0B', pct: 72 },
            ].map((m) => (
              <div key={m.name} className="py-2.5 border-b border-white/4 last:border-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-300">{m.name}</span>
                  <span className="text-[10px] font-mono font-bold" style={{ color: m.color }}>{m.status}</span>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${m.pct}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: recent activity */}
        <div className="xl:col-span-2 rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(17,24,39,0.85)' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Recent Activity</span>
              <span className="badge badge-blue text-[10px]">{cases.length}</span>
            </div>
            <Link to="/cases" className="text-xs text-primary hover:text-primary/70 transition-colors flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Loading cases…</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No cases yet.</p>
              <Link to="/analyze" className="text-primary text-sm hover:underline mt-1 inline-block">
                Run first analysis →
              </Link>
            </div>
          ) : (
            <div className="p-2">
              {cases.slice(0, 8).map((c, i) => <ActivityItem key={c.id} case_={c} index={i} />)}
            </div>
          )}
        </div>
      </div>

      {/* Recent cases grid */}
      {cases.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-primary" />
              Recent Cases
            </h2>
            <Link to="/cases" className="btn-ghost text-xs py-1.5 px-3">See All</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.slice(0, 6).map(c => <CaseCard key={c.id} case_={c} />)}
          </div>
        </div>
      )}
    </div>
  );
}
