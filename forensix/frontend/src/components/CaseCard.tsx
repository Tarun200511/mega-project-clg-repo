import React from 'react';
import { Case } from '../types';
import { Shield, Droplets, ScanFace, Footprints, ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

function ThreatBadge({ level }: { level: number }) {
  if (level >= 75) return <span className="badge badge-red">Critical</span>;
  if (level >= 40) return <span className="badge badge-amber">Elevated</span>;
  return <span className="badge badge-green">Low</span>;
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    Critical: 'bg-danger',
    High: 'bg-amber',
    Medium: 'bg-primary',
    Low: 'bg-accent',
  };
  return <span className={`w-2 h-2 rounded-full ${colors[priority] || 'bg-slate-500'}`} />;
}

interface Props {
  case_: Case;
  onDelete?: (id: number) => void;
}

export default function CaseCard({ case_, onDelete }: Props) {
  const threatPct = Math.min(case_.threat_level, 100);
  const threatColor = threatPct >= 75 ? '#EF4444' : threatPct >= 40 ? '#F59E0B' : '#10B981';

  return (
    <div className="glass rounded-2xl overflow-hidden card-hover border border-white/5 group">
      {/* Top threat bar */}
      <div className="threat-bar rounded-none">
        <div
          className="threat-bar-fill"
          style={{ width: `${threatPct}%`, background: threatColor, boxShadow: `0 0 8px ${threatColor}60` }}
        />
      </div>

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PriorityDot priority={case_.priority} />
              <span className="text-[11px] font-mono text-slate-400 tracking-wider">{case_.case_number}</span>
            </div>
            <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">{case_.title}</h3>
          </div>
          <ThreatBadge level={case_.threat_level} />
        </div>

        {/* Location & date */}
        {case_.location && (
          <p className="text-xs text-slate-500 mb-3 truncate">{case_.location}</p>
        )}

        {/* Indicator row */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center gap-1.5 text-xs ${case_.weapon_detected ? 'text-danger' : 'text-slate-600'}`}>
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Weapon</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${case_.blood_detected ? 'text-red-400' : 'text-slate-600'}`}>
            <Droplets className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Blood</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${case_.face_detected ? 'text-accent' : 'text-slate-600'}`}>
            <ScanFace className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Face</span>
          </div>

          <div className="ml-auto text-[10px] text-slate-500 font-mono">
            {new Date(case_.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Threat bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Threat Level</span>
            <span style={{ color: threatColor }}>{threatPct.toFixed(0)}%</span>
          </div>
          <div className="threat-bar">
            <div
              className="threat-bar-fill"
              style={{ width: `${threatPct}%`, background: `linear-gradient(90deg, ${threatColor}aa, ${threatColor})` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <span className={`badge ${case_.status === 'Open' ? 'badge-blue' : case_.status === 'Closed' ? 'badge-gray' : 'badge-amber'}`}>
            {case_.status}
          </span>
          <Link
            to={`/case/${case_.id}`}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary transition-colors group/link"
          >
            View Report
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
