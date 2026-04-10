import React from 'react';
import { Detection, WeaponResult } from '../types';

interface Props {
  image_url: string | null;
  detections: Detection[];
  dimensions?: { width: number; height: number };
}

/**
 * Renders evidence image with YOLO bounding box overlays drawn via SVG.
 */
export default function EvidenceViewer({ image_url, detections, dimensions }: Props) {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const src = image_url ? `${API_BASE}${image_url}` : null;

  const weaponColors: Record<string, string> = {
    knife: '#EF4444',
    gun: '#EF4444',
    pistol: '#EF4444',
    rifle: '#EF4444',
    'baseball bat': '#F59E0B',
    scissors: '#F59E0B',
    default: '#3B82F6',
  };

  const getColor = (label: string) =>
    weaponColors[label.toLowerCase()] || weaponColors.default;

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center min-h-[300px]">
      {src ? (
        <div className="relative w-full">
          <img
            src={src}
            crossOrigin="anonymous"
            alt="Evidence"
            className="w-full object-contain max-h-[500px] rounded-xl"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {/* Overlay SVG boxes — proportional */}
          {detections.length > 0 && dimensions && (
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {detections.map((d, i) => {
                const [x1, y1, x2, y2] = d.box;
                const w = x2 - x1;
                const h = y2 - y1;
                const col = getColor(d.label);
                return (
                  <g key={i}>
                    <rect
                      x={x1} y={y1} width={w} height={h}
                      fill="none"
                      stroke={col}
                      strokeWidth={3}
                      rx={4}
                      style={{ filter: `drop-shadow(0 0 4px ${col})` }}
                    />
                    {/* Label chip */}
                    <rect x={x1} y={y1 - 22} width={Math.max(w, 80)} height={22} fill={col} rx={4} fillOpacity={0.9} />
                    <text x={x1 + 6} y={y1 - 6} fill="white" fontSize={12} fontFamily="JetBrains Mono, monospace" fontWeight="600">
                      {d.label} {(d.confidence * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <span className="text-2xl">🖼️</span>
          </div>
          <p className="text-sm">No evidence image stored</p>
          <p className="text-xs mt-1">Upload evidence via New Analysis</p>
        </div>
      )}
    </div>
  );
}
