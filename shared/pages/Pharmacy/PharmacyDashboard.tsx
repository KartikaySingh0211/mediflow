import React, { useState } from 'react';
import { useHospitalData } from '../../context/HospitalDataContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassModal } from '../../components/common/GlassModal';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Prescription } from '../../types';
import { MedicationFlyweightFactory, MedicationMetadata } from '../../patterns/structural/Flyweight';
import { 
  Pill, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  ShieldCheck, 
  Package, 
  Sparkles,
  Search
} from 'lucide-react';

export const PharmacyDashboard: React.FC = () => {
  const { prescriptions, dispensePrescription } = useHospitalData();

  const [activeTab, setActiveTab] = useState<'queue' | 'formulary'>('queue');
  const [selectedDrug, setSelectedDrug] = useState<MedicationMetadata | null>(null);
  const [isDrugModalOpen, setIsDrugModalOpen] = useState(false);
  const [searchDrug, setSearchDrug] = useState('');

  const formularyDrugs = MedicationFlyweightFactory.getAllMedications().filter(d => 
    d.tradeName.toLowerCase().includes(searchDrug.toLowerCase()) ||
    d.genericName.toLowerCase().includes(searchDrug.toLowerCase()) ||
    d.therapeuticClass.toLowerCase().includes(searchDrug.toLowerCase())
  );

  const pendingRx = prescriptions.filter(p => p.status === 'PRESCRIBED' || p.status === 'VERIFIED');
  const dispensedRx = prescriptions.filter(p => p.status === 'DISPENSED');

  const handleDispense = async (prescriptionId: string) => {
    await dispensePrescription(prescriptionId);
  };

  const handleInspectFlyweight = (drug: MedicationMetadata) => {
    setSelectedDrug(drug);
    setIsDrugModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Hospital Pharmacy & Formulary Dispensing</h2>
            <Badge variant="emerald" icon={<Pill size={12} />}>
              Flyweight • Decorator
            </Badge>
          </div>
          <p className="text-sm text-muted mt-1">
            Shared medication metadata formulary, dynamically decorated clinical warnings, and safe medication dispensing.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white/70 backdrop-blur rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'queue' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock size={14} />
            <span>Dispensing Queue ({pendingRx.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('formulary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'formulary' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers size={14} />
            <span>Shared Formulary Pool (Flyweight)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Verification"
          value={pendingRx.length}
          subtext="Awaiting pharmacist sign-off"
          icon={<Clock size={18} />}
          variant="amber"
        />
        <StatCard
          label="Dispensed Prescriptions"
          value={dispensedRx.length}
          subtext="Medications released to wards"
          icon={<CheckCircle2 size={18} />}
          variant="emerald"
        />
        <StatCard
          label="Shared Flyweight Objects"
          value={MedicationFlyweightFactory.getPoolSize()}
          subtext="Reused intrinsic drug monographs"
          icon={<Layers size={18} />}
          variant="indigo"
        />
        <StatCard
          label="Decorated Instructions"
          value={prescriptions.reduce((acc, p) => acc + (p.items?.length || 0), 0)}
          subtext="Enriched dosage & timing directions"
          icon={<Sparkles size={18} />}
          variant="cyan"
        />
      </div>

      {/* TAB 1: DISPENSING QUEUE (Decorator Focus) */}
      {activeTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Queue (2 Cols) */}
          <GlassCard className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Prescription Dispensing Queue</h3>
                <p className="text-xs text-muted">Review decorated clinical instructions and verify drug interactions</p>
              </div>
              <span className="badge badge-amber">{pendingRx.length} Pending</span>
            </div>

            {pendingRx.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-500 opacity-60" />
                <p className="font-bold text-slate-700">Dispensing Queue Empty</p>
                <p className="text-xs mt-1">All patient medications have been safely verified and dispensed.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pendingRx.map(rx => (
                  <div
                    key={rx.id}
                    className="p-4 bg-white/85 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{rx.patientName}</h4>
                          <span className="badge badge-cyan">Rx #{rx.prescriptionNumber}</span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">Prescribed by {rx.doctorName} on {rx.date}</p>
                      </div>

                      <button
                        onClick={() => handleDispense(rx.id)}
                        className="btn-emerald"
                        style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                      >
                        <CheckCircle2 size={15} />
                        Verify & Dispense Medication
                      </button>
                    </div>

                    {/* Decorated Items Breakdown */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                      {rx.items?.map((item, idx) => (
                        <div key={idx} className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-emerald-950 text-sm">{item.medicationName} ({item.genericName})</span>
                            <span className="badge badge-emerald">{item.dosage}</span>
                          </div>

                          {/* Instructions (Decorator output) */}
                          <div className="mt-1 flex flex-col gap-0.5 text-slate-700">
                            {item.instructions?.map((inst, iIdx) => (
                              <p key={iIdx}>• {inst}</p>
                            ))}
                          </div>

                          {/* Warnings (Decorator output) */}
                          {item.warnings && item.warnings.length > 0 && (
                            <div className="mt-2 pt-1 border-t border-emerald-200/60 flex flex-col gap-0.5">
                              {item.warnings.map((warn, wIdx) => (
                                <p key={wIdx} className="text-rose-700 font-semibold">{warn}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* History of Dispensed Rx (1 Col) */}
          <GlassCard className="p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald" />
                Dispensed Records
              </h4>
              <Badge variant="emerald">Completed</Badge>
            </div>

            <div className="flex flex-col gap-3" style={{ maxHeight: '550px', overflowY: 'auto' }}>
              {dispensedRx.map(rx => (
                <div key={rx.id} className="p-3 bg-white/80 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{rx.patientName}</span>
                    <span className="badge badge-emerald">DISPENSED</span>
                  </div>
                  <p className="text-slate-500 mt-1">Rx #{rx.prescriptionNumber}</p>
                  <p className="text-slate-700 mt-1 font-medium">
                    {rx.items?.map(i => `${i.medicationName} ${i.dosage}`).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 2: SHARED FORMULARY POOL (Flyweight Focus) */}
      {activeTab === 'formulary' && (
        <GlassCard className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Layers size={20} className="text-indigo" />
                Shared Medication Metadata Formulary (Flyweight Pattern)
              </h3>
              <p className="text-xs text-muted mt-1">
                Intrinsic immutable drug monographs shared across thousands of patient prescriptions to optimize heap memory.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Filter formulary..."
                value={searchDrug}
                onChange={e => setSearchDrug(e.target.value)}
                className="glass-input pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {formularyDrugs.map(drug => (
              <div
                key={drug.id}
                onClick={() => handleInspectFlyweight(drug)}
                className="p-4 bg-white/80 rounded-xl border border-slate-200 hover:border-indigo-400 cursor-pointer shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="badge badge-indigo">Pregnancy Cat: {drug.pregnancyCategory}</span>
                  <span className="text-xs text-muted">ID: {drug.id}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-1">{drug.tradeName}</h4>
                <p className="text-xs text-slate-600 italic">{drug.genericName}</p>
                <p className="text-xs text-slate-500 mt-2">Class: <strong>{drug.therapeuticClass}</strong></p>
                <p className="text-xs text-muted">Manufacturer: {drug.manufacturer}</p>
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between text-xs text-indigo-600 font-semibold">
                  <span>Inspect Shared Flyweight</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Flyweight Monograph Inspector Modal */}
      <GlassModal
        isOpen={isDrugModalOpen}
        onClose={() => setIsDrugModalOpen(false)}
        title={selectedDrug ? `${selectedDrug.tradeName} (${selectedDrug.genericName})` : 'Drug Monograph'}
        subtitle="Flyweight Intrinsic Monograph Metadata (Immutable & Shared)"
        icon={<Pill size={20} />}
        maxWidth="max-w-xl"
      >
        {selectedDrug && (
          <div className="flex flex-col gap-4 text-sm">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <p className="text-xs text-indigo-800">
                <strong>Architectural Note:</strong> This exact object is shared across all patient prescriptions referencing <code>{selectedDrug.id}</code>. Extrinsic patient variables (dosage, frequency, duration) wrap this flyweight dynamically.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-muted uppercase font-bold block">Trade Name</span>
                <span className="font-bold text-slate-800">{selectedDrug.tradeName}</span>
              </div>
              <div>
                <span className="text-xs text-muted uppercase font-bold block">Generic Compound</span>
                <span className="font-bold text-slate-800">{selectedDrug.genericName}</span>
              </div>
              <div>
                <span className="text-xs text-muted uppercase font-bold block">Therapeutic Category</span>
                <span className="text-slate-800">{selectedDrug.therapeuticClass}</span>
              </div>
              <div>
                <span className="text-xs text-muted uppercase font-bold block">Manufacturer</span>
                <span className="text-slate-800">{selectedDrug.manufacturer}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-muted uppercase font-bold block mb-1">Standard Black-Box & Clinical Warnings</span>
              <ul className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200 flex flex-col gap-1 list-disc pl-4">
                {selectedDrug.standardWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button onClick={() => setIsDrugModalOpen(false)} className="btn-secondary">
                Close Monograph
              </button>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  );
};
