import React, { createContext, useContext, useState, useEffect } from 'react';
import { PatternTrace, PatternCategory } from './types';
import { PatternTraceService } from './PatternTraceService';

interface PatternTraceContextValue {
  traces: PatternTrace[];
  activeTrace: PatternTrace | null;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  clearTraces: () => void;
  filterCategory: PatternCategory | 'ALL';
  setFilterCategory: (cat: PatternCategory | 'ALL') => void;
  lastFiredPattern: string | null;
}

const PatternTraceContext = createContext<PatternTraceContextValue | undefined>(undefined);

export const PatternTraceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [traces, setTraces] = useState<PatternTrace[]>(() => PatternTraceService.getRecentTraces());
  const [activeTrace, setActiveTrace] = useState<PatternTrace | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<PatternCategory | 'ALL'>('ALL');
  const [lastFiredPattern, setLastFiredPattern] = useState<string | null>(null);

  useEffect(() => {
    const handleTrace = (e: Event) => {
      const customEvent = e as CustomEvent<PatternTrace>;
      if (customEvent.detail) {
        const trace = customEvent.detail;
        setTraces(prev => [trace, ...prev.slice(0, 199)]);
        setActiveTrace(trace);
        setLastFiredPattern(trace.pattern);

        // Reset badge highlight after 2.5 seconds
        setTimeout(() => {
          setLastFiredPattern(null);
        }, 2500);
      }
    };

    const handleClear = () => {
      setTraces([]);
      setActiveTrace(null);
      setLastFiredPattern(null);
    };

    window.addEventListener('pattern-trace', handleTrace);
    window.addEventListener('pattern-trace-clear', handleClear);

    return () => {
      window.removeEventListener('pattern-trace', handleTrace);
      window.removeEventListener('pattern-trace-clear', handleClear);
    };
  }, []);

  const toggleDrawer = () => setIsDrawerOpen(prev => !prev);
  const clearTraces = () => {
    PatternTraceService.clearTraces();
    setTraces([]);
  };

  return (
    <PatternTraceContext.Provider
      value={{
        traces,
        activeTrace,
        isDrawerOpen,
        setIsDrawerOpen,
        toggleDrawer,
        clearTraces,
        filterCategory,
        setFilterCategory,
        lastFiredPattern
      }}
    >
      {children}
    </PatternTraceContext.Provider>
  );
};

export const usePatternTrace = () => {
  const context = useContext(PatternTraceContext);
  if (!context) {
    throw new Error('usePatternTrace must be used within a PatternTraceProvider');
  }
  return context;
};
