import React, { useState } from 'react';
import { useHospitalData } from '../../context/HospitalDataContext';
import { 
  HeartPulse, 
  RotateCcw, 
  Code2, 
  Bell, 
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Stethoscope,
  HeartHandshake,
  UserCheck,
  FlaskConical,
  Pill,
  Receipt,
  LayoutGrid
} from 'lucide-react';

export interface PortalConfig {
  id: string;
  name: string;
  role: string;
  port: number;
  url: string;
  badgeColor: string;
  icon: React.ReactNode;
  user: {
    name: string;
    title: string;
    avatar: string;
  };
}

export const HOSPITAL_PORTALS: Record<string, PortalConfig> = {
  hub: {
    id: 'hub',
    name: 'Hospital Operations Hub',
    role: 'Central Gateway',
    port: 5173,
    url: 'http://localhost:5173',
    badgeColor: 'cyan',
    icon: <LayoutGrid size={16} />,
    user: {
      name: 'MediFlow Gateway',
      title: 'Operations Director',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    }
  },
  admin: {
    id: 'admin',
    name: 'Hospital Administration Portal',
    role: 'Chief Medical Administrator',
    port: 5174,
    url: 'http://localhost:5174',
    badgeColor: 'indigo',
    icon: <ShieldCheck size={16} />,
    user: {
      name: 'Dr. Arthur Pendelton',
      title: 'Hospital Governance & Policies',
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200'
    }
  },
  doctor: {
    id: 'doctor',
    name: 'Physician Clinical Workbench',
    role: 'Lead Consultant Cardiologist',
    port: 5175,
    url: 'http://localhost:5175',
    badgeColor: 'emerald',
    icon: <Stethoscope size={16} />,
    user: {
      name: 'Dr. Robert Vance, MD',
      title: 'Cardiology & Clinical Care',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
    }
  },
  nurse: {
    id: 'nurse',
    name: 'Inpatient Nursing Station',
    role: 'Head Clinical Nurse Specialist',
    port: 5176,
    url: 'http://localhost:5176',
    badgeColor: 'rose',
    icon: <HeartHandshake size={16} />,
    user: {
      name: 'Elena Rostova, RN',
      title: 'Ward Telemetry & Intensive Care',
      avatar: 'https://images.unsplash.com/photo-1594824813579-994bb01d51a8?auto=format&fit=crop&q=80&w=200'
    }
  },
  reception: {
    id: 'reception',
    name: 'Patient Intake & Reception',
    role: 'Senior Patient Intake Officer',
    port: 5177,
    url: 'http://localhost:5177',
    badgeColor: 'cyan',
    icon: <UserCheck size={16} />,
    user: {
      name: 'Sarah Jenkins',
      title: 'Front Desk & Triage Registration',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
    }
  },
  lab: {
    id: 'lab',
    name: 'Diagnostic Pathology & Imaging',
    role: 'Chief Diagnostics Technician',
    port: 5178,
    url: 'http://localhost:5178',
    badgeColor: 'indigo',
    icon: <FlaskConical size={16} />,
    user: {
      name: 'David Chen, MSc',
      title: 'Automated Analyzers & Radiologic PACS',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
    }
  },
  pharmacy: {
    id: 'pharmacy',
    name: 'Central Hospital Pharmacy',
    role: 'Senior Clinical Pharmacist',
    port: 5179,
    url: 'http://localhost:5179',
    badgeColor: 'emerald',
    icon: <Pill size={16} />,
    user: {
      name: 'Priya Sharma, PharmD',
      title: 'Formulary & Prescription Dispensing',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'
    }
  },
  billing: {
    id: 'billing',
    name: 'Patient Accounts & Billing',
    role: 'Insurance Claims Specialist',
    port: 5180,
    url: 'http://localhost:5180',
    badgeColor: 'amber',
    icon: <Receipt size={16} />,
    user: {
      name: 'Marcus Holloway',
      title: 'Composite Invoicing & Claims',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
    }
  }
};

