import React, { useState } from 'react';
import { PortalHeader, HOSPITAL_PORTALS } from './PortalHeader';
import { LivePatternTraceDrawer } from '../telemetry/LivePatternTraceDrawer';
import { ArchitectureExplorer } from '../../pages/ArchitectureExplorer';

interface PortalLayoutProps {
  portalId: string;
  children: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ portalId, children }) => {
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [highlightedPattern, setHighlightedPattern] = useState<string | null>(null);

  const handleNavigateToArchitecture = (patternName?: string) => {
    if (patternName) setHighlightedPattern(patternName);
    setShowArchitecture(true);
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      <PortalHeader
        currentPortalId={portalId}
        isArchitectureOpen={showArchitecture}
        onToggleArchitecture={() => setShowArchitecture(!showArchitecture)}
      />

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1">
        {showArchitecture ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setShowArchitecture(false)}
                className="btn-secondary text-xs"
              >
                ← Return to {HOSPITAL_PORTALS[portalId]?.name || 'Dashboard'}
              </button>
            </div>
            <ArchitectureExplorer initialSelectedPattern={highlightedPattern} />
          </div>
        ) : (
          children
        )}
      </main>

      <LivePatternTraceDrawer onNavigateToArchitecture={handleNavigateToArchitecture} />
    </div>
  );
};
