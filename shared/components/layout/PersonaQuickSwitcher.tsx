import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { 
  ShieldCheck, 
  UserCheck, 
  Stethoscope, 
  HeartPulse, 
  FlaskConical, 
  Pill, 
  Receipt, 
  Sparkles 
} from 'lucide-react';

export const PersonaQuickSwitcher: React.FC = () => {
  const { activeRole, switchPersona } = useAuth();

  const personas: Array<{
    role: UserRole;
    name: string;
    title: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    { role: 'admin', name: 'Admin', title: 'Dr. Arthur Pendelton', icon: <ShieldCheck size={15} />, color: '#6366f1' },
    { role: 'receptionist', name: 'Reception', title: 'Sarah Jenkins', icon: <UserCheck size={15} />, color: '#0ea5e9' },
    { role: 'doctor', name: 'Doctor', title: 'Dr. Robert Vance, MD', icon: <Stethoscope size={15} />, color: '#059669' },
    { role: 'nurse', name: 'Nurse', title: 'Elena Rostova, RN', icon: <HeartPulse size={15} />, color: '#f43f5e' },
    { role: 'lab_tech', name: 'Laboratory', title: 'David Chen, MSc', icon: <FlaskConical size={15} />, color: '#8b5cf6' },
    { role: 'pharmacist', name: 'Pharmacy', title: 'Priya Sharma, PharmD', icon: <Pill size={15} />, color: '#10b981' },
    { role: 'billing_officer', name: 'Billing', title: 'Marcus Holloway', icon: <Receipt size={15} />, color: '#f59e0b' }
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        overflowX: 'auto',
        padding: '0.35rem 0.5rem',
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(12px)',
        borderRadius: '9999px',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
      }}
    >
      <span
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          paddingLeft: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}
      >
        <Sparkles size={12} color="#0ea5e9" />
        Persona:
      </span>

      {personas.map(p => {
        const isActive = activeRole === p.role;
        return (
          <button
            key={p.role}
            onClick={() => switchPersona(p.role)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              border: isActive ? `1px solid ${p.color}` : '1px solid transparent',
              background: isActive
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 249, 255, 0.95))'
                : 'transparent',
              color: isActive ? p.color : '#475569',
              fontSize: '0.785rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              boxShadow: isActive ? `0 2px 10px rgba(0, 0, 0, 0.06), 0 0 0 2px ${p.color}22` : 'none',
              transition: 'all 0.18s ease'
            }}
            title={`${p.name}: ${p.title}`}
          >
            <span style={{ color: p.color }}>{p.icon}</span>
            <span>{p.name}</span>
          </button>
        );
      })}
    </div>
  );
};
