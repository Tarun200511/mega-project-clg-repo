import React, { useState } from 'react';
import { FileText, Sparkles, AlertTriangle, FileCheck, CheckCircle2, Bot, Upload } from 'lucide-react';
import { fetchWithGeminiFallback } from '../geminiClient';

// Predefined cases for exhibit presentation
const EXHIBIT_CASES = [
  {
    id: 1,
    title: 'The Warehouse Incident',
    label: 'Case 01: Warehouse Homicide',
    doc: `INITIAL INCIDENT REPORT - FX-WH-01
LOCATION: Pier 39, Abandoned Warehouse Block A
TIME: 0300hrs
RESPONDING OFFICER: Sgt. Miller

Upon arriving at the scene, I discovered a male victim, approx 35-40 years old, lying face down near the northern loading dock. Heavy blood pooling around the upper torso. There appears to be a chaotic blood spatter pattern on the adjacent brick wall, suggesting a struggle.

In the mud approximately 15 feet from the body, I observed distinct boot prints leading toward the chain-link fence on the perimeter. The tread pattern seems aggressive, possibly a tactical or work boot. 

A rusted crowbar, potentially the murder weapon, was found in the grass near the fence line. It has dark stains on the grip.

Paramedics arrived at 0315hrs and pronounced the victim DOA. A wallet in the victim's jacket contained an ID matching a known local longshoreman, Marcus Vance.`
  },
  {
    id: 2,
    title: 'Downtown Alley - Suspect Fled',
    label: 'Case 02: Alleyway Aggravated Assault',
    doc: `CRIME SCENE FIELD NOTES - FX-AA-88
LOCATION: Alley behind 5th Ave Metro Station
TIME: 2245hrs
RESPONDING OFFICER: Off. Davies

Responded to distress calls of an altercation. Found victim (female, mid-20s) with severe lacerations. She was conscious but disoriented. She described her attacker as wearing a dark hoodie and a ski mask, fleeing toward 6th Street.

Evidence marked at the scene:
Tag 1: Distinct pooling of blood near the dumpsters.
Tag 2: A folding knife dropped near the storm drain, 4-inch blade with visible trace evidence.
Tag 3: A partial bloody handprint on the dumpster lid.

Security camera (CCTV-45) from the bank opposite the alley caught a brief glimpse of a male suspect pulling up a mask as he ran. The facial image is heavily obscured but might yield partial biometrics if enhanced.`
  },
  {
    id: 3,
    title: 'Suburban Break-In',
    label: 'Case 03: Armed Home Invasion',
    doc: `INVESTIGATION LOG - FX-HI-42
LOCATION: 104 Cherry Lane (Residential)
TIME: 0110hrs
RESPONDING OFFICER: Det. Ramirez

Homeowners reported an armed intruder forced entry through the back sliding glass door. The glass was shattered entirely. Homeowners locked themselves in the master bedroom and called 911. 

Intruder reportedly dropped a firearm (Glock 19 replica, confirmed unloaded) on the living room rug during his haste to escape before backup arrived. 

Significant evidence:
- Blood drops found near the broken glass, likely from a laceration the suspect sustained during entry.
- Muddy athletic shoe footprints tracking through the kitchen and hallway. Tread resembles a popular running shoe brand.
- The firearm left on the scene is pending latent print dusting.`
  }
];

