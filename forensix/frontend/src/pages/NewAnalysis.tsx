import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Cpu, X, Camera, MapPin, User, Flag, CheckCircle,
  AlertTriangle, Loader2, ChevronDown, Info
} from 'lucide-react';
import { analyzeEvidence, createCase } from '../api';
import { AIResults } from '../types';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

// ── Live Analysis Overlay ───────────────────────────────────────────────────
function AnalysisOverlay({ stage }: { stage: number }) {
  const stages = [
    { label: 'Initializing AI pipeline…',   icon: '🔧' },
    { label: 'YOLOv8 weapon scan…',          icon: '🎯' },
    { label: 'Blood spatter analysis…',      icon: '🩸' },
    { label: 'ORB footprint matching…',      icon: '👣' },
    { label: 'Face recognition lookup…',     icon: '🔍' },
    { label: 'Compiling threat score…',      icon: '📊' },
  ];

  return (
    <div className="absolute inset-0 bg-bg-deep/85 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-20">
      {/* Radar animation */}
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-2 rounded-full border border-primary/15" />
        <div className="absolute inset-4 rounded-full border border-primary/10" />
        <div
          className="absolute bottom-1/2 left-1/2 w-10 h-0.5 bg-gradient-to-r from-primary to-transparent origin-left radar-sweep"
          style={{ transformOrigin: '4px 50%' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl">{stages[stage]?.icon || '✅'}</span>
        </div>
      </div>

      <div className="font-mono text-primary text-sm font-semibold mb-4 cursor-blink">
        {stages[stage]?.label || 'Finalizing…'}
      </div>

      {/* Progress bars */}
      <div className="w-64 space-y-2 px-4">
        {stages.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${i < stage ? 'bg-accent' : i === stage ? 'bg-primary pulse-dot' : 'bg-slate-700'}`} />
            <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${i < stage ? 'bg-accent' : i === stage ? 'bg-primary' : ''}`}
                style={{ width: i < stage ? '100%' : i === stage ? '60%' : '0%' }}
              />
            </div>
            <span className="text-[10px] text-slate-500 w-16 text-right font-mono">
              {i < stage ? 'DONE' : i === stage ? 'RUNNING' : 'QUEUED'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Quick Result Preview ────────────────────────────────────────────────────
function QuickResults({ results }: { results: AIResults }) {
  const threat = results.threat_level;
  const color = threat >= 75 ? '#EF4444' : threat >= 40 ? '#F59E0B' : '#10B981';
  const weapons = results.weapon_detection?.detections?.filter(d => d.is_weapon) || [];
  const blood = results.blood_analysis;
  const faces = results.face_recognition?.faces || [];

  return (
    <div className="glass rounded-xl p-5 border border-white/8 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-accent" /> Analysis Complete
        </h3>
        <div className="text-lg font-black font-mono" style={{ color }}>
          {threat.toFixed(0)}% THREAT
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className={`p-3 rounded-lg ${weapons.length > 0 ? 'glass-danger' : 'bg-white/4'}`}>
          <div className="font-semibold mb-0.5 text-white">Weapons</div>
          <div className={weapons.length > 0 ? 'text-danger' : 'text-slate-400'}>
            {weapons.length > 0 ? `${weapons.length} detected` : 'None found'}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${blood?.spots_count > 0 ? 'glass-danger' : 'bg-white/4'}`}>
          <div className="font-semibold mb-0.5 text-white">Blood</div>
          <div className={blood?.spots_count > 0 ? 'text-red-400' : 'text-slate-400'}>
            {blood?.pattern || 'None detected'}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${faces.length > 0 ? 'glass-success' : 'bg-white/4'}`}>
          <div className="font-semibold mb-0.5 text-white">Faces</div>
          <div className={faces.length > 0 ? 'text-accent' : 'text-slate-400'}>
            {faces.length > 0 ? `${faces.length} detected` : 'None found'}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white/4">
          <div className="font-semibold mb-0.5 text-white">Footprint</div>
          <div className="text-slate-400">
            {results.footprint_match?.match ? `${results.footprint_match.similarity.toFixed(0)}% match` : 'No match'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function NewAnalysis() {
  const navigate = useNavigate();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [file,     setFile]     = useState<File | null>(null);
  const [preview,  setPreview]  = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Form state
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [location,    setLocation]    = useState('');
  const [investigator,setInvestigator]= useState(localStorage.getItem('fx_agent') || '');
  const [priority,    setPriority]    = useState('Medium');

  // Process state
  const [stage,    setStage]    = useState(-1);            // -1 = idle
  const [results,  setResults]  = useState<AIResults | null>(null);
  const [error,    setError]    = useState('');
  const [saving,   setSaving]   = useState(false);

  const pickFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResults(null);
    setError('');
    setStage(-1);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) pickFile(e.target.files[0]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) pickFile(f);
  }, []);

  const runAnalysis = async () => {
    if (!file || !title) return;
    setError('');
    setStage(0);
    
    const stageDelays = [500, 1200, 1200, 1000, 1000, 800];
    let stageIdx = 0;
    const advance = () => {
      stageIdx++;
      if (stageIdx < stageDelays.length) setStage(stageIdx);
    };

    try {
      // Start fake stage progression alongside real API call
      const timers = stageDelays.map((delay, i) =>
        setTimeout(() => { if (i < stageDelays.length - 1) setStage(i + 1); }, stageDelays.slice(0, i+1).reduce((a,b) => a+b, 0))
      );

      const res = await analyzeEvidence(file);
      timers.forEach(clearTimeout);
      setResults(res.data);
      setStage(6); // done
    } catch (err: any) {
      setStage(-1);
      setError(err?.response?.data?.detail || 'AI analysis failed. Is the backend running?');
    }
  };

  const saveCase = async () => {
    if (!results || !title) return;
    setSaving(true);
    try {
      const res = await createCase({
        title,
        description,
        location,
        investigator,
        priority,
        evidence_image_url: results.temp_file_url,
        ai_results: results,
      });
      navigate(`/case/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to save case.');
    } finally {
      setSaving(false);
    }
  };

  const isAnalyzing = stage >= 0 && stage < 6;
  const isDone      = stage === 6 && results !== null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Execute Field Analysis</h1>
        <p className="text-slate-400 text-sm mt-1">Upload evidence — AI modules run automatically on submission.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Upload + preview */}
        <div className="space-y-4">
          <div
            className={`drop-zone relative overflow-hidden rounded-2xl cursor-pointer transition-all ${dragging ? 'active' : ''} ${preview ? 'border-solid border-white/10' : ''}`}
            onClick={() => !preview && fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            {!preview ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 shadow-glow-blue">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Drop evidence image here</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Supports JPG, PNG, BMP, WEBP — processed locally, never sent to cloud without consent.
                </p>
                <div className="flex gap-3">
                  <button className="btn-primary text-sm py-2 px-5" onClick={() => fileRef.current?.click()}>
                    <Upload className="w-4 h-4" /> Browse Files
                  </button>
                  <button className="btn-ghost text-sm py-2 px-5">
                    <Camera className="w-4 h-4" /> Webcam
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img src={preview} alt="Evidence preview" className="w-full object-contain max-h-80 rounded-xl" />
                {/* Stage overlay */}
                {isAnalyzing && <AnalysisOverlay stage={stage} />}
                {/* Clear button */}
                {!isAnalyzing && (
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); setResults(null); setStage(-1); }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-bg-deep/80 hover:bg-danger/20 text-slate-400 hover:text-danger flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {/* Done banner */}
                {isDone && (
                  <div className="absolute bottom-3 left-3 right-3 glass-success rounded-lg px-4 py-2 flex items-center gap-2 text-sm text-accent font-semibold">
                    <CheckCircle className="w-4 h-4" /> Analysis complete — review and save below
                  </div>
                )}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileInput} />
          </div>

          {/* Error */}
          {error && (
            <div className="glass-danger rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <p className="text-sm text-danger/90">{error}</p>
            </div>
          )}

          {/* Quick results */}
          {isDone && results && <QuickResults results={results} />}
        </div>

        {/* RIGHT: Case metadata form */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" /> Case Details
            </h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Case Title <span className="text-danger">*</span></label>
              <input className="fx-input" placeholder="e.g. Warehouse Incident — Block 7" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Scene Description</label>
              <textarea
                className="fx-input resize-none"
                rows={3}
                placeholder="Describe the scene, timeline, and initial observations…"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Location
                </label>
                <input className="fx-input" placeholder="Crime scene address" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3" /> Investigator
                </label>
                <input className="fx-input" placeholder="Badge / Name" value={investigator} onChange={e => setInvestigator(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <Flag className="w-3 h-3" /> Priority Level
              </label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map(p => {
                  const cols: Record<string, string> = {
                    Low: 'badge-green', Medium: 'badge-blue', High: 'badge-amber', Critical: 'badge-red'
                  };
                  const selected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        selected
                          ? p === 'Critical' ? 'bg-danger/20 text-danger border-danger/40 shadow-glow-red'
                          : p === 'High'     ? 'bg-amber/20 text-amber border-amber/40'
                          : p === 'Medium'   ? 'bg-primary/20 text-primary border-primary/40 shadow-glow-blue'
                          : 'bg-accent/20 text-accent border-accent/40 shadow-glow-green'
                          : 'bg-white/4 text-slate-500 border-white/8 hover:bg-white/8'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {!isDone ? (
              <button
                onClick={runAnalysis}
                disabled={!file || !title || isAnalyzing}
                className="btn-primary w-full justify-center text-base py-3.5"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-5 h-5 spin" /> Processing Evidence…</>
                ) : (
                  <><Cpu className="w-5 h-5" /> Initialize AI Analysis</>
                )}
              </button>
            ) : (
              <button
                onClick={saveCase}
                disabled={saving}
                className="btn-primary w-full justify-center text-base py-3.5"
                style={{ background: 'linear-gradient(135deg, #065F46, #10B981)' }}
              >
                {saving ? (
                  <><Loader2 className="w-5 h-5 spin" /> Saving Case…</>
                ) : (
                  <><CheckCircle className="w-5 h-5" /> Save to Case Archive</>
                )}
              </button>
            )}

            {(isAnalyzing || isDone) && !saving && (
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(null); setResults(null); setStage(-1); setTitle(''); }}
                className="btn-ghost w-full justify-center"
              >
                <X className="w-4 h-4" /> Discard & Start Over
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="glass rounded-xl p-4 border border-white/5 text-xs text-slate-500 space-y-1.5">
            <div className="text-slate-400 font-semibold mb-2 flex items-center gap-2">
              <Info className="w-3.5 h-3.5" /> Analysis Pipeline
            </div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" /> YOLOv8 scans for weapons & threats</div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> OpenCV HSV detects blood spatter</div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber inline-block" /> ORB matching compares footprint treads</div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" /> Face recognition lookups suspect DB</div>
          </div>
        </div>
      </div>
    </div>
  );
}
