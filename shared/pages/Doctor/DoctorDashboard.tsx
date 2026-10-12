import React, { useState } from 'react';
import { useHospitalData } from '../../context/HospitalDataContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassModal } from '../../components/common/GlassModal';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Patient, TreatmentPlan, LabOrder, Prescription } from '../../types';
import { STANDARD_TREATMENT_PROTOTYPES } from '../../patterns/creational/Prototype';
import { MedicationFlyweightFactory } from '../../patterns/structural/Flyweight';
import { MedicalHistoryIterator, MedicalHistoryEntry } from '../../patterns/behavioral/Iterator';
import { 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  FileText, 
  Bed, 
  History, 
  Copy, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Plus, 
  Save, 
  Lock,
  Sparkles
} from 'lucide-react';
import { AiAnalysisModal } from '../../components/ai/AiAnalysisModal';
import { api, AiAnalysisRecord } from '../../services/api';

export const DoctorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    patients,
    admissions,
    appointments,
    labOrders,
    prescriptions,
    treatmentPlans,
    createInpatientAdmission,
    dischargePatient,
    cloneTreatmentPlanPrototype,
    saveTreatmentPlanVersion,
    restoreTreatmentPlanVersion,
    orderDiagnosticTest,
    createPrescriptionWithDecorators,
    getSecurePatientRecord,
    getPatientTimelineIterator
  } = useHospitalData();

  const [selectedPatient, setSelectedPatient] = useState<Patient>(patients[0] || null);

  // Modals
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isProtoModalOpen, setIsProtoModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isPlanHistoryModalOpen, setIsPlanHistoryModalOpen] = useState(false);

  // AI Clinical Intelligence State (Persisted in MongoDB Atlas)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [currentAiAnalysis, setCurrentAiAnalysis] = useState<AiAnalysisRecord | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [patientAiHistory, setPatientAiHistory] = useState<AiAnalysisRecord[]>([]);

  // Lab Order State (Abstract Factory + Bridge + Adapter)
  const [testCode, setTestCode] = useState('CARD-TROP-I');
  const [testName, setTestName] = useState('High-Sensitivity Troponin I & CK-MB');
  const [category, setCategory] = useState<'BLOOD' | 'RADIOLOGY' | 'PATHOLOGY'>('BLOOD');
  const [provider, setProvider] = useState<'INTERNAL' | 'EXTERNAL' | 'RADIOLOGY_CENTER'>('INTERNAL');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'STAT'>('URGENT');

  // Prescription State (Flyweight + Decorator)
  const [selectedMedId, setSelectedMedId] = useState('med_atorvastatin');
  const [dosage, setDosage] = useState('40 mg PO');
  const [frequency, setFrequency] = useState('Once daily at bedtime');
  const [timing, setTiming] = useState('Take with a glass of water before sleep');
  const [warning, setWarning] = useState('Avoid consuming grapefruit or grapefruit juice');

  // Admission Builder State (Builder)
  const [admitWard, setAdmitWard] = useState('Cardio Inpatient Ward 3');
  const [admitRoom, setAdmitRoom] = useState('Room 302');
  const [admitBed, setAdmitBed] = useState('Bed C-04');
  const [admitPriority, setAdmitPriority] = useState<'NORMAL' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [admitReason, setAdmitReason] = useState('Unstable Angina observation & telemetry');

  // Timeline Iterator state
  const [timelineItems, setTimelineItems] = useState<MedicalHistoryEntry[]>([]);

  // Selected Treatment Plan for editing/memento
  const patientTreatmentPlans = treatmentPlans.filter(tp => tp.patientId === selectedPatient?.id);
  const activePlan = patientTreatmentPlans[0] || null;
  const [planEditDiagnosis, setPlanEditDiagnosis] = useState(activePlan?.diagnosis || '');
  const [planEditMed, setPlanEditMed] = useState(activePlan?.medications.join(', ') || '');
  const [planEditInstructions, setPlanEditInstructions] = useState(activePlan?.instructions.join('\n') || '');
  const [planVersionNote, setPlanVersionNote] = useState('');

  const handleOpenTimeline = () => {
    if (!selectedPatient) return;
    const iterator = getPatientTimelineIterator(selectedPatient);
    setTimelineItems(iterator.getAllRemaining());
    setIsTimelineModalOpen(true);
  };

  const handleRunAiAnalysis = async () => {
    if (!selectedPatient) return;
    setIsAiLoading(true);
    setIsAiModalOpen(true);
    try {
      const res = await api.analyzePatient(selectedPatient.id, currentUser?.name || 'Dr. Robert Vance, MD');
      setCurrentAiAnalysis(res);
      const history = await api.getAiAnalysesForTarget(selectedPatient.id);
      setPatientAiHistory(history);
    } catch (err) {
      console.error('Failed to run AI clinical analysis:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleOrderLabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    await orderDiagnosticTest({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: currentUser?.id || 'doc_1',
      doctorName: currentUser?.name || 'Dr. Robert Vance, MD',
      testCode,
      testName,
      category,
      provider,
      priority
    });

    setIsLabModalOpen(false);
  };

  const handleCreatePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    await createPrescriptionWithDecorators(
      selectedPatient.id,
      selectedPatient.name,
      currentUser?.id || 'doc_1',
      currentUser?.name || 'Dr. Robert Vance, MD',
      selectedMedId,
      dosage,
      frequency,
      timing,
      warning
    );

    setIsRxModalOpen(false);
  };

  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    await createInpatientAdmission(builder => 
      builder
        .setPatient(selectedPatient.id, selectedPatient.name)
        .assignDoctor(currentUser?.id || 'doc_1', currentUser?.name || 'Dr. Robert Vance, MD')
        .assignDepartment('Cardiology')
        .setWard(admitWard)
        .assignRoom(admitRoom)
        .assignBed(admitBed)
        .setPriority(admitPriority)
        .setAdmissionReason(admitReason)
    );

    setIsAdmitModalOpen(false);
  };

  const handleClonePrototype = async (templateId: string) => {
    if (!selectedPatient) return;
    await cloneTreatmentPlanPrototype(
      templateId,
      selectedPatient.id,
      selectedPatient.name,
      currentUser?.id || 'doc_1',
      currentUser?.name || 'Dr. Robert Vance, MD'
    );
    setIsProtoModalOpen(false);
  };

  const handleSavePlanVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan) return;

    await saveTreatmentPlanVersion(
      activePlan.id,
      {
        diagnosis: planEditDiagnosis,
        medications: planEditMed.split(',').map(m => m.trim()),
        instructions: planEditInstructions.split('\n').map(i => i.trim()).filter(Boolean)
      },
      planVersionNote || `Clinical iteration by ${currentUser?.name}`
    );

    setPlanVersionNote('');
    alert('Treatment plan version saved via Memento snapshot!');
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    if (!activePlan) return;
    if (window.confirm(`Roll back treatment plan to historical Version ${versionNumber}?`)) {
      await restoreTreatmentPlanVersion(activePlan.id, versionNumber);
      setIsPlanHistoryModalOpen(false);
    }
  };

  const formularyDrugs = MedicationFlyweightFactory.getAllMedications();

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Physician Clinical Workbench</h2>
            <Badge variant="emerald" icon={<Stethoscope size={12} />}>
              Builder • Prototype • Memento • Flyweight • Decorator • Bridge
            </Badge>
          </div>
          <p className="text-sm text-muted mt-1">
            Consultation management, diagnostic orders, clinical treatment protocols, and prescription enrichment.
          </p>
        </div>

        {/* Patient Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Consulting Patient:</span>
          <select
            value={selectedPatient?.id}
            onChange={e => {
              const p = patients.find(pat => pat.id === e.target.value);
              if (p) setSelectedPatient(p);
            }}
            className="glass-input text-xs font-bold text-slate-800"
            style={{ width: 'auto' }}
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.mrn} - {p.priority})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Active Profile Card */}
      {selectedPatient && (
        <GlassCard className="p-6 bg-white/85">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '1rem',
                  background: selectedPatient.priority === 'CRITICAL' ? 'var(--rose-100)' : 'var(--emerald-100)',
                  color: selectedPatient.priority === 'CRITICAL' ? 'var(--rose-600)' : 'var(--emerald-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.25rem'
                }}
              >
                {selectedPatient.name.split(' ').map(n => n[0]).join('')}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{selectedPatient.name}</h3>
                  <span className={`badge ${
                    selectedPatient.priority === 'CRITICAL' ? 'badge-rose' : 'badge-emerald'
                  }`}>
                    {selectedPatient.priority}
                  </span>
                  <span className="badge badge-indigo">{selectedPatient.status}</span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  MRN: <strong>{selectedPatient.mrn}</strong> • {selectedPatient.age}y {selectedPatient.gender} • Blood Group: <strong>{selectedPatient.bloodGroup}</strong> • Room: {selectedPatient.room || 'Outpatient'}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  Primary Diagnosis: <span className="text-indigo">{selectedPatient.diagnosis || 'Clinical Assessment Ongoing'}</span>
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handleRunAiAnalysis} 
                className="btn-primary" 
                style={{ 
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
                  color: 'white', 
                  padding: '0.45rem 0.85rem', 
                  fontSize: '0.8rem',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                }}
              >
                <Sparkles size={14} className="animate-spin text-amber-300" style={{ animationDuration: '3s' }} />
                AI Clinical Acuity (Atlas)
              </button>
              <button onClick={handleOpenTimeline} className="btn-secondary" style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}>
                <History size={14} />
                Medical Timeline (Iterator)
              </button>
              <button onClick={() => setIsLabModalOpen(true)} className="btn-primary" style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}>
                <FlaskConical size={14} />
                Order Lab Test (Bridge)
              </button>
              <button onClick={() => setIsRxModalOpen(true)} className="btn-emerald" style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}>
                <Pill size={14} />
                Prescribe Drug (Decorator)
              </button>
              <button onClick={() => setIsAdmitModalOpen(true)} className="btn-secondary" style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}>
                <Bed size={14} />
                Inpatient Admit (Builder)
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Main Grid: Treatment Plan (Prototype + Memento) & Clinical Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Clinical Treatment Plan (Prototype & Memento) */}
        <GlassCard className="p-6 lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText size={18} className="text-indigo" />
                Active Clinical Treatment Plan (Prototype & Memento)
              </h3>
              <p className="text-xs text-muted">
                Clone from clinical protocol prototype and track version snapshots with instant rollback.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsProtoModalOpen(true)}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                <Copy size={13} />
                Clone Prototype Template
              </button>

              {activePlan && activePlan.versions?.length > 0 && (
                <button
                  onClick={() => setIsPlanHistoryModalOpen(true)}
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                >
                  <RotateCcw size={13} />
                  Version History (v{activePlan.versions.length})
                </button>
              )}
            </div>
          </div>

          {activePlan ? (
            <form onSubmit={handleSavePlanVersion} className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                <div>
                  <h4 className="text-sm font-bold text-indigo-950">{activePlan.name}</h4>
                  <p className="text-xs text-indigo-700">
                    Active Version: <strong>v{activePlan.versions?.length || 1}</strong> • Last Updated: {new Date(activePlan.updatedAt).toLocaleTimeString()}
                  </p>
                </div>
                <Badge variant="indigo">Memento Active</Badge>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Diagnosis</label>
                <input
                  type="text"
                  value={planEditDiagnosis}
                  onChange={e => setPlanEditDiagnosis(e.target.value)}
                  className="glass-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Medication Regimen (Comma Separated)</label>
                <input
                  type="text"
                  value={planEditMed}
                  onChange={e => setPlanEditMed(e.target.value)}
                  className="glass-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinical Instructions & Telemetry Protocol</label>
                <textarea
                  rows={4}
                  value={planEditInstructions}
                  onChange={e => setPlanEditInstructions(e.target.value)}
                  className="glass-input"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Memento Version Revision Note</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Added Metoprolol dosage after telemetry review"
                    value={planVersionNote}
                    onChange={e => setPlanVersionNote(e.target.value)}
                    className="glass-input"
                  />
                  <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    <Save size={16} />
                    Capture Memento
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <FileText size={48} className="mx-auto mb-2 opacity-40" />
              <p className="font-bold text-slate-700">No Active Treatment Plan for {selectedPatient?.name}</p>
              <p className="text-xs mt-1">Click "Clone Prototype Template" to initiate a standardized clinical protocol.</p>
              <button
                onClick={() => setIsProtoModalOpen(true)}
                className="btn-primary mt-4"
              >
                <Copy size={16} />
                Select Clinical Protocol Prototype
              </button>
            </div>
          )}
        </GlassCard>

        {/* Right 1 Col: Diagnostic Labs & Active Rx List */}
        <div className="flex flex-col gap-6">
          {/* Lab Orders */}
          <GlassCard className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <FlaskConical size={16} className="text-cyan" />
                Diagnostic Orders
              </h4>
              <Badge variant="cyan">Bridge Pattern</Badge>
            </div>

            <div className="flex flex-col gap-2" style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {labOrders.filter(l => l.patientId === selectedPatient?.id).map(order => (
                <div key={order.id} className="p-2.5 bg-white/80 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">{order.testName}</span>
                    <span className={`badge ${order.status === 'COMPLETED' ? 'badge-emerald' : 'badge-amber'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-slate-600">Provider: <strong>{order.provider}</strong> • Order #{order.orderNumber}</p>
                  {order.results && (
                    <p className="text-emerald font-semibold mt-1">✓ {order.results.summary}</p>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Active Prescriptions */}
          <GlassCard className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Pill size={16} className="text-emerald" />
                Active Prescriptions
              </h4>
              <Badge variant="emerald">Decorator Pattern</Badge>
            </div>

            <div className="flex flex-col gap-2" style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {prescriptions.filter(p => p.patientId === selectedPatient?.id).map(rx => (
                <div key={rx.id} className="p-2.5 bg-white/80 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">Rx #{rx.prescriptionNumber}</span>
                    <span className={`badge ${rx.status === 'DISPENSED' ? 'badge-emerald' : 'badge-cyan'}`}>
                      {rx.status}
                    </span>
                  </div>
                  {rx.items?.map((item, idx) => (
                    <div key={idx} className="mt-1 pl-2 border-l-2 border-emerald-400">
                      <p className="font-semibold text-slate-900">{item.medicationName} ({item.dosage})</p>
                      <p className="text-slate-600">{item.frequency}</p>
                      {item.warnings?.length > 0 && (
                        <p className="text-rose font-medium text-xs mt-0.5">⚠️ {item.warnings[0]}</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Lab Order Modal (Abstract Factory + Bridge + Adapter) */}
      <GlassModal
        isOpen={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        title="Order Diagnostic Test (Bridge & Abstract Factory)"
        subtitle="Decouples diagnostic request type from underlying provider implementation"
        icon={<FlaskConical size={20} />}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleOrderLabSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Diagnostic Modality</label>
              <select
                value={category}
                onChange={e => {
                  const cat = e.target.value as any;
                  setCategory(cat);
                  if (cat === 'RADIOLOGY') {
                    setTestCode('RAD-CT-ANGIO-PULM');
                    setTestName('Contrast CT Pulmonary Angiography (CTPA)');
                    setProvider('RADIOLOGY_CENTER');
                  } else {
                    setTestCode('CARD-TROP-I');
                    setTestName('High-Sensitivity Troponin I & CK-MB');
                    setProvider('INTERNAL');
                  }
                }}
                className="glass-input"
              >
                <option value="BLOOD">Blood Chemistry & Biomarkers</option>
                <option value="RADIOLOGY">Radiology & CT/MRI PACS</option>
                <option value="PATHOLOGY">Histopathology & Microbiology</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Diagnostic Test Name</label>
              <input
                type="text"
                value={testName}
                onChange={e => setTestName(e.target.value)}
                className="glass-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Execution Provider (Bridge Implementor)</label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value as any)}
                className="glass-input"
              >
                <option value="INTERNAL">Internal Hospital Core Lab (Cobas e411)</option>
                <option value="EXTERNAL">Quest Diagnostics Partner API (HL7)</option>
                <option value="RADIOLOGY_CENTER">Radiology & Imaging Suite (DICOM)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinical Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="glass-input"
              >
                <option value="ROUTINE">ROUTINE (Standard TAT)</option>
                <option value="URGENT">URGENT (2 Hour Turnaround)</option>
                <option value="STAT">STAT (Emergency Resuscitation)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-xl text-xs text-cyan-800">
            <strong>Pattern Architecture:</strong> Bridges test abstraction with provider implementor. Dispatches through <code>Adapter</code> to normalize vendor-specific data structures.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsLabModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <FlaskConical size={16} />
              Dispatch Order via Bridge & Adapter
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Prescription Modal (Flyweight + Decorator) */}
      <GlassModal
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
        title="Prescribe Medication (Flyweight & Decorator Patterns)"
        subtitle="Reuses shared drug metadata (Flyweight) and dynamically attaches clinical warnings (Decorator)"
        icon={<Pill size={20} />}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreatePrescriptionSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Drug from Formulary Pool (Flyweight Shared Monograph)
            </label>
            <select
              value={selectedMedId}
              onChange={e => setSelectedMedId(e.target.value)}
              className="glass-input"
            >
              {formularyDrugs.map(d => (
                <option key={d.id} value={d.id}>
                  {d.tradeName} ({d.genericName}) — {d.therapeuticClass} [Mfg: {d.manufacturer}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Dosage & Administration Route (DosageDecorator)
              </label>
              <input
                type="text"
                value={dosage}
                onChange={e => setDosage(e.target.value)}
                className="glass-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Timing Protocol (TimingDecorator)
              </label>
              <input
                type="text"
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="glass-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Patient Directions (FoodInstructionDecorator)
            </label>
            <input
              type="text"
              value={timing}
              onChange={e => setTiming(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Specialized Warning Caveats (WarningDecorator)
            </label>
            <input
              type="text"
              value={warning}
              onChange={e => setWarning(e.target.value)}
              className="glass-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsRxModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-emerald">
              <Pill size={16} />
              Enrich with Decorators & Prescribe
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Admission Builder Modal (Builder Pattern) */}
      <GlassModal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        title="Inpatient Ward Admission (Builder Pattern)"
        subtitle="Fluent step-by-step construction of complex Admission entity"
        icon={<Bed size={20} />}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleAdmitSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Inpatient Ward</label>
              <select
                value={admitWard}
                onChange={e => setAdmitWard(e.target.value)}
                className="glass-input"
              >
                <option value="Cardio Inpatient Ward 3">Cardio Inpatient Ward 3</option>
                <option value="Emergency Trauma Bays">Emergency Trauma Bays</option>
                <option value="Main ICU Wing">Main ICU Wing</option>
                <option value="Surgical Recovery Ward">Surgical Recovery Ward</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority Classification</label>
              <select
                value={admitPriority}
                onChange={e => setAdmitPriority(e.target.value as any)}
                className="glass-input"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH (Telemetry)</option>
                <option value="CRITICAL">CRITICAL (Intensive Care)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Room Assignment</label>
              <input
                type="text"
                value={admitRoom}
                onChange={e => setAdmitRoom(e.target.value)}
                className="glass-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bed Number</label>
              <input
                type="text"
                value={admitBed}
                onChange={e => setAdmitBed(e.target.value)}
                className="glass-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinical Admission Justification</label>
            <input
              type="text"
              value={admitReason}
              onChange={e => setAdmitReason(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsAdmitModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Bed size={16} />
              Build Admission via Builder Pattern
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Prototype Selection Modal */}
      <GlassModal
        isOpen={isProtoModalOpen}
        onClose={() => setIsProtoModalOpen(false)}
        title="Clone Treatment Protocol Template (Prototype Pattern)"
        subtitle="Instantiate an independent deep copy of a clinical protocol baseline"
        icon={<Copy size={20} />}
        maxWidth="max-w-3xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STANDARD_TREATMENT_PROTOTYPES.map(proto => (
            <div
              key={proto.templateId}
              className="p-4 bg-white/80 rounded-xl border border-slate-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="badge badge-indigo">{proto.targetDepartment}</span>
                  <span className="text-xs font-semibold text-slate-500">{proto.followUpSchedule}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{proto.name}</h4>
                <p className="text-xs text-muted mb-3">{proto.diagnosis}</p>
                <div className="text-xs text-slate-600 flex flex-col gap-1 mb-4">
                  <p><strong>Rx Baselines:</strong> {proto.medications.slice(0, 2).join(', ')}...</p>
                  <p><strong>Protocol:</strong> {proto.instructions[0]}</p>
                </div>
              </div>
              <button
                onClick={() => handleClonePrototype(proto.templateId)}
                className="btn-primary w-full"
              >
                <Copy size={15} />
                Deep-Clone Template for {selectedPatient?.name}
              </button>
            </div>
          ))}
        </div>
      </GlassModal>

      {/* Treatment Plan Memento Version History Modal */}
      <GlassModal
        isOpen={isPlanHistoryModalOpen}
        onClose={() => setIsPlanHistoryModalOpen(false)}
        title="Treatment Plan Version Snapshots (Memento Pattern)"
        subtitle={`Audit trail & rollback for plan "${activePlan?.name}"`}
        icon={<RotateCcw size={20} />}
        maxWidth="max-w-2xl"
      >
        <div className="flex flex-col gap-3">
          {activePlan?.versions?.map((ver, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-indigo">Version {ver.version}</span>
                  <span className="text-xs font-semibold text-slate-800">{ver.note}</span>
                </div>
                <p className="text-xs text-muted mt-1">
                  Captured at: {new Date(ver.timestamp).toLocaleString()}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Rx: {ver.snapshot.medications.join(', ')}
                </p>
              </div>
              <button
                onClick={() => handleRestoreVersion(ver.version)}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                <RotateCcw size={13} />
                Rollback State
              </button>
            </div>
          ))}
        </div>
      </GlassModal>

      {/* Patient Medical History Timeline Modal (Iterator Pattern) */}
      <GlassModal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        title={`Longitudinal Medical Record: ${selectedPatient?.name} (Iterator Pattern)`}
        subtitle="MedicalHistoryIterator uniformly traverses consultations, lab results, admissions, and surgeries"
        icon={<History size={20} />}
        maxWidth="max-w-3xl"
      >
        <div className="flex flex-col gap-4">
          <div className="relative pl-6 border-l-2 border-indigo-200 flex flex-col gap-4">
            {timelineItems.map((item, idx) => (
              <div key={idx} className="relative bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div
                  style={{
                    position: 'absolute',
                    left: '-1.95rem',
                    top: '1.25rem',
                    width: '0.9rem',
                    height: '0.9rem',
                    borderRadius: '9999px',
                    background: item.type === 'Surgery' ? '#f43f5e' : (item.type === 'Lab Result' ? '#0ea5e9' : '#10b981'),
                    border: '2px solid white'
                  }}
                />
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-indigo">{item.type}</span>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{item.date}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed mt-1">{item.description}</p>
                <p className="text-xs text-muted mt-2">Attending Clinician: <strong>{item.doctorName}</strong></p>
              </div>
            ))}
          </div>
        </div>
      </GlassModal>


      {/* AI Clinical Decision Support Modal (Backed by MongoDB Atlas) */}
      <AiAnalysisModal

        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        analysis={currentAiAnalysis}
        isLoading={isAiLoading}
        onRerun={handleRunAiAnalysis}
        pastAnalyses={patientAiHistory}
        title={`AI Clinical Acuity: ${selectedPatient?.name || 'Patient'} (${selectedPatient?.mrn || ''})`}
      />
    </div>
  );
};

