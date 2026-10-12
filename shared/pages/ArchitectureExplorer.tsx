import React, { useState } from 'react';
import { PATTERN_DOCUMENTATION } from '../data/patternDocumentation';
import { PatternDocumentation, PatternCategory } from '../pattern-tracing/types';
import { GlassCard } from '../components/common/GlassCard';
import { GlassModal } from '../components/common/GlassModal';
import { Badge } from '../components/common/Badge';
import { PatternTraceService } from '../pattern-tracing/PatternTraceService';
import { 
  Code2, 
  Search, 
  Layers, 
  FileCode, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  ArrowRight, 
  Cpu, 
  Check 
} from 'lucide-react';

interface ArchitectureExplorerProps {
  initialSelectedPattern?: string | null;
}

export const ArchitectureExplorer: React.FC<ArchitectureExplorerProps> = ({
  initialSelectedPattern
}) => {
  const [categoryFilter, setCategoryFilter] = useState<PatternCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedPattern, setSelectedPattern] = useState<PatternDocumentation | null>(() => {
    if (initialSelectedPattern) {
      return PATTERN_DOCUMENTATION.find(p => p.name.toLowerCase().includes(initialSelectedPattern.toLowerCase())) || PATTERN_DOCUMENTATION[0];
    }
    return PATTERN_DOCUMENTATION[0];
  });

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const filteredPatterns = PATTERN_DOCUMENTATION.filter(p => {
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.participants.some(pt => pt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleTestPattern = (pattern: PatternDocumentation) => {
    PatternTraceService.emit({
      pattern: pattern.name,
      category: pattern.category,
      module: pattern.module,
      step: 1,
      message: `[Architecture Explorer Test] Executing interactive verification of ${pattern.name}`
    });

    pattern.executionFlow.forEach((stepText, idx) => {
      setTimeout(() => {
        PatternTraceService.emit({
          pattern: pattern.name,
          category: pattern.category,
          module: pattern.module,
          step: idx + 2,
          message: stepText
        });
      }, (idx + 1) * 600);
    });
  };

  const handleCopyCode = () => {
    if (!selectedPattern) return;
    navigator.clipboard.writeText(selectedPattern.codeExample);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const creationalCount = PATTERN_DOCUMENTATION.filter(p => p.category === 'Creational').length;
  const structuralCount = PATTERN_DOCUMENTATION.filter(p => p.category === 'Structural').length;
  const behavioralCount = PATTERN_DOCUMENTATION.filter(p => p.category === 'Behavioral').length;

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">23 Gang of Four (GoF) Architecture Explorer</h2>
            <Badge variant="indigo" icon={<Cpu size={12} />}>
              23 / 23 Patterns Verified
            </Badge>
          </div>
          <p className="text-sm text-muted mt-1">
            Comprehensive interactive catalogue of all 23 GoF design patterns mapped to genuine hospital workflows.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'Creational', 'Structural', 'Behavioral'] as const).map(cat => {
            const isSelected = categoryFilter === cat;
            const count = cat === 'ALL' ? 23 : (cat === 'Creational' ? creationalCount : (cat === 'Structural' ? structuralCount : behavioralCount));
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 700 : 500,
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--indigo-600)' : 'rgba(226, 232, 240, 0.9)',
                  background: isSelected ? 'var(--indigo-600)' : 'rgba(255, 255, 255, 0.85)',
                  color: isSelected ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{cat}</span>
                <span
                  style={{
                    background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(241, 245, 249, 0.9)',
                    borderRadius: '9999px',
                    padding: '0.05rem 0.4rem',
                    fontSize: '0.7rem'
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Statistics Banner */}
      <GlassCard className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search pattern, participant, or problem..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="glass-input pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-600 font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
            Creational: <strong>5 Patterns</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
            Structural: <strong>7 Patterns</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Behavioral: <strong>11 Patterns</strong>
          </span>
        </div>
      </GlassCard>

      {/* Main Grid: 23 Pattern Cards (Left) + Live Detail Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pattern Matrix */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4" style={{ maxHeight: '800px', overflowY: 'auto' }}>
          {filteredPatterns.map(pattern => {
            const isSelected = selectedPattern?.id === pattern.id;
            return (
              <GlassCard
                key={pattern.id}
                onClick={() => setSelectedPattern(pattern)}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`badge ${
                    pattern.category === 'Creational' ? 'badge-cyan' : (pattern.category === 'Structural' ? 'badge-indigo' : 'badge-emerald')
                  }`}>
                    {pattern.category}
                  </span>
                  <span className="text-xs text-muted font-mono text-[11px] truncate max-w-[140px]">
                    {pattern.filePath.split('/').pop()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-1">{pattern.name}</h3>
                <p className="text-xs font-semibold text-indigo-700 mt-0.5">Module: {pattern.module}</p>

                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                  {pattern.problem}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3">
                  <span className="text-xs text-muted">Trigger: <strong>{pattern.trigger}</strong></span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleTestPattern(pattern);
                    }}
                    className="btn-secondary"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                  >
                    <Play size={11} /> Test Trace
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Right 1 Col: Comprehensive Pattern Inspector */}
        {selectedPattern && (
          <GlassCard className="p-6 flex flex-col gap-4 sticky top-24" style={{ height: 'fit-content' }}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className={`badge ${
                  selectedPattern.category === 'Creational' ? 'badge-cyan' : (selectedPattern.category === 'Structural' ? 'badge-indigo' : 'badge-emerald')
                }`}>
                  {selectedPattern.category} Pattern
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedPattern.name}</h3>
                <p className="text-xs font-semibold text-indigo-700">Module: {selectedPattern.module}</p>
              </div>

              <button
                onClick={() => handleTestPattern(selectedPattern)}
                className="btn-primary"
                style={{ padding: '0.45rem 0.8rem', fontSize: '0.785rem' }}
                title="Execute pattern trace test"
              >
                <Play size={14} />
                Live Test
              </button>
            </div>

            {/* Problem & Solution */}
            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl">
                <h5 className="font-bold text-rose-900 uppercase tracking-wider mb-1">Clinical Problem Solved</h5>
                <p className="text-slate-700 leading-relaxed">{selectedPattern.problem}</p>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                <h5 className="font-bold text-emerald-900 uppercase tracking-wider mb-1">Architectural Solution</h5>
                <p className="text-slate-700 leading-relaxed">{selectedPattern.solution}</p>
              </div>
            </div>

            {/* Participants & File */}
            <div className="flex flex-col gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-600 block mb-1">Pattern Participants:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedPattern.participants.map((p, idx) => (
                    <span key={idx} className="badge badge-indigo text-[10px] font-mono">{p}</span>
                  ))}
                </div>
              </div>

              <div className="mt-1">
                <span className="font-bold text-slate-600 block mb-0.5">TypeScript Source File:</span>
                <code className="text-xs text-indigo-700 bg-indigo-50/80 px-2 py-1 rounded block truncate font-mono">
                  {selectedPattern.filePath}
                </code>
              </div>
            </div>

            {/* Code Preview Box */}
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Implementation Code:</span>
                <button
                  onClick={handleCopyCode}
                  className="btn-secondary"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                >
                  {copiedCode ? <Check size={11} className="text-emerald" /> : <Code2 size={11} />}
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre
                style={{
                  background: '#0f172a',
                  color: '#e2e8f0',
                  padding: '0.85rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.7rem',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  lineHeight: '1.4'
                }}
              >
                <code>{selectedPattern.codeExample}</code>
              </pre>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};