interface PortalHeaderProps {
  currentPortalId: string;
  isArchitectureOpen?: boolean;
  onToggleArchitecture?: () => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  currentPortalId,
  isArchitectureOpen,
  onToggleArchitecture
}) => {
  const portal = HOSPITAL_PORTALS[currentPortalId] || HOSPITAL_PORTALS.hub;
  const { resetDatabase, careEvents } = useHospitalData();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const openCareAlerts = careEvents?.filter(c => c.status === 'OPEN').length || 0;

  const handleReset = async () => {
    if (window.confirm('Reset all hospital database records to fresh seed baseline?')) {
      await resetDatabase();
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
        padding: '0.65rem 1.5rem'
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Branding & Current Portal Indicator */}
        <div className="flex items-center gap-3">
          <a
            href={portal.url}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              textDecoration: 'none'
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
                <span className="text-xl font-bold" style={{ color: '#0f172a' }}>MediFlow</span>
                <span
                  style={{
                    background: 'var(--primary-100)',
                    color: 'var(--primary-700)',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em'
                  }}
                >
                  PORT {portal.port}
                </span>
              </div>
              <p className="text-xs text-muted font-semibold" style={{ fontSize: '0.75rem', color: '#0284c7' }}>
                {portal.name}
              </p>
            </div>
          </a>
        </div>

        {/* Center: Switch Portal Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="btn-secondary"
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.8rem',
              gap: '0.4rem',
              borderRadius: '9999px',
              border: '1px solid rgba(226, 232, 240, 0.95)',
              background: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            <span style={{ color: '#0284c7' }}>{portal.icon}</span>
            <span className="font-bold">Switch Portal</span>
            <ChevronDown size={14} />
          </button>

          {isDropdownOpen && (
            <div
              className="glass-elevated animate-slide-up"
              style={{
                position: 'absolute',
                top: '110%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '18rem',
                padding: '0.5rem',
                borderRadius: '1rem',
                background: 'rgba(255, 255, 255, 0.97)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                zIndex: 50
              }}
            >
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Hospital Dedicated Portals
              </div>
              <div className="flex flex-col gap-1">
                {Object.values(HOSPITAL_PORTALS).map(p => {
                  const isCurrent = p.id === currentPortalId;
                  return (
                    <a
                      key={p.id}
                      href={p.url}
                      onClick={() => setIsDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        background: isCurrent ? 'var(--primary-50)' : 'transparent',
                        color: isCurrent ? 'var(--primary-700)' : '#334155',
                        fontSize: '0.785rem',
                        fontWeight: isCurrent ? 700 : 500,
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: isCurrent ? 'var(--primary-600)' : '#64748b' }}>
                          {p.icon}
                        </span>
                        <span>{p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}</span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.685rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '9999px',
                          background: isCurrent ? 'var(--primary-200)' : '#f1f5f9',
                          color: isCurrent ? 'var(--primary-800)' : '#64748b',
                          fontFamily: 'monospace',
                          fontWeight: 700
                        }}
                      >
                        :{p.port}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions & Current User Card */}
        <div className="flex items-center gap-2.5">
          {onToggleArchitecture && (
            <button
              onClick={onToggleArchitecture}
              className={isArchitectureOpen ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                gap: '0.35rem'
              }}
            >
              <Code2 size={15} />
              <span className="hidden sm:inline">GoF Explorer</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="btn-secondary"
            style={{
              padding: '0.45rem 0.75rem',
              fontSize: '0.785rem',
              color: '#64748b'
            }}
            title="Reset database seed records"
          >
            <RotateCcw size={13} />
            <span className="hidden md:inline">Reset</span>
          </button>

          {openCareAlerts > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '0.75rem',
                background: 'var(--rose-50)',
                border: '1px solid #fecdd3',
                color: 'var(--rose-600)',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              <Bell size={13} className="animate-pulse" />
              <span>{openCareAlerts}</span>
            </div>
          )}

          {/* User Info Chip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.3rem 0.7rem 0.3rem 0.4rem',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '9999px',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
            }}
          >
            <img
              src={portal.user.avatar}
              alt={portal.user.name}
              style={{
                width: '1.85rem',
                height: '1.85rem',
                borderRadius: '9999px',
                objectFit: 'cover'
              }}
            />
            <div style={{ lineHeight: 1.15 }}>
              <p className="text-xs font-bold" style={{ color: '#0f172a' }}>{portal.user.name}</p>
              <p className="text-[10px] text-muted font-medium">
                {portal.role.split(' ')[0]} ({portal.id.toUpperCase()})
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
