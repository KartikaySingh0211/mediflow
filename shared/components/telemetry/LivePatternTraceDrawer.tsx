import React from 'react';
import { createPortal } from 'react-dom';
import { usePatternTrace } from '../../pattern-tracing/PatternTraceContext';
import { PatternCategory } from '../../pattern-tracing/types';
import { 
  Activity, 
  X, 
  Trash2, 
  CheckCircle2, 
  Layers, 
  ExternalLink 
} from 'lucide-react';

interface LivePatternTraceDrawerProps {
  onNavigateToArchitecture?: (patternName?: string) => void;
}

export const LivePatternTraceDrawer: React.FC<LivePatternTraceDrawerProps> = ({
  onNavigateToArchitecture
}) => {
  const {
    traces,
    isDrawerOpen,
    setIsDrawerOpen,
    clearTraces,
    filterCategory,
    setFilterCategory,
    lastFiredPattern
  } = usePatternTrace();

  const filteredTraces = traces.filter(t => 
    filterCategory === 'ALL' ? true : t.category === filterCategory
  );

  const getCategoryBadge = (cat: PatternCategory) => {
    switch (cat) {
      case 'Creational':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
      case 'Structural':
        return { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' };
      case 'Behavioral':
      default:
        return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
    }
  };

  return (
    <>
      {/* Floating Telemetry Trigger Pill */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className={`btn-primary ${lastFiredPattern ? 'pulse-glow' : ''}`}
          style={{
            padding: '0.65rem 1.15rem',
            borderRadius: '9999px',
            boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem'
          }}
        >
          <Activity size={18} className={lastFiredPattern ? 'animate-pulse' : ''} />
          <span>Live Pattern Trace</span>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              borderRadius: '9999px',
              padding: '0.1rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 800
            }}
          >
            {traces.length}
          </span>
          {lastFiredPattern && (
            <span
              style={{
                background: '#10b981',
                color: '#ffffff',
                borderRadius: '9999px',
                padding: '0.1rem 0.45rem',
                fontSize: '0.7rem',
                fontWeight: 700
              }}
            >
              Fired: {lastFiredPattern}
            </span>
          )}
        </button>
      </div>

      {/* Drawer Overlay & Panel */}
      {isDrawerOpen && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="animate-slide-in"
            style={{
              width: '100%',
              maxWidth: '30rem',
              height: '100%',
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="p-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid #e2e8f0', background: 'rgba(248, 250, 252, 0.8)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    background: 'var(--primary-100)',
                    color: 'var(--primary-600)'
                  }}
                >
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">GoF Live Execution Trace</h3>
                  <p className="text-xs text-muted">Observing 23 Design Pattern Telemetry in Real Time</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearTraces}
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                  title="Clear trace history"
                >
                  <Trash2 size={13} />
                  Clear
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '0.4rem',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Category Filters */}
            <div
              className="px-4 py-2 flex items-center gap-1.5"
              style={{ borderBottom: '1px solid #f1f5f9', background: 'rgba(255, 255, 255, 0.6)' }}
            >
              {(['ALL', 'Creational', 'Structural', 'Behavioral'] as const).map(cat => {
                const isSelected = filterCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 700 : 500,
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--primary-500)' : '#e2e8f0',
                      background: isSelected ? 'var(--primary-50)' : 'rgba(255, 255, 255, 0.8)',
                      color: isSelected ? 'var(--primary-700)' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Traces Timeline Stream */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {filteredTraces.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                  <Layers size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                  <p className="text-sm font-semibold">No active pattern traces yet.</p>
                  <p className="text-xs mt-1">Perform any hospital action (register patient, book appointment, record vitals) to observe live GoF pattern execution.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {filteredTraces.map((trace, idx) => {
                    const style = getCategoryBadge(trace.category);
                    return (
                      <div
                        key={trace.id}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '0.75rem',
                          background: idx === 0 ? 'rgba(240, 249, 255, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                          border: idx === 0 ? '1px solid rgba(14, 165, 233, 0.35)' : '1px solid rgba(226, 232, 240, 0.9)',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                          position: 'relative'
                        }}
                      >
                        {/* Top row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              style={{
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: style.bg,
                                color: style.text,
                                border: `1px solid ${style.border}`
                              }}
                            >
                              {trace.category}
                            </span>
                            <span className="text-xs font-bold text-main">{trace.pattern}</span>
                            {trace.step && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b' }}>
                                (Step {trace.step})
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                            {new Date(trace.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        {/* Message */}
                        <p className="text-xs font-medium" style={{ color: '#334155', lineHeight: '1.4' }}>
                          {trace.message}
                        </p>

                        {/* Bottom Row */}
                        <div className="flex items-center justify-between mt-1 pt-1" style={{ borderTop: '1px solid rgba(241, 245, 249, 0.8)' }}>
                          <span style={{ fontSize: '0.685rem', color: '#64748b' }}>
                            Module: <strong style={{ color: '#475569' }}>{trace.module}</strong>
                          </span>
                          {onNavigateToArchitecture && (
                            <button
                              onClick={() => onNavigateToArchitecture(trace.pattern)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-600)',
                                fontSize: '0.685rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem'
                              }}
                            >
                              Docs <ExternalLink size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div
              className="p-3 text-center"
              style={{
                borderTop: '1px solid #e2e8f0',
                background: 'rgba(248, 250, 252, 0.9)',
                fontSize: '0.75rem',
                color: '#64748b'
              }}
            >
              <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '0.35rem', color: '#10b981' }} />
              MediFlow Pattern Observability Engine Active
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
