import React from 'react';

interface Props {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export default function ThreatGauge({
  value,
  max = 100,
  size = 120,
  strokeWidth = 9,
  color,
  label,
  sublabel,
}: Props) {
  const pct = Math.min(value / max, 1);
  const r   = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct);

  const gaugeColor = color || (value >= 75 ? '#EF4444' : value >= 40 ? '#F59E0B' : '#10B981');
  const glowColor  = value >= 75 ? 'rgba(239,68,68,0.5)' : value >= 40 ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)';
  const levelText  = value >= 75 ? 'CRITICAL' : value >= 40 ? 'ELEVATED' : 'LOW RISK';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              filter: `drop-shadow(0 0 6px ${glowColor})`,
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white font-mono leading-none">
            {value.toFixed(0)}
          </span>
          <span className="text-[9px] text-slate-400 font-mono mt-0.5">THREAT</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[10px] font-bold tracking-widest" style={{ color: gaugeColor }}>
          {levelText}
        </div>
        {sublabel && <div className="text-[10px] text-slate-500 mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
}
