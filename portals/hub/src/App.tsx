import React, { useState } from 'react';
import { PortalLayout } from '@shared/components/layout/PortalLayout';
import { GlassCard } from '@shared/components/common/GlassCard';
import { StatCard } from '@shared/components/common/StatCard';
import { Badge } from '@shared/components/common/Badge';
import { useHospitalData } from '@shared/context/HospitalDataContext';
import { 
  Building2, 
  Stethoscope, 
  HeartHandshake, 
  UserCheck, 
  FlaskConical, 
  Pill, 
  Receipt, 
  ExternalLink,
  Sparkles,
  Layers,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Cpu
} from 'lucide-react';

export default function App() {
  const { patients, admissions, appointments, labOrders, prescriptions, bills, config } = useHospitalData();

  const totalBeds = config?.departments.reduce((acc, d) => acc + d.totalBeds, 0) || 150;
  const occupiedBeds = config?.departments.reduce((acc, d) => acc + d.occupiedBeds, 0) || 104;

  const portals = [
    {
      id: 'doctor',
      name: 'Doctor Portal (Clinical Workbench)',
      user: 'Dr. Robert Vance, MD',
      role: 'Lead Consultant Cardiologist',
      port: 5175,
      url: 'http://localhost:5175',
      color: '#059669',
      badgeVariant: 'emerald' as const,
      icon: <Stethoscope size={24} />,
      desc: 'Inpatient & outpatient consultations, treatment plan prototyping, version snapshots, STAT diagnostic orders, and prescription enrichment.',
      patterns: ['Prototype', 'Memento', 'Flyweight', 'Decorator', 'Bridge', 'Builder', 'Iterator']
    },
    {
      id: 'admin',
      name: 'Hospital Administration Portal',
      user: 'Dr. Arthur Pendelton',
      role: 'Chief Medical Administrator',
      port: 5174,
      url: 'http://localhost:5174',
      color: '#6366f1',
      badgeVariant: 'indigo' as const,
      icon: <ShieldCheck size={24} />,
      desc: 'Universal hospital operational policies, department allocations, double-dispatch clinical analytics, certified reporting, and audit logs.',
      patterns: ['Singleton', 'Visitor', 'Template Method', 'Proxy']
    },
    {
      id: 'reception',
      name: 'Patient Intake & Reception',
      user: 'Sarah Jenkins',
      role: 'Senior Patient Intake Officer',
      port: 5177,
      url: 'http://localhost:5177',
      color: '#0ea5e9',
      badgeVariant: 'cyan' as const,
      icon: <UserCheck size={24} />,
      desc: 'Triage patient intake factory, intelligent physician assignment strategies, undoable appointment bookings, and patient check-in lifecycle.',
      patterns: ['Factory Method', 'Strategy', 'Command', 'State']
    },
    {
      id: 'nurse',
      name: 'Inpatient Nursing Station',
      user: 'Elena Rostova, RN',
      role: 'Head Clinical Nurse Specialist',
      port: 5176,
      url: 'http://localhost:5176',
      color: '#f43f5e',
      badgeVariant: 'rose' as const,
      icon: <HeartHandshake size={24} />,
      desc: 'Inpatient ward telemetry, vital signs threshold evaluation using grammar AST rules, and inter-departmental acute care coordination.',
      patterns: ['Interpreter', 'Mediator', 'Observer']
    },
    {
      id: 'lab',
      name: 'Diagnostic Pathology & Imaging',
      user: 'David Chen, MSc',
      role: 'Chief Diagnostics Technician',
      port: 5178,
      url: 'http://localhost:5178',
      color: '#8b5cf6',
      badgeVariant: 'indigo' as const,
      icon: <FlaskConical size={24} />,
      desc: 'Diagnostic orders workbench, vendor analyzer adapters, result validation, and STAT critical alerts broadcasting.',
      patterns: ['Adapter', 'Abstract Factory', 'Observer']
    },
    {
      id: 'pharmacy',
      name: 'Central Hospital Pharmacy',
      user: 'Priya Sharma, PharmD',
      role: 'Senior Clinical Pharmacist',
      port: 5179,
      url: 'http://localhost:5179',
      color: '#10b981',
      badgeVariant: 'emerald' as const,
      icon: <Pill size={24} />,
      desc: 'Prescription dispensing queue, decorated clinical instruction review, and shared medication formulary catalog.',
      patterns: ['Flyweight', 'Decorator']
    },
    {
      id: 'billing',
      name: 'Patient Accounts & Billing',
      user: 'Marcus Holloway',
      role: 'Insurance Claims Specialist',
      port: 5180,
      url: 'http://localhost:5180',
      color: '#f59e0b',
      badgeVariant: 'amber' as const,
      icon: <Receipt size={24} />,
      desc: 'Hierarchical composite invoice builder, multi-stage insurance claim adjudication pipeline, and payment recording.',
      patterns: ['Composite', 'Chain of Responsibility']
    }
  ];

  return (
    <PortalLayout portalId="hub">
      <div className="flex flex-col gap-6 animate-slide-up">
        {/* Hero Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-extrabold text-slate-900">Hospital Operations Gateway & Portals Hub</h2>
              <Badge variant="cyan" icon={<Cpu size={12} />}>
                Multi-Port Portal Architecture
              </Badge>
            </div>
            <p className="text-sm text-muted mt-1 max-w-3xl">
              MediFlow divides hospital operations into <strong>7 independent user portals running on dedicated ports</strong>, completely decoupled yet synchronized via the backend API and GoF pattern execution bus.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge badge-emerald">Backend Online :5001</span>
            <span className="badge badge-cyan">Hub Online :5173</span>
          </div>
        </div>

        {/* Global Hospital KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Monitored Inpatients"
            value={patients.length}
            subtext={`${patients.filter(p => p.priority === 'CRITICAL').length} Emergency Triage Flags`}
            icon={<UserCheck size={18} />}
            variant="cyan"
          />
          <StatCard
            label="Inpatient Ward Beds"
            value={`${occupiedBeds}/${totalBeds}`}
            subtext={`${Math.round((occupiedBeds/totalBeds)*100)}% Overall Bed Utilization`}
            icon={<Building2 size={18} />}
            variant="indigo"
          />
          <StatCard
            label="Active Prescriptions"
            value={prescriptions.length}
            subtext="Enriched via Decorator Pattern"
            icon={<Pill size={18} />}
            variant="emerald"
          />
          <StatCard
            label="Inpatient Invoices"
            value={`$${bills.reduce((acc, b) => acc + b.total, 0).toFixed(0)}`}
            subtext={`${bills.filter(b => b.insuranceClaim?.status === 'APPROVED').length} Claims Adjudicated`}
            icon={<Receipt size={18} />}
            variant="amber"
          />
        </div>

        {/* 7 Dedicated Portals Matrix */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Layers size={20} className="text-indigo" />
              Dedicated Persona Portals (Separate Ports)
            </h3>
            <span className="text-xs text-muted">Click any portal card to open its dedicated application</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {portals.map(p => (
              <GlassCard
                key={p.id}
                className="p-5 flex flex-col justify-between hover:border-indigo-400 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      style={{
                        width: '2.75rem',
                        height: '2.75rem',
                        borderRadius: '0.75rem',
                        background: `${p.color}15`,
                        color: p.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {p.icon}
                    </div>
                    <span
                      style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '9999px',
                        background: `${p.color}18`,
                        color: p.color,
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        fontFamily: 'monospace'
                      }}
                    >
                      PORT :{p.port}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900">{p.name}</h4>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    User: <strong>{p.user}</strong> ({p.role.split(' ')[0]})
                  </p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {p.desc}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.patterns.map(pat => (
                      <span key={pat} className="badge badge-indigo text-[10px]">
                        {pat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">http://localhost:{p.port}</span>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.785rem', gap: '0.35rem' }}
                  >
                    <span>Launch Portal</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
