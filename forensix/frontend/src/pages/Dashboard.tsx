import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen, ShieldAlert, Droplets, ScanFace, AlertTriangle,
  Crosshair, TrendingUp, ArrowRight, BarChart2, Clock
} from 'lucide-react';
import { getCases, getCaseStats } from '../api';
import { Case, CaseStats } from '../types';
import CaseCard from '../components/CaseCard';
import ThreatGauge from '../components/ThreatGauge';

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, sublabel
}: {
  label: string; value: string | number; icon: React.FC<any>;
  color: string; sublabel?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/5 card-hover relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10`}
        style={{ background: color }} />
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl`} style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <TrendingUp className="w-4 h-4 text-slate-600" />
      </div>
      <div className="text-3xl font-black text-white font-mono">{value}</div>
      <div className="text-sm text-slate-400 mt-1 font-medium">{label}</div>
      {sublabel && <div className="text-[11px] text-slate-600 mt-0.5">{sublabel}</div>}
    </div>
  );
}

// ── Activity Item ─────────────────────────────────────────────────────────────
function ActivityItem({ case_ }: { case_: Case }) {
  const threatPct = case_.threat_level;
  const col = threatPct >= 75 ? '#EF4444' : threatPct >= 40 ? '#F59E0B' : '#10B981';

  return (
    <Link to={`/case/${case_.id}`}
      className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/4 transition-colors group border border-transparent hover:border-white/5"
    >
      {/* Threat ring */}
      <div className="shrink-0 relative w-10 h-10">
        <svg viewBox="0 0 40 40" className="-rotate-90 w-10 h-10">
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <circle cx="20" cy="20" r="16" fill="none" stroke={col} strokeWidth="3"
            strokeDasharray={`${2*Math.PI*16}`}
            strokeDashoffset={`${2*Math.PI*16*(1 - threatPct/100)}`}
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

      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-primary shrink-0 transition-colors" />
    </Link>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [cases, setCases]   = useState<Case[]>([]);
  const [stats, setStats]   = useState<CaseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCases({ limit: 20 }), getCaseStats()])
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
        setCases([demo]);
        setStats({ total: 1, open: 1, closed: 0, weapon_cases: 1, blood_cases: 1, face_cases: 0, high_threat: 1 });
      })
      .finally(() => setLoading(false));
  }, []);

  const avgThreat = cases.length
    ? cases.reduce((s, c) => s + c.threat_level, 0) / cases.length
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Field Intelligence Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time overview of active forensic investigations.
          </p>
        </div>
        <Link to="/analyze" className="btn-primary">
          <Crosshair className="w-4 h-4" />
          Execute New Analysis
        </Link>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Cases"    value={stats.total}         icon={FolderOpen}  color="#3B82F6" sublabel={`${stats.open} open`} />
          <StatCard label="Weapons Found"  value={stats.weapon_cases}  icon={ShieldAlert} color="#EF4444" sublabel="across evidence" />
          <StatCard label="Blood Detected" value={stats.blood_cases}   icon={Droplets}    color="#F87171" sublabel="cases with spatter" />
          <StatCard label="High Threat"    value={stats.high_threat}   icon={AlertTriangle} color="#F59E0B" sublabel="threat score ≥70" />
        </div>
      )}

      {/* Main content split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: threat gauge + info */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col items-center gap-4">
            <div className="text-xs text-slate-500 font-mono uppercase tracking-widest self-start">Average Threat Level</div>
            <ThreatGauge value={avgThreat} sublabel={`across ${cases.length} cases`} />
          </div>

          <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-4">Module Status</div>
            {[
              { name: 'YOLOv8 Detector', status: 'ONLINE', color: '#10B981' },
              { name: 'OpenCV Blood HSV', status: 'ONLINE', color: '#10B981' },
              { name: 'ORB Footprint',    status: 'ONLINE', color: '#10B981' },
              { name: 'Face Recognition', status: 'STANDBY', color: '#F59E0B' },
            ].map((m) => (
              <div key={m.name} className="flex items-center justify-between py-2.5 border-b border-white/4 last:border-0">
                <span className="text-sm text-slate-300">{m.name}</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: m.color }} >{m.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: recent activity */}
        <div className="xl:col-span-2 glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Recent Activity</span>
            </div>
            <Link to="/cases" className="text-xs text-primary hover:text-primary/70 transition-colors flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-slate-500 text-sm">Loading cases...</div>
          ) : cases.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No cases yet.</p>
              <Link to="/analyze" className="text-primary text-sm hover:underline mt-1 inline-block">Run first analysis →</Link>
            </div>
          ) : (
            <div className="p-2">
              {cases.slice(0, 8).map(c => <ActivityItem key={c.id} case_={c} />)}
            </div>
          )}
        </div>
      </div>

      {/* Recent cases grid */}
      {cases.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FolderOpen className="w-4.5 h-4.5 text-primary" />
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