export default function DocumentIntelligence() {
  const [docText, setDocText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadExhibitCase = (id: number) => {
    const c = EXHIBIT_CASES.find(x => x.id === id);
    if (c) {
      setDocText(c.doc);
      setReport(null);
      setError(null);
    }
  };

  const analyzeDocument = async () => {
    if (!docText.trim()) return;
    setAnalyzing(true);
    setReport(null);
    setError(null);

    const systemPrompt = `You are the ForensiX AI Intelligence platform. Your task is to analyze the raw forensic/police document provided.
You must return a highly structured, professional intelligence report formatted in Markdown.
Always include the following headings:
### Executive Summary
### Key Entities & Evidence
### Automated Threat Assessment
### System Recommendations

Be precise, clinical, and tactical in your language.`;

    try {
      const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: docText }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      };

      const data = await fetchWithGeminiFallback(body);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No valid response from AI');
      
      setReport(text);
    } catch (err: any) {
      setError(err.message || 'Error executing AI pipeline');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-violet-400" />
            <h1 className="text-2xl font-bold text-white">AI Document Intelligence</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Paste raw field notes, police reports, or evidence logs for automated Gemini extraction.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left: Input Panel */}
        <div className="glass rounded-2xl flex flex-col overflow-hidden border border-white/5">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between" style={{ background: 'rgba(17,24,39,0.5)' }}>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-slate-400" />
              Source Material
            </div>
            
            {/* Exhibit Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber">Exhibit Demos:</span>
              <select 
                className="bg-black/40 border border-white/10 text-slate-300 text-xs px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:border-violet/40 transition-colors"
                onChange={(e) => loadExhibitCase(Number(e.target.value))}
                defaultValue=""
              >
                <option value="" disabled>Load Example Document...</option>
                {EXHIBIT_CASES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="p-5 flex-1 flex flex-col gap-4">
            <textarea
              className="w-full flex-1 min-h-[300px] bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 font-mono leading-relaxed outline-none focus:border-violet/50 focus:bg-white/5 transition-all resize-none"
              placeholder="Paste raw case transcripts, 911 calls, or responding officer field logs here..."
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
            />
            
            <button
              onClick={analyzeDocument}
              disabled={!docText.trim() || analyzing}
              className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 text-white"
            >
              {analyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin" />
                  Running Neural Extraction...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-violet-200" />
                  Initiate AI Analysis
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Output Panel */}
        <div className="glass rounded-2xl flex flex-col border border-violet/20 shadow-glow-blue overflow-hidden relative">
          
          {/* Decorative glow inside panel */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="px-5 py-4 border-b border-violet/20 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.1), transparent)' }}>
            <div className="text-xs font-semibold text-violet-300 uppercase tracking-wider flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Intelligence Report
            </div>
            {analyzing && (
              <div className="text-[10px] font-mono text-violet-400 flex items-center gap-1.5 bg-violet/10 px-2 py-1 rounded-md">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                PROCESSING
              </div>
            )}
            {report && (
              <div className="text-[10px] font-mono text-accent flex items-center gap-1.5 bg-accent/10 px-2 py-1 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                COMPLETED
              </div>
            )}
          </div>

          <div className="p-5 flex-1 overflow-y-auto">
            {!report && !analyzing && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <FileCheck className="w-12 h-12 mb-3 text-violet-300" />
                <div className="text-sm">Standing by for document input.</div>
                <div className="text-xs mt-1 font-mono">Gemini 1.5 Flash Parser Ready</div>
              </div>
            )}

            {analyzing && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="mb-4">
                  <ScanlineEffect />
                </div>
                <div className="text-violet-400 text-sm font-mono tracking-widest uppercase animate-pulse">
                  Extracting Entities...
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 bg-danger/10 border border-danger/30 text-danger-light p-4 rounded-xl">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {report && !analyzing && (
              <div 
                className="text-sm text-slate-300 leading-relaxed font-sans markup-content space-y-4"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(report) }}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Basic decorative SVG component
// ─────────────────────────────────────────────────────────────────────────────
function ScanlineEffect() {
  return (
    <div className="relative w-24 h-24 border border-violet/30 rounded-lg overflow-hidden bg-violet/5">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-400/40 to-transparent h-[200%] w-full animate-[scanline_2s_linear_infinite]" />
      <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-violet-400/50" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Very minimal markdown parser for Gemini output
// ─────────────────────────────────────────────────────────────────────────────
function parseMarkdown(text: string) {
  let html = text
    .replace(/^### (.*$)/gim, '<h3 className="text-lg font-bold text-white mt-6 mb-2 border-b border-white/10 pb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 className="text-xl font-bold text-violet-300 mt-6 mb-2">$1</h2>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong className="text-white">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em className="text-slate-300">$1</em>')
    .replace(/^\- (.*$)/gim, '<li className="ml-4 list-disc marker:text-violet-500 mb-1">$1</li>');

  // Wrap loose lines in p tags
  html = html.split('\n').map(line => {
    if (!line.trim() || line.startsWith('<h') || line.startsWith('<li')) return line;
    return `<p className="mb-2">${line}</p>`;
  }).join('\n');

  return html;
}
