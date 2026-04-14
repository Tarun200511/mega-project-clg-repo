import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle, X, Send, Bot, Minimize2, Maximize2,
  Sparkles, ChevronDown, AlertTriangle, RefreshCw
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Gemini API config (direct frontend call — no backend needed for exhibit)
// ─────────────────────────────────────────────────────────────────────────────
import { fetchWithGeminiFallback } from '../geminiClient';

const SYSTEM_PROMPT = `You are ForensiX AI — an expert forensic science assistant embedded inside the ForensiX Crime Scene Intelligence System. You help investigators understand:
- Blood spatter patterns and their crime-scene significance
- Weapon detection results from YOLOv8 AI models
- Footprint/tread matching and how ORB feature matching works
- Face recognition biometrics and suspect identification
- Threat level scoring and how it's calculated
- General forensic investigation methodology and evidence processing
- How to interpret the AI analysis results shown in the dashboard

Be concise, professional, and use precise forensic terminology. When asked about a specific case, analyze the evidence data provided. Limit responses to 3-4 sentences unless asked to elaborate.`;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface CaseContext {
  caseNumber?: string;
  title?: string;
  description?: string;
  threatLevel?: number;
  weaponDetected?: boolean;
  bloodDetected?: boolean;
  faceDetected?: boolean;
  bloodPattern?: string;
  weaponsCount?: number;
  location?: string;
  status?: string;
  footprintMatch?: string;
  faceMatches?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
  loading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick suggestion chips
// ─────────────────────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'Summarize this case',
  'What does the threat score mean?',
  'Explain blood spatter patterns',
  'How does YOLOv8 detect weapons?',
  'What is footprint tread matching?',
  'How does face recognition work?',
];

// ─────────────────────────────────────────────────────────────────────────────
// Gemini API call
// ─────────────────────────────────────────────────────────────────────────────
async function askGemini(userMessage: string, history: Message[], caseCtx?: CaseContext): Promise<string> {
  // Build context string
  let contextBlock = '';
  if (caseCtx && (caseCtx.caseNumber || caseCtx.title)) {
    contextBlock = `

[CURRENT CASE CONTEXT]
Case: ${caseCtx.caseNumber || 'Unknown'} — ${caseCtx.title || 'Untitled'}
Status: ${caseCtx.status || 'Unknown'}
Location: ${caseCtx.location || 'Unknown'}

Case Description / Notes:
${caseCtx.description || 'No notes provided for this case.'}

AI Intelligence Report:
- Overall Threat Level: ${caseCtx.threatLevel?.toFixed(0) ?? 'N/A'}%
- Weapon Detected: ${caseCtx.weaponDetected ? `YES (${caseCtx.weaponsCount} found)` : 'No'}
- Blood Spatter Detected: ${caseCtx.bloodDetected ? `YES (Classified as: ${caseCtx.bloodPattern || 'Unknown'})` : 'No'}
- Footprint Match: ${caseCtx.footprintMatch || 'No matches found / No analysis run'}
- Face Recognition: ${caseCtx.faceMatches || 'No matches found'}
`;
  }

  // Build conversation history for Gemini
  const contents = history
    .filter(m => !m.loading)
    .slice(-10) // last 10 messages for context
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: contextBlock + userMessage }],
  });

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
    },
  };

  const data = await fetchWithGeminiFallback(body);
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
}

// ─────────────────────────────────────────────────────────────────────────────
// Message bubble
// ─────────────────────────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} message-fade-in`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div
        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-br-sm'
            : 'glass border border-white/8 text-slate-200 rounded-bl-sm'
        }`}
      >
        {msg.loading ? (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main bot component
// ─────────────────────────────────────────────────────────────────────────────
interface ForensiXBotProps {
  caseContext?: CaseContext;
  externalOpen?: boolean;
  onExternalOpenConsumed?: () => void;
}

export default function ForensiXBot({ caseContext, externalOpen, onExternalOpenConsumed }: ForensiXBotProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm ForensiX AI — your forensic intelligence assistant. Ask me about blood spatter, weapon detection, threat scores, or anything about crime-scene analysis.",
      ts: Date.now(),
    },
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // React to external "open" trigger (from CaseDetails "Ask AI" button)
  useEffect(() => {
    if (externalOpen) {
      setOpen(true);
      onExternalOpenConsumed?.();
    }
  }, [externalOpen, onExternalOpenConsumed]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    setInput('');
    setError('');
    setShowSuggestions(false);
    setSending(true);

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: content, ts: Date.now() };
    const loadingMsg: Message = { id: `a-${Date.now()}`, role: 'assistant', text: '', ts: Date.now(), loading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);

    try {
      const reply = await askGemini(content, [...messages, userMsg], caseContext);
      setMessages(prev =>
        prev.map(m => m.id === loadingMsg.id ? { ...m, text: reply, loading: false } : m)
      );
    } catch (e: any) {
      setMessages(prev => prev.filter(m => m.id !== loadingMsg.id));
      setError(e.message || 'Failed to get response. Check your connection.');
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, caseContext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-2',
      role: 'assistant',
      text: "Chat cleared. How can I help you with your forensic investigation?",
      ts: Date.now(),
    }]);
    setShowSuggestions(true);
    setError('');
  };

  const panelH = expanded ? 'h-[600px]' : 'h-[480px]';
  const panelW = expanded ? 'w-[440px]' : 'w-[380px]';

  return (
    <>
      {/* ── Floating Action Button ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          title="ForensiX AI Bot"
        >
          <div className="relative">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-primary/40 border border-primary/40 hover:scale-110 transition-transform duration-200">
              <Bot className="w-6 h-6 text-white" />
            </div>
            {/* Badge */}
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent border-2 border-bg-deep flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </button>
      )}

      {/* ── Chat Panel ── */}
      {open && (
        <div
          className={`fixed bottom-6 right-6 z-50 ${panelW} ${panelH} flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 bot-panel-open`}
          style={{ background: 'rgba(11,15,25,0.97)', backdropFilter: 'blur(24px)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))' }}>
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                ForensiX AI
                <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {caseContext?.caseNumber ? `Context: ${caseContext.caseNumber}` : 'Forensic Intelligence Assistant'}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors"
                title="Clear chat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setExpanded(v => !v)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors"
                title={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-danger hover:bg-danger/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Case context banner */}
          {caseContext?.caseNumber && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/8 border-b border-primary/15 text-[11px] font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
              <span className="text-primary">Case context loaded —</span>
              <span className="text-slate-400 truncate">{caseContext.title}</span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bot-scroll">
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

            {/* Suggestion chips */}
            {showSuggestions && messages.length <= 1 && (
              <div className="pt-1">
                <div className="text-[10px] text-slate-600 mb-2 font-mono uppercase tracking-widest">Quick Questions</div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/8 text-slate-400 hover:text-white hover:bg-primary/15 hover:border-primary/30 transition-all duration-150"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/8 border border-danger/20 text-xs text-danger/90">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="px-3 py-3 border-t border-white/8" style={{ background: 'rgba(17,24,39,0.6)' }}>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about forensics, this case, AI results…"
                disabled={sending}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-primary/50 focus:bg-white/8 transition-all"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white hover:bg-primary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center mt-1.5 text-[9px] text-slate-700 font-mono">
              Powered by Gemini 1.5 Flash · ForensiX Intelligence System
            </div>
          </div>
        </div>
      )}
    </>
  );
}
