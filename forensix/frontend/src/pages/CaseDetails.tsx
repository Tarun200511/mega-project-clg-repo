import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Shield, Droplets, Footprints, ScanFace,
  MapPin, User, Clock, Flag, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp, Trash2, Edit3, Save, X, Bot, Sparkles
} from 'lucide-react';
import { getCase, generateReport, deleteCase, updateCase } from '../api';
import { Case } from '../types';
import ThreatGauge from '../components/ThreatGauge';
import EvidenceViewer from '../components/EvidenceViewer';
import ForensiXBot, { CaseContext } from '../components/ForensiXBot';

// ── AI Result Section ─────────────────────────────────────────────────────────
function Section({
  title, icon: Icon, iconColor, children, defaultOpen = true
}: {
  title: string; icon: React.FC<any>; iconColor: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/5">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}30` }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
          <span className="font-semibold text-white text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-white/5">{children}</div>}
    </div>
  );
}

// ── Weapon Section Content ────────────────────────────────────────────────────
function WeaponSection({ data }: { data: any }) {
  if (!data) return <p className="text-slate-500 text-sm pt-4">No weapon data available.</p>;
  const dets = data.detections || [];
  const weapons = dets.filter((d: any) => d.is_weapon);

  return (
    <div className="pt-4 space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 bg-white/4 rounded-xl p-3 text-center">
          <div className="text-2xl font-black font-mono text-white">{data.total_objects}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Objects</div>
        </div>
        <div className="flex-1 bg-danger/8 border border-danger/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-black font-mono text-danger">{data.weapons_found || weapons.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Weapons</div>
        </div>
        <div className="flex-1 bg-white/4 rounded-xl p-3 text-center">
          <div className="text-xs font-mono text-slate-300">{data.model || 'YOLOv8n'}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Model</div>
        </div>
      </div>

      {dets.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-left">
                <th className="pb-2 pr-3 font-medium">Label</th>
                <th className="pb-2 pr-3 font-medium text-center">Threat</th>
                <th className="pb-2 pr-3 font-medium text-right">Confidence</th>
                <th className="pb-2 font-medium">Box</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {dets.map((d: any, i: number) => (
                <tr key={i} className="hover:bg-white/3">
                  <td className="py-2 pr-3 font-medium text-white capitalize">{d.label}</td>
                  <td className="py-2 pr-3 text-center">
                    {d.is_weapon
                      ? <span className="badge badge-red">THREAT</span>
                      : <span className="badge badge-gray">Object</span>
                    }
                  </td>
                  <td className="py-2 pr-3 text-right font-mono text-primary">{(d.confidence * 100).toFixed(1)}%</td>
                  <td className="py-2 font-mono text-slate-500 text-[10px]">[{d.box?.join(', ')}]</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-500 text-sm">No object detections found.</p>
      )}
    </div>
  );
}

// ── Blood Section Content ──────────────────────────────────────────────────────
function BloodSection({ data }: { data: any }) {
  if (!data) return <p className="text-slate-500 text-sm pt-4">No blood analysis data.</p>;

  const hasBlood = data.spots_count > 0 && data.pattern !== 'None detected';

  return (
    <div className="pt-4 space-y-3">
      <div className={`rounded-xl p-4 flex items-center gap-4 ${hasBlood ? 'glass-danger' : 'bg-white/4'}`}>
        <Droplets className={`w-8 h-8 shrink-0 ${hasBlood ? 'text-danger' : 'text-slate-500'}`} />
        <div>
          <div className="font-semibold text-white">{data.pattern}</div>
          <div className="text-xs text-slate-400 mt-0.5">Pattern Classification</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/4 rounded-xl p-3 text-center">
          <div className="text-xl font-black font-mono text-white">{data.spots_count}</div>
          <div className="text-[10px] text-slate-400">Spots</div>
        </div>
        <div className="bg-white/4 rounded-xl p-3 text-center">
          <div className="text-xl font-black font-mono text-white">{data.average_size?.toFixed(1)}</div>
          <div className="text-[10px] text-slate-400">Avg Size (px²)</div>
        </div>
        <div className="bg-white/4 rounded-xl p-3 text-center">
          <div className="text-xl font-black font-mono text-white">{data.coverage_pct?.toFixed(3)}%</div>
          <div className="text-[10px] text-slate-400">Coverage</div>
        </div>
      </div>
      {data.top_regions?.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Top Regions</div>
          {data.top_regions.slice(0, 4).map((r: any, i: number) => (
            <div key={i} className="flex justify-between text-xs text-slate-400 px-2 py-1.5 rounded-lg hover:bg-white/4">
              <span className="font-mono text-slate-300">#{i+1}</span>
              <span>({r.x}, {r.y}) → {r.w}×{r.h}</span>
              <span className="text-danger font-mono">{r.area.toFixed(0)}px²</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Footprint Section ──────────────────────────────────────────────────────────
function FootprintSection({ data }: { data: any }) {
  if (!data) return <p className="text-slate-500 text-sm pt-4">No footprint data.</p>;
  return (
    <div className="pt-4 space-y-3">
      <div className={`rounded-xl p-4 flex items-center gap-4 ${data.match ? 'glass-success' : 'bg-white/4'}`}>
        <Footprints className={`w-7 h-7 shrink-0 ${data.match ? 'text-accent' : 'text-slate-500'}`} />
        <div className="flex-1">
          <div className="font-semibold text-white">{data.match ? `Match: ${data.best_match}` : 'No Tread Match'}</div>
          <div className="text-xs text-slate-400">{data.message || `Similarity: ${data.similarity?.toFixed(1)}%`}</div>
        </div>
        {data.match && (
          <div className="text-2xl font-black font-mono text-accent">{data.similarity?.toFixed(0)}%</div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/4 rounded-xl p-3">
          <div className="text-[10px] text-slate-500 mb-1">Keypoints Detected</div>
          <div className="font-mono font-bold text-white">{data.keypoints_detected || 0}</div>
        </div>
        <div className="bg-white/4 rounded-xl p-3">
          <div className="text-[10px] text-slate-500 mb-1">Database Size</div>
          <div className="font-mono font-bold text-white">{data.database_size || 0} treads</div>
        </div>
      </div>
      {data.all_scores && Object.keys(data.all_scores).length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">All Scores</div>
          {Object.entries(data.all_scores).map(([name, score]: [string, any]) => (
            <div key={name} className="flex items-center gap-2">
              <span className="text-xs text-slate-300 flex-1 truncate">{name}</span>
              <div className="w-24 h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${score}%` }} />
              </div>
              <span className="text-xs font-mono text-accent w-10 text-right">{score}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Face Section ───────────────────────────────────────────────────────────────
function FaceSection({ data }: { data: any }) {
  if (!data) return <p className="text-slate-500 text-sm pt-4">No face data.</p>;
  const faces = data.faces || [];
  return (
    <div className="pt-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/4 rounded-xl p-3 text-center">
          <div className="text-xl font-black font-mono text-white">{data.faces_detected || 0}</div>
          <div className="text-[10px] text-slate-400">Faces Found</div>
        </div>
        <div className="bg-white/4 rounded-xl p-3 text-center">
          <div className="text-xl font-black font-mono text-white">{data.suspects_in_db || 0}</div>
          <div className="text-[10px] text-slate-400">In Suspect DB</div>
        </div>
      </div>
      {faces.length === 0 ? (
        <p className="text-slate-500 text-sm">No faces detected in this image.</p>
      ) : (
        <div className="space-y-2">
          {faces.map((f: any, i: number) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${f.matched ? 'glass-danger' : 'bg-white/4'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${f.matched ? 'bg-danger/20' : 'bg-white/8'}`}>
                {f.matched ? '🚨' : '❓'}
              </div>
              <div className="flex-1">
                <div className={`font-semibold text-sm ${f.matched ? 'text-danger' : 'text-slate-300'}`}>{f.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">Box: [{f.box?.join(', ')}]</div>
              </div>
              {f.confidence > 0 && (
                <div className="text-lg font-black font-mono text-danger">{f.confidence.toFixed(0)}%</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main CaseDetails Page ─────────────────────────────────────────────────────
export default function CaseDetails() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [editStatus, setEditStatus] = useState('Open');
  const [editPriority, setEditPriority] = useState('Medium');
  const [botExternalOpen, setBotExternalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    getCase(Number(id))
      .then(res => { setCaseData(res.data); setEditStatus(res.data.status); setEditPriority(res.data.priority); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleExportPDF = async () => {
    if (!caseData) return;
    setExporting(true);
    try {
      const res = await generateReport(caseData.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url; a.download = `ForensiX_${caseData.case_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Report generation failed. Check backend.');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!caseData || !confirm(`Delete case ${caseData.case_number}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteCase(caseData.id);
      navigate('/cases');
    } catch { setDeleting(false); }
  };

  const handleSaveEdit = async () => {
    if (!caseData) return;
    await updateCase(caseData.id, { status: editStatus, priority: editPriority });
    setCaseData(prev => prev ? { ...prev, status: editStatus, priority: editPriority } : prev);
    setEditing(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="space-y-3 text-center">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full spin mx-auto" />
        <p className="text-slate-400 text-sm">Loading case data…</p>
      </div>
    </div>
  );

  if (!caseData) return (
    <div className="text-center py-20">
      <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-3" />
      <p className="text-white font-semibold">Case not found</p>
      <Link to="/cases" className="text-primary text-sm mt-2 inline-block hover:underline">← Back to cases</Link>
    </div>
  );

  const ai = caseData.ai_results;
  const dets = ai?.weapon_detection?.detections || [];
  const dims = ai?.image_dimensions;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/cases" className="btn-ghost py-2 px-3">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="font-mono text-[11px] text-primary tracking-widest mb-0.5">{caseData.case_number}</div>
            <h1 className="text-xl font-bold text-white">{caseData.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {editing ? (
            <>
              <button onClick={handleSaveEdit} className="btn-primary py-2 px-4 text-sm"><Save className="w-4 h-4" /> Save</button>
              <button onClick={() => setEditing(false)} className="btn-ghost py-2 px-3"><X className="w-4 h-4" /></button>
            </>
          ) : (
            <>
              {/* Ask AI button */}
              <button
                onClick={() => setBotExternalOpen(true)}
                className="flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold border border-violet/30 bg-violet/10 text-violet-300 hover:bg-violet/20 hover:border-violet/50 transition-all duration-200"
              >
                <Bot className="w-4 h-4" />
                Ask AI
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </button>
              <button onClick={() => setEditing(true)} className="btn-ghost py-2 px-3 text-sm"><Edit3 className="w-4 h-4" /> Edit</button>
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="btn-ghost py-2 px-4 text-sm"
              >
                {exporting ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full spin" /> Generating…</>
                           : <><Download className="w-4 h-4" /> Export PDF</>}
              </button>
              <button onClick={handleDelete} disabled={deleting} className="btn-ghost py-2 px-3 text-danger hover:bg-danger/10 hover:border-danger/20 text-sm">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Metadata cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-3">
          <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Created</div>
          <div className="text-xs font-mono text-white">{new Date(caseData.created_at).toLocaleString()}</div>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> Location</div>
          <div className="text-xs font-mono text-white truncate">{caseData.location || '—'}</div>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><User className="w-2.5 h-2.5" /> Investigator</div>
          <div className="text-xs font-mono text-white truncate">{caseData.investigator || '—'}</div>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Flag className="w-2.5 h-2.5" /> Status / Priority</div>
          {editing ? (
            <div className="space-y-1">
              <select className="w-full bg-bg-surface text-white text-xs rounded px-1 py-0.5" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                {['Open','Pending','Closed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="w-full bg-bg-surface text-white text-xs rounded px-1 py-0.5" value={editPriority} onChange={e => setEditPriority(e.target.value)}>
                {['Low','Medium','High','Critical'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          ) : (
            <div className="flex gap-1 flex-wrap">
              <span className={`badge ${caseData.status === 'Open' ? 'badge-blue' : caseData.status === 'Closed' ? 'badge-gray' : 'badge-amber'} text-[9px]`}>{caseData.status}</span>
              <span className={`badge ${caseData.priority === 'Critical' ? 'badge-red' : caseData.priority === 'High' ? 'badge-amber' : caseData.priority === 'Medium' ? 'badge-blue' : 'badge-green'} text-[9px]`}>{caseData.priority}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left: Evidence + Threat */}
        <div className="xl:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-4 border border-white/5">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-3">Evidence Image</div>
            <EvidenceViewer
              image_url={caseData.evidence_image_url || null}
              detections={dets}
              dimensions={dims}
            />
          </div>

          <div className="glass rounded-2xl p-5 border border-white/5 flex items-center gap-6 justify-center">
            <ThreatGauge value={caseData.threat_level} />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Shield className={`w-4 h-4 ${caseData.weapon_detected ? 'text-danger' : 'text-slate-600'}`} />
                <span className={caseData.weapon_detected ? 'text-danger font-medium' : 'text-slate-500'}>Weapon Detected</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className={`w-4 h-4 ${caseData.blood_detected ? 'text-red-400' : 'text-slate-600'}`} />
                <span className={caseData.blood_detected ? 'text-red-400 font-medium' : 'text-slate-500'}>Blood Detected</span>
              </div>
              <div className="flex items-center gap-2">
                <ScanFace className={`w-4 h-4 ${caseData.face_detected ? 'text-accent' : 'text-slate-600'}`} />
                <span className={caseData.face_detected ? 'text-accent font-medium' : 'text-slate-500'}>Face Matched</span>
              </div>
            </div>
          </div>

          {caseData.description && (
            <div className="glass rounded-2xl p-4 border border-white/5">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Notes</div>
              <p className="text-sm text-slate-300 leading-relaxed">{caseData.description}</p>
            </div>
          )}
        </div>

        {/* Right: AI Results */}
        <div className="xl:col-span-3 space-y-4">
          <Section title="Weapon Detection (YOLOv8)" icon={Shield} iconColor="#EF4444">
            <WeaponSection data={ai?.weapon_detection} />
          </Section>

          <Section title="Blood Spatter Analysis (OpenCV)" icon={Droplets} iconColor="#F87171">
            <BloodSection data={ai?.blood_analysis} />
          </Section>

          <Section title="Footprint / Tread Match (ORB)" icon={Footprints} iconColor="#3B82F6" defaultOpen={false}>
            <FootprintSection data={ai?.footprint_match} />
          </Section>

          <Section title="Biometric Face Recognition" icon={ScanFace} iconColor="#10B981" defaultOpen={false}>
            <FaceSection data={ai?.face_recognition} />
          </Section>
        </div>
      </div>

      {/* ── ForensiX AI Bot with case context ── */}
      <ForensiXBot
        caseContext={{
          caseNumber: caseData.case_number,
          title: caseData.title,
          description: caseData.description,
          threatLevel: caseData.threat_level,
          weaponDetected: caseData.weapon_detected,
          bloodDetected: caseData.blood_detected,
          faceDetected: caseData.face_detected,
          bloodPattern: ai?.blood_analysis?.pattern,
          weaponsCount: ai?.weapon_detection?.weapons_found || 0,
          location: caseData.location,
          status: caseData.status,
          footprintMatch: ai?.footprint_match?.match ? `Match: ${ai.footprint_match.best_match} (${ai.footprint_match.similarity?.toFixed(1)}%)` : undefined,
          faceMatches: ai?.face_recognition?.faces?.filter((f: any) => f.matched).map((f: any) => `${f.name} (${f.confidence?.toFixed(0)}%)`).join(', '),
        }}
        externalOpen={botExternalOpen}
        onExternalOpenConsumed={() => setBotExternalOpen(false)}
      />
    </div>
  );
}
