import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { GlassCard } from '../../components/common/GlassCard';
import { Badge } from '../../components/common/Badge';
import { 
  HeartPulse, 
  ShieldCheck, 
  UserCheck, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  Receipt, 
  ArrowRight, 
  Sparkles, 
  Lock 
} from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, switchPersona } = useAuth();
  const [email, setEmail] = useState('doctor@mediflow.health');
  const [password, setPassword] = useState('mediflow2026');
  const [isLoading, setIsLoading] = useState(false);

  const personas: Array<{
    role: UserRole;
    name: string;
    title: string;
    department: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      role: 'admin',
      name: 'Dr. Arthur Pendelton',
      title: 'Chief Medical Administrator',
      department: 'Hospital Governance',
      icon: <ShieldCheck size={20} />,
      color: '#6366f1'
    },
    {
      role: 'receptionist',
      name: 'Sarah Jenkins',
      title: 'Senior Patient Intake Officer',
      department: 'Front Desk & Triage',
      icon: <UserCheck size={20} />,
      color: '#0ea5e9'
    },
    {
      role: 'doctor',
      name: 'Dr. Robert Vance, MD',
      title: 'Lead Consultant Cardiologist',
      department: 'Cardiology & Medicine',
      icon: <Stethoscope size={20} />,
      color: '#059669'
    },
    {
      role: 'nurse',
      name: 'Elena Rostova, RN',
      title: 'Head Clinical Nurse Specialist',
      department: 'Inpatient & Intensive Care',
      icon: <HeartPulse size={20} />,
      color: '#f43f5e'
    },
    {
      role: 'lab_tech',
      name: 'David Chen, MSc',
      title: 'Chief Diagnostics Technician',
      department: 'Laboratory & Radiology',
      icon: <FlaskConical size={20} />,
      color: '#8b5cf6'
    },
    {
      role: 'pharmacist',
      name: 'Priya Sharma, PharmD',
      title: 'Senior Clinical Pharmacist',
      department: 'Hospital Central Pharmacy',
      icon: <Pill size={20} />,
      color: '#10b981'
    },
    {
      role: 'billing_officer',
      name: 'Marcus Holloway',
      title: 'Insurance Claim Specialist',
      department: 'Patient Accounts & Adjudication',
      icon: <Receipt size={20} />,
      color: '#f59e0b'
    }
  ];

  const handleQuickLogin = async (role: UserRole) => {
    setIsLoading(true);
    try {
      await switchPersona(role);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}
      className="bg-mesh"
    >
      <div className="w-full max-w-4xl flex flex-col gap-6 animate-slide-up">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <div
            style={{
              width: '3.75rem',
              height: '3.75rem',
              borderRadius: '1.25rem',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)'
            }}
          >
            <HeartPulse size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">MediFlow</h1>
          <p className="text-sm text-slate-600 max-w-md">
            Interactive Hospital Management & Clinical Workflow System implementing all <strong>23 Gang of Four (GoF) Design Patterns</strong>.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="cyan">7 Hospital Personas</Badge>
            <Badge variant="indigo">23 GoF Design Patterns</Badge>
            <Badge variant="emerald">Live Telemetry</Badge>
          </div>
        </div>

        {/* 1-Click Persona Matrix */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo" />
                Select Persona for Instant 1-Click Sign-In
              </h3>
              <p className="text-xs text-muted">
                Each persona unlocks dedicated dashboards, clinical capabilities, and pattern workflows.
              </p>
            </div>
            <span className="badge badge-indigo">Auth Facade Enabled</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {personas.map(p => (
              <div
                key={p.role}
                onClick={() => handleQuickLogin(p.role)}
                className="p-3.5 bg-white/80 hover:bg-white rounded-xl border border-slate-200 hover:border-indigo-400 cursor-pointer shadow-sm transition-all flex items-center gap-3.5 group"
              >
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    background: `${p.color}15`,
                    color: p.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {p.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{p.role.replace('_', ' ')}</h4>
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-indigo-600 transition-all" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-muted truncate">{p.department}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Fallback Credential Form */}
        <GlassCard className="p-6 max-w-lg mx-auto w-full">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Lock size={15} className="text-slate-400" />
            Or Sign In with Credentials (AuthFacade)
          </h4>
          <form onSubmit={handleManualLogin} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Staff Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="glass-input text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="glass-input text-xs"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={isLoading}>
              {isLoading ? 'Authenticating via Facade...' : 'Sign In with Facade Pattern'}
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};
