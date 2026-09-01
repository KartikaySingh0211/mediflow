import React, { useState } from 'react';
import { useHospitalData } from '../../context/HospitalDataContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassModal } from '../../components/common/GlassModal';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { OfficialHospitalReport } from '../../patterns/behavioral/TemplateMethod';
import { 
  Building2, 
  Settings, 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Bed, 
  Clock, 
  Save 
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    config,
    updateHospitalConfig,
    patients,
    admissions,
    appointments,
    bills,
    labOrders,
    auditLogs,
    runAnalyticsVisitor,
    generateHospitalReport
  } = useHospitalData();

  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'analytics' | 'reports' | 'audit'>('overview');
  
  // Singleton Config Form State
  const [hospitalName, setHospitalName] = useState(config?.hospitalName || 'MediFlow Metropolitan Medical Center');
  const [workingHours, setWorkingHours] = useState(config?.workingHours || '24/7 Continuous Clinical Operations');
  const [emergencyHotline, setEmergencyHotline] = useState(config?.emergencyHotline || '+1 (800) 555-FLOW (3569)');
  const [licenseNumber, setLicenseNumber] = useState(config?.licenseNumber || 'HOSP-LIC-2026-MED-9941');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Visitor Analytics State
  const [visitorResults, setVisitorResults] = useState<{ summary: Record<string, any>; highRisk: any[] } | null>(null);

  // Template Method Report State
  const [selectedReportType, setSelectedReportType] = useState<'PATIENT' | 'BILLING' | 'LABORATORY'>('BILLING');
  const [generatedReport, setGeneratedReport] = useState<OfficialHospitalReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateHospitalConfig({
      hospitalName,
      workingHours,
      emergencyHotline,
      licenseNumber
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRunVisitor = () => {
    const results = runAnalyticsVisitor();
    setVisitorResults(results);
  };

  const handleGenerateReport = (type: 'PATIENT' | 'BILLING' | 'LABORATORY') => {
    setSelectedReportType(type);
    let context: any = {};
    if (type === 'BILLING') context = { bills };
    else if (type === 'LABORATORY') context = { labOrders };
    else context = { patient: patients[0], vitals: [], labs: labOrders, prescriptions: [] };

    const report = generateHospitalReport(type, context);
    setGeneratedReport(report);
    setIsReportModalOpen(true);
  };

  const totalBeds = config?.departments.reduce((acc, d) => acc + d.totalBeds, 0) || 150;
  const occupiedBeds = config?.departments.reduce((acc, d) => acc + d.occupiedBeds, 0) || 104;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Hospital Administration Control Center</h2>
            <Badge variant="indigo" icon={<ShieldCheck size={12} />}>
              Singleton • Template Method • Visitor
            </Badge>
          </div>
          <p className="text-sm text-muted mt-1">
            Global institutional governance, system policy configuration, and cross-departmental intelligence audit.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-white/70 backdrop-blur rounded-xl border border-slate-200 shadow-sm">
          {[
            { id: 'overview', label: 'Overview', icon: <Building2 size={14} /> },
            { id: 'config', label: 'System Config (Singleton)', icon: <Settings size={14} /> },
            { id: 'analytics', label: 'Analytics (Visitor)', icon: <BarChart3 size={14} /> },
            { id: 'reports', label: 'Certified Reports (Template)', icon: <FileText size={14} /> },
            { id: 'audit', label: 'Audit Logs', icon: <Activity size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Inpatient Bed Occupancy"
          value={`${occupancyRate}%`}
          subtext={`${occupiedBeds} of ${totalBeds} licensed beds occupied`}
          icon={<Bed size={18} />}
          variant="indigo"
          trend="+4% this week"
        />
        <StatCard
          label="Registered Patients"
          value={patients.length}
          subtext={`${patients.filter(p => p.priority === 'CRITICAL').length} marked critical emergency`}
          icon={<Users size={18} />}
          variant="cyan"
        />
        <StatCard
          label="Active Admissions"
          value={admissions.filter(a => a.status === 'ADMITTED').length}
          subtext="Continuous inpatient telemetry"
          icon={<Activity size={18} />}
          variant="emerald"
        />
        <StatCard
          label="Compliance Audits"
          value={auditLogs.length}
          subtext="Immutable HIPAA audit log entries"
          icon={<ShieldCheck size={18} />}
          variant="amber"
        />
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Breakdown */}
          <GlassCard className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Building2 size={18} className="text-indigo" />
                Departmental Bed Capacity & Occupancy Matrix
              </h3>
              <Badge variant="indigo">Singleton Data</Badge>
            </div>

            <div className="flex flex-col gap-4">
              {config?.departments.map(dept => {
                const ratio = Math.round((dept.occupiedBeds / dept.totalBeds) * 100);
                return (
                  <div key={dept.id} className="p-3 bg-white/70 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <h4 className="text-sm font-bold">{dept.name}</h4>
                        <p className="text-xs text-muted">Head of Dept: {dept.head}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{dept.occupiedBeds} / {dept.totalBeds} Beds</span>
                        <span className="text-xs text-muted block">({ratio}% utilized)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          ratio > 85 ? 'bg-rose-500' : (ratio > 65 ? 'bg-amber-500' : 'bg-indigo-600')
                        }`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Quick Pattern Actions */}
          <GlassCard className="p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald" />
              Executive Pattern Actions
            </h3>
            <p className="text-xs text-muted">
              Trigger GoF patterns directly to audit hospital subsystems and generate certified institutional documents.
            </p>

            <button
              onClick={() => { setActiveTab('analytics'); handleRunVisitor(); }}
              className="btn-emerald w-full"
            >
              <BarChart3 size={16} />
              Run Hospital Visitor Analytics
            </button>

            <button
              onClick={() => handleGenerateReport('BILLING')}
              className="btn-primary w-full"
            >
              <FileText size={16} />
              Generate Financial Report (Template)
            </button>

            <button
              onClick={() => handleGenerateReport('LABORATORY')}
              className="btn-secondary w-full"
            >
              <FileText size={16} />
              Generate Lab Audit Report
            </button>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 mt-2">
              <p className="text-xs text-indigo-700 font-medium">
                💡 <strong>Architectural Note:</strong> The Admin console demonstrates how <code>Singleton</code> guarantees universal hospital constants while <code>Visitor</code> and <code>Template Method</code> decouple analytical algorithms.
              </p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 2: SYSTEM CONFIGURATION (Singleton Pattern) */}
      {activeTab === 'config' && (
        <GlassCard className="p-6 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Settings size={20} className="text-indigo" />
                Hospital Configuration Manager (Singleton Pattern)
              </h3>
              <p className="text-xs text-muted mt-1">
                Updates globally shared hospital metadata managed via <code>HospitalConfig.getInstance()</code>.
              </p>
            </div>
            <Badge variant="indigo">Singleton Class: HospitalConfig</Badge>
          </div>

          {saveSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} />
              Hospital configuration updated successfully via Singleton instance!
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hospital Entity Name
                </label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={e => setHospitalName(e.target.value)}
                  className="glass-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  State Health License Number
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  className="glass-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Emergency Medical Hotline
                </label>
                <input
                  type="text"
                  value={emergencyHotline}
                  onChange={e => setEmergencyHotline(e.target.value)}
                  className="glass-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Operational Working Hours
                </label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={e => setWorkingHours(e.target.value)}
                  className="glass-input"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button type="submit" className="btn-primary">
                <Save size={16} />
                Save Global Singleton Configuration
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* TAB 3: VISITOR PATTERN ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-6">
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 size={20} className="text-emerald" />
                  Double-Dispatch Hospital Visitor Analytics
                </h3>
                <p className="text-xs text-muted mt-1">
                  <code>AnalyticsVisitor</code> and <code>ClinicalRiskVisitor</code> traverse disparate Hospital Entities (Patient, Admission, LabOrder, Prescription) without mutating entity classes.
                </p>
              </div>
              <button onClick={handleRunVisitor} className="btn-emerald">
                <Activity size={16} />
                Execute Double-Dispatch Visitor
              </button>
            </div>

            {visitorResults ? (
              <div className="flex flex-col gap-6 animate-slide-up">
                {/* Metric Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(visitorResults.summary).map(([key, val]) => (
                    <div key={key} className="p-3 bg-white/80 rounded-xl border border-slate-200 text-center">
                      <p className="text-xs text-muted uppercase tracking-wider font-semibold">{key}</p>
                      <h4 className="text-2xl font-bold text-indigo mt-1">{val}</h4>
                    </div>
                  ))}
                </div>

                {/* High Risk Clinical Patients */}
                <div>
                  <h4 className="text-base font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-rose" />
                    High-Risk Patient Stratification (ClinicalRiskVisitor Output)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visitorResults.highRisk.map((p, idx) => (
                      <div key={idx} className="p-4 bg-white/85 rounded-xl border border-rose-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-bold">{p.name}</h5>
                          <span className="badge badge-rose">Risk Score: {p.score}</span>
                        </div>
                        <ul className="text-xs text-slate-600 flex flex-col gap-1 list-disc pl-4">
                          {p.factors.map((f: string, fIdx: number) => (
                            <li key={fIdx}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <BarChart3 size={48} className="mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-slate-600">Visitor has not been executed yet.</p>
                <p className="text-xs mt-1">Click "Execute Double-Dispatch Visitor" to visit all active hospital entities.</p>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* TAB 4: TEMPLATE METHOD REPORTS */}
      {activeTab === 'reports' && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText size={20} className="text-cyan" />
                Standardized Report Generator (Template Method Pattern)
              </h3>
              <p className="text-xs text-muted mt-1">
                Executes invariant 4-step pipeline: <code>collectData()</code> → <code>validateData()</code> → <code>processData()</code> → <code>formatOutput()</code>.
              </p>
            </div>
            <Badge variant="cyan">Template Method: ReportGenerator</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/80 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-800">Patient Inpatient Clinical Summary</h4>
                <p className="text-xs text-muted mt-1">
                  Synthesizes patient clinical history, emergency triage priority, allergies, and diagnostic timeline into an official medical discharge record.
                </p>
              </div>
              <button
                onClick={() => handleGenerateReport('PATIENT')}
                className="btn-secondary w-full mt-4"
              >
                Generate Patient Report
              </button>
            </div>

            <div className="p-4 bg-white/80 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-800">Hospital Financial & Insurance Audit</h4>
                <p className="text-xs text-muted mt-1">
                  Processes institutional revenue, itemized composite bill structures, and third-party insurance claim adjudication rates.
                </p>
              </div>
              <button
                onClick={() => handleGenerateReport('BILLING')}
                className="btn-primary w-full mt-4"
              >
                Generate Financial Report
              </button>
            </div>

            <div className="p-4 bg-white/80 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-800">Diagnostic Laboratory Utilization Audit</h4>
                <p className="text-xs text-muted mt-1">
                  Audits internal laboratory Cobas analyzer throughput, external HL7 partner orders, and STAT critical turnaround thresholds.
                </p>
              </div>
              <button
                onClick={() => handleGenerateReport('LABORATORY')}
                className="btn-secondary w-full mt-4"
              >
                Generate Lab Report
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Activity size={20} className="text-amber" />
                Immutable Hospital Audit Trail
              </h3>
              <p className="text-xs text-muted">All clinical actions and GoF design pattern triggers recorded for compliance.</p>
            </div>
            <span className="badge badge-amber">{auditLogs.length} Total Audit Events</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Pattern Used</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td className="text-xs text-muted">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="font-semibold">{log.actor} ({log.role})</td>
                    <td><span className="badge badge-indigo">{log.module}</span></td>
                    <td className="font-bold">{log.action}</td>
                    <td>
                      {log.patternUsed ? (
                        <span className="badge badge-cyan">{log.patternUsed}</span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-700">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Certified Report Modal */}
      <GlassModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={generatedReport?.title || 'Official Hospital Report'}
        subtitle={`Report ID: ${generatedReport?.reportId} • Certified: ${generatedReport?.complianceStatus}`}
        icon={<FileText size={20} />}
        maxWidth="max-w-4xl"
      >
        {generatedReport && (
          <div className="flex flex-col gap-4">
            {/* Header banner */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">Certifying Health Officer</p>
                <p className="text-sm font-bold text-slate-800">{generatedReport.certifyingOfficer}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Date of Certification</p>
                <p className="text-sm font-bold text-slate-800">{generatedReport.generatedDate}</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(generatedReport.summaryMetrics).map(([k, v]) => (
                <div key={k} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-center">
                  <p className="text-xs font-semibold text-slate-500 uppercase">{k}</p>
                  <p className="text-xl font-bold text-indigo-700 mt-1">{v}</p>
                </div>
              ))}
            </div>

            {/* Sections */}
            <div className="flex flex-col gap-3">
              {generatedReport.sections.map((s, idx) => (
                <div key={idx} className="p-3.5 bg-white rounded-xl border border-slate-200">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{s.heading}</h5>
                  <p className="text-sm text-slate-800 leading-relaxed">{s.content}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button onClick={() => window.print()} className="btn-secondary">
                Print Official Certified Document
              </button>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  );
};
