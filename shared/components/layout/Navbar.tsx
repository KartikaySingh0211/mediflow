import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospitalData } from '../../context/HospitalDataContext';
import { PersonaQuickSwitcher } from './PersonaQuickSwitcher';
import { 
  HeartPulse, 
  RotateCcw, 
  Code2, 
  Bell, 
  ShieldCheck, 
  ChevronRight 
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { currentUser, activeRole } = useAuth();
  const { resetDatabase, careEvents } = useHospitalData();

  const openCareAlerts = careEvents.filter(c => c.status === 'OPEN').length;

  const handleReset = async () => {
    if (window.confirm('Reset all MediFlow hospital database records to fresh baseline demo state?')) {
      await resetDatabase();
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
        padding: '0.65rem 1.5rem'
      }}
    >
      <div className="max-w-7xl flex items-center justify-between gap-4">
        {/* Left Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onNavigate('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              cursor: 'pointer'
            }}
          >
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
              }}
            >
              <HeartPulse size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>MediFlow</h1>
                <span
                  style={{
                    background: 'var(--primary-100)',
                    color: 'var(--primary-700)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em'
                  }}
                >
                  23 GoF
                </span>
              </div>
              <p className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>Hospital Clinical & Pattern System</p>
            </div>
          </div>
        </div>

        {/* Center: Persona Quick Switcher */}
        <div className="hidden lg:flex items-center">
          <PersonaQuickSwitcher />
        </div>

        {/* Right Navigation & User Controls */}
        <div className="flex items-center gap-2.5">
          {/* Architecture Explorer Button */}
          <button
            onClick={() => onNavigate('architecture')}
            className={currentView === 'architecture' ? 'btn-primary' : 'btn-secondary'}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.825rem',
              gap: '0.4rem'
            }}
          >
            <Code2 size={16} />
            <span>Architecture Explorer</span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={handleReset}
            className="btn-secondary"
            style={{
              padding: '0.45rem 0.75rem',
              fontSize: '0.8rem',
              color: '#64748b'
            }}
            title="Reset hospital demo data to initial seed baseline"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset Data</span>
          </button>

          {/* Active Care Alerts Indicator */}
          {openCareAlerts > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '0.75rem',
                background: 'var(--rose-50)',
                border: '1px solid #fecdd3',
                color: 'var(--rose-600)',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              <Bell size={14} className="animate-pulse" />
              <span>{openCareAlerts} Alerts</span>
            </div>
          )}

          {/* Active Staff User Chip */}
          {currentUser && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.35rem 0.75rem 0.35rem 0.45rem',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '9999px',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
              }}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '9999px',
                  objectFit: 'cover'
                }}
              />
              <div style={{ lineHeight: 1.2 }}>
                <p className="text-xs font-bold" style={{ color: '#0f172a' }}>{currentUser.name}</p>
                <p className="text-xs text-muted" style={{ fontSize: '0.685rem' }}>
                  {currentUser.title.split(' ')[0]} ({activeRole?.toUpperCase()})
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
