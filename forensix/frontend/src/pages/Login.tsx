import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Fingerprint, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { login as apiLogin } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [badge, setBadge]       = useState('');
  const [key, setKey]           = useState('');
  const [showKey, setShowKey]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badge || !key) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiLogin(badge, key);
      localStorage.setItem('fx_token', res.data.access_token);
      localStorage.setItem('fx_agent', res.data.agent_name);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo bypass (backend might not be running)
  const handleDemo = () => {
    localStorage.setItem('fx_token', 'fx-demo-bypass');
    localStorage.setItem('fx_agent', 'Agent Demo');
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg-deep grid-bg flex items-center justify-center relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute top-[-20%] left-[-15%] w-[700px] h-[700px] bg-primary/8 rounded-full blur-[150px]" />
      <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet/8 rounded-full blur-[120px]" />

      {/* Hex grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #3B82F6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* System status badge */}
        <div className="flex justify-center mb-6">
          <div className="glass rounded-full px-4 py-2 flex items-center gap-2 text-xs text-slate-400 font-mono border border-white/5">
            <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
            FORENSIX FIELD SYSTEM · SECURE PORTAL
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden border border-white/8">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-primary/10 to-violet/5 border-b border-white/5 p-8 text-center overflow-hidden scanline">
            <div className="relative z-10">
              <div className="inline-flex p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4 shadow-glow-blue">
                <ShieldAlert className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-black tracking-[0.1em] gradient-text">FORENSIX</h1>
              <p className="text-slate-400 text-sm mt-1.5">AI Crime Scene Intelligence System</p>
              <p className="text-[10px] text-primary/60 font-mono mt-1 tracking-widest">LAW ENFORCEMENT USE ONLY</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="glass-danger rounded-xl p-4 mb-5 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-danger shrink-0" />
                <p className="text-sm text-danger/90">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5" /> Agent Badge Number
                </label>
                <input
                  type="text"
                  className="fx-input"
                  placeholder="e.g. BADGE-4471"
                  value={badge}
                  onChange={e => setBadge(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Access Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="fx-input pr-10"
                    placeholder="••••••••••••"
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !badge || !key}
                className="btn-primary w-full justify-center mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    Authenticate
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
              <div className="relative flex justify-center text-[10px] text-slate-600 uppercase tracking-widest">or</div>
            </div>

            <button
              onClick={handleDemo}
              className="btn-ghost w-full justify-center text-sm"
            >
              Continue as Demo Agent
            </button>

            <p className="text-center text-[10px] text-slate-600 mt-5 font-mono">
              Unauthorized access is a federal offense · All sessions logged
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
