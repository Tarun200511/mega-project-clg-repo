import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, FolderOpen, Shield, Droplets, ScanFace, X, ChevronDown } from 'lucide-react';
import { getCases } from '../api';
import { Case } from '../types';
import CaseCard from '../components/CaseCard';

const STATUSES  = ['All', 'Open', 'Pending', 'Closed'];
const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Critical'];

export default function CasesArchive() {
  const [cases,    setCases]    = useState<Case[]>([]);
  const [filtered, setFiltered] = useState<Case[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('All');
  const [priority, setPriority] = useState('All');
  const [sort,     setSort]     = useState<'date_desc'|'date_asc'|'threat_desc'>('date_desc');

  useEffect(() => {
    getCases()
      .then(res => { setCases(res.data); setFiltered(res.data); })
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...cases];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.case_number.toLowerCase().includes(q) ||
        (c.location || '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (status !== 'All') result = result.filter(c => c.status === status);

    // Priority filter
    if (priority !== 'All') result = result.filter(c => c.priority === priority);

    // Sort
    if (sort === 'date_desc')   result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (sort === 'date_asc')    result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (sort === 'threat_desc') result.sort((a, b) => b.threat_level - a.threat_level);

    setFiltered(result);
  }, [cases, search, status, priority, sort]);

  const clearFilters = () => { setSearch(''); setStatus('All'); setPriority('All'); setSort('date_desc'); };
  const hasFilters = search || status !== 'All' || priority !== 'All';

  // Summaries
  const highThreat   = cases.filter(c => c.threat_level >= 70).length;
  const withWeapons  = cases.filter(c => c.weapon_detected).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Case Archives</h1>
          <p className="text-slate-400 text-sm mt-1">
            {cases.length} total · {cases.filter(c => c.status === 'Open').length} open · {highThreat} high-threat · {withWeapons} weapon cases
          </p>
        </div>
        <Link to="/analyze" className="btn-primary">
          <span className="text-lg leading-none">+</span> New Analysis
        </Link>
      </div>

      {/* Filter bar */}
      <div className="glass rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="flex gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              className="fx-input pl-10 h-10 text-sm"
              placeholder="Search cases, IDs, locations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status */}
          <div className="relative">
            <select
              className="fx-input h-10 text-sm pl-3 pr-8 appearance-none w-36"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Priority */}
          <div className="relative">
            <select
              className="fx-input h-10 text-sm pl-3 pr-8 appearance-none w-36"
              value={priority}
              onChange={e => setPriority(e.target.value)}
            >
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              className="fx-input h-10 text-sm pl-3 pr-8 appearance-none w-44"
              value={sort}
              onChange={e => setSort(e.target.value as any)}
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="threat_desc">Highest Threat</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost h-10 px-4 text-sm">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Quick filter chips */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setPriority(priority === 'Critical' ? 'All' : 'Critical')}
            className={`badge text-[10px] cursor-pointer transition-opacity ${priority === 'Critical' ? 'badge-red opacity-100' : 'badge-gray opacity-60 hover:opacity-100'}`}
          >
            <Shield className="w-3 h-3" /> Critical Only
          </button>
          <button
            onClick={() => setStatus(status === 'Open' ? 'All' : 'Open')}
            className={`badge text-[10px] cursor-pointer transition-opacity ${status === 'Open' ? 'badge-blue opacity-100' : 'badge-gray opacity-60 hover:opacity-100'}`}
          >
            Open Cases
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl py-20 text-center border border-white/5">
          <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">
            {cases.length === 0 ? 'No cases yet' : 'No matching cases'}
          </p>
          {cases.length === 0 ? (
            <Link to="/analyze" className="text-primary text-sm mt-2 inline-block hover:underline">
              Run your first analysis →
            </Link>
          ) : (
            <button onClick={clearFilters} className="text-primary text-sm mt-2 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-mono">
              Showing {filtered.length} of {cases.length} cases
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(c => (
              <CaseCard key={c.id} case_={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
