import React, { useState, useEffect } from 'react';
import { useHospitalData } from '../../context/HospitalDataContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassModal } from '../../components/common/GlassModal';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Bill } from '../../types';
import confetti from 'canvas-confetti';
import { 
  Receipt, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Layers, 
  DollarSign, 
  Plus, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { AiAnalysisModal } from '../../components/ai/AiAnalysisModal';
import { api, AiAnalysisRecord } from '../../services/api';

export const BillingDashboard: React.FC = () => {
  const {
    patients,
    bills,
    generateCompositeBill,
    processInsuranceClaim,
    recordPayment
  } = useHospitalData();

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isCreateBillModalOpen, setIsCreateBillModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // AI Claim Denial Audit State (Persisted in MongoDB Atlas)
  const [isAiAuditModalOpen, setIsAiAuditModalOpen] = useState(false);
  const [currentAiAudit, setCurrentAiAudit] = useState<AiAnalysisRecord | null>(null);
  const [isAiAuditLoading, setIsAiAuditLoading] = useState(false);
  const [billAiHistory, setBillAiHistory] = useState<AiAnalysisRecord[]>([]);

  // Claim Form State (Chain of Responsibility)
  const [insuranceProvider, setInsuranceProvider] = useState('BlueCross Health Assurance Corp');
  const [policyNumber, setPolicyNumber] = useState('BC-992384-H7');
  const [claimLoading, setClaimLoading] = useState(false);

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number>(150);
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'INSURANCE' | 'UPI'>('CARD');

  // Create Bill Form State (Composite)
  const [billPatientId, setBillPatientId] = useState(patients[0]?.id || '');

  useEffect(() => {
    if (!billPatientId && patients.length > 0) {
      setBillPatientId(patients[0].id);
    }
  }, [patients, billPatientId]);
  const [consultationFee, setConsultationFee] = useState<number>(350);
  const [labCharges, setLabCharges] = useState<number>(275);
  const [roomCharges, setRoomCharges] = useState<number>(1350);
  const [pharmacyCharges, setPharmacyCharges] = useState<number>(85);

  const handleOpenClaimModal = (bill: Bill) => {
    setSelectedBill(bill);
    setPolicyNumber(bill.insuranceClaim?.policyNumber || 'BC-992384-H7');
    setIsClaimModalOpen(true);
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    setClaimLoading(true);
    try {
      const updated = await processInsuranceClaim(selectedBill.id, insuranceProvider, policyNumber);
      setSelectedBill(updated);

      if (updated.insuranceClaim?.status === 'APPROVED') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } finally {
      setClaimLoading(false);
    }
  };

  const handleCreateCompositeBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === billPatientId) || patients[0];
    if (!patient) return;

    const groupsData = [
      {
        name: 'Physician Consultations & Clinical Triage',
        items: [
          { name: 'Lead Specialist Inpatient Consultation', category: 'Consultation', amount: Number(consultationFee), quantity: 1 }
        ]
      },
      {
        name: 'Diagnostic Laboratory & Imaging Studies',
        items: [
          { name: 'Diagnostic Assay & Imaging Workup', category: 'Laboratory', amount: Number(labCharges), quantity: 1 }
        ]
      },
      {
        name: 'Inpatient Ward Telemetry & Nursing Care',
        items: [
          { name: 'Hospital Room & Nursing Care per Day', category: 'Room', amount: Number(roomCharges), quantity: 1 }
        ]
      },
      {
        name: 'Inpatient Medications & Medical Supplies',
        items: [
          { name: 'Prescribed Pharmaceuticals Formulary', category: 'Pharmacy', amount: Number(pharmacyCharges), quantity: 1 }
        ]
      }
    ];

    await generateCompositeBill(patient.id, patient.name, groupsData);
    setIsCreateBillModalOpen(false);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    await recordPayment(selectedBill.id, Number(payAmount), payMethod);
    setIsPayModalOpen(false);
  };

  const handleRunAiAudit = async (bill: Bill) => {
    setSelectedBill(bill);
    setIsAiAuditLoading(true);
    setIsAiAuditModalOpen(true);
    try {
      const res = await api.analyzeBill(bill.id, 'Marcus Holloway (Billing)');
      setCurrentAiAudit(res);
      const history = await api.getAiAnalysesForTarget(bill.id);
      setBillAiHistory(history);
    } catch (err) {
      console.error('Failed to run AI bill audit:', err);
    } finally {
      setIsAiAuditLoading(false);
    }
  };

  const totalBilled = bills.reduce((acc, b) => acc + b.total, 0);
  const totalSettled = bills.reduce((acc, b) => {
    const paid = b.payments?.reduce((pAcc, p) => pAcc + p.amount, 0) || 0;
    return acc + paid;
  }, 0);

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Patient Accounts & Insurance Adjudication</h2>
            <Badge variant="amber" icon={<Receipt size={12} />}>
              Composite • Chain of Responsibility
            </Badge>
          </div>
          <p className="text-sm text-muted mt-1">
            Hierarchical composite invoice structures and multi-stage insurance claim validation pipelines.
          </p>
        </div>

        <button
          onClick={() => setIsCreateBillModalOpen(true)}
          className="btn-primary"
        >
          <Receipt size={16} />
          Create Composite Invoice (Composite)
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Institutional Billing"
          value={`$${totalBilled.toFixed(2)}`}
          subtext="Compiled via Composite pattern"
          icon={<DollarSign size={18} />}
          variant="indigo"
        />
        <StatCard
          label="Adjudicated & Settled"
          value={`$${totalSettled.toFixed(2)}`}
          subtext="Recovered via Claims & Payments"
          icon={<CheckCircle2 size={18} />}
          variant="emerald"
        />
        <StatCard
          label="Insurance Adjudications"
          value={bills.filter(b => b.insuranceClaim?.status === 'APPROVED').length}
          subtext="Passed 4-stage Chain validation"
          icon={<ShieldCheck size={18} />}
          variant="cyan"
        />
        <StatCard
          label="Pending Invoices"
          value={bills.filter(b => b.status === 'PENDING').length}
          subtext="Awaiting settlement"
          icon={<Receipt size={18} />}
          variant="amber"
        />
      </div>

      {/* Bills Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoices List (2 Cols) */}
        <GlassCard className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">Inpatient Invoices & Composite Statements</h3>
              <p className="text-xs text-muted">Hierarchical billing trees composed of departmental service groups</p>
            </div>
            <span className="badge badge-indigo">{bills.length} Invoices</span>
          </div>

          <div className="flex flex-col gap-4">
            {bills.map(bill => (
              <div
                key={bill.id}
                className="p-4 bg-white/85 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">{bill.patientName}</h4>
                      <span className={`badge ${
                        bill.status === 'PAID' ? 'badge-emerald' : (bill.status === 'PARTIAL' ? 'badge-cyan' : 'badge-amber')
                      }`}>
                        {bill.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted">Invoice #{bill.invoiceNumber} • Date: {bill.date}</p>
                  </div>

                  <div className="flex items-baseline gap-1 text-right">
                    <span className="text-xs text-muted">Total:</span>
                    <span className="text-xl font-bold text-slate-900">${bill.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Composite Groups Breakdown */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col gap-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Hierarchical Bill Structure (Composite Tree):
                  </span>
                  {bill.groups?.map((group, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-slate-200/60 pb-1 last:border-none">
                      <span className="font-semibold text-slate-800">{group.name} ({group.items?.length} items)</span>
                      <span className="text-slate-600 font-mono">
                        ${group.items?.reduce((acc, i) => acc + (i.amount * i.quantity), 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions & Claim Status */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div>
                    {bill.insuranceClaim ? (
                      <div className="flex items-center gap-2">
                        <span className={`badge ${
                          bill.insuranceClaim.status === 'APPROVED' ? 'badge-emerald' : 'badge-rose'
                        }`}>
                          Claim: {bill.insuranceClaim.status}
                        </span>
                        <span className="text-xs text-muted">
                          Approved: ${bill.insuranceClaim.approvedAmount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted italic">No insurance claim filed yet.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunAiAudit(bill)}
                      className="btn-secondary"
                      style={{ 
                        background: '#f5f3ff', 
                        color: '#6d28d9', 
                        borderColor: '#ddd6fe', 
                        padding: '0.4rem 0.8rem', 
                        fontSize: '0.785rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Sparkles size={13} className="text-purple-600" />
                      AI Denial Audit (Atlas)
                    </button>

                    <button
                      onClick={() => handleOpenClaimModal(bill)}
                      className="btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.785rem' }}
                    >
                      <ShieldCheck size={14} />
                      Submit Claim (Chain of Resp)
                    </button>

                    <button
                      onClick={() => { setSelectedBill(bill); setIsPayModalOpen(true); }}
                      className="btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.785rem' }}
                    >
                      <CreditCard size={14} />
                      Record Payment
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Right 1 Col: Chain of Responsibility Inspector */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-bold">Claim Pipeline Inspector</h3>
              <p className="text-xs text-muted">Chain of Responsibility stages</p>
            </div>
            <Badge variant="amber">CoR Pattern</Badge>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <strong>4-Stage Chain Architecture:</strong>
            <p className="mt-1">1. Policy Validator (Active status check)</p>
            <p>2. Coverage Validator (Inpatient procedure eligibility)</p>
            <p>3. Amount Limit Validator (Catastrophic cap check)</p>
            <p>4. Document Validator (Composite breakdown verify)</p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Recently Validated Claims:</h4>
            {bills.filter(b => b.insuranceClaim).map(b => (
              <div key={b.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{b.patientName}</span>
                  <span className={`badge ${
                    b.insuranceClaim?.status === 'APPROVED' ? 'badge-emerald' : 'badge-rose'
                  }`}>
                    {b.insuranceClaim?.status}
                  </span>
                </div>

                <div className="flex flex-col gap-1 pl-2 border-l-2 border-indigo-300">
                  {b.insuranceClaim?.stages?.map((stage, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-medium">{stage.stage}</span>
                      <span className={stage.passed ? 'text-emerald font-bold' : 'text-rose font-bold'}>
                        {stage.passed ? '✓ PASSED' : '✕ FAILED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Insurance Claim Modal (Chain of Responsibility) */}
      <GlassModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        title="Adjudicate Insurance Claim (Chain of Responsibility)"
        subtitle={`Claim pipeline for ${selectedBill?.patientName} (Invoice Total: $${selectedBill?.total.toFixed(2)})`}
        icon={<ShieldCheck size={20} />}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleClaimSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Insurance Provider</label>
            <select
              value={insuranceProvider}
              onChange={e => setInsuranceProvider(e.target.value)}
              className="glass-input"
            >
              <option value="BlueCross Health Assurance Corp">BlueCross Health Assurance Corp</option>
              <option value="UnitedHealthcare Global Tier 1">UnitedHealthcare Global Tier 1</option>
              <option value="Aetna Comprehensive Care">Aetna Comprehensive Care</option>
              <option value="Medicare Institutional Part A">Medicare Institutional Part A</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Policy ID Number</label>
            <input
              type="text"
              value={policyNumber}
              onChange={e => setPolicyNumber(e.target.value)}
              className="glass-input"
              required
            />
            <span className="text-xs text-muted block mt-1">
              Tip: Include 'EXPIRED' in policy number to test Chain of Responsibility rejection handling.
            </span>
          </div>

          {/* If already submitted, display stages */}
          {selectedBill?.insuranceClaim && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Chain of Responsibility Pipeline Telemetry:
              </h5>
              {selectedBill.insuranceClaim.stages.map((stage, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className={stage.passed ? 'text-emerald font-bold' : 'text-rose font-bold'}>
                    {stage.passed ? '✓' : '✕'}
                  </span>
                  <div>
                    <strong className="text-slate-900">{stage.stage}:</strong> {stage.message}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsClaimModalOpen(false)} className="btn-secondary">
              Close
            </button>
            <button type="submit" className="btn-primary" disabled={claimLoading}>
              <ShieldCheck size={16} />
              {claimLoading ? 'Running Chain...' : 'Execute Chain of Responsibility Validation'}
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Create Composite Bill Modal */}
      <GlassModal
        isOpen={isCreateBillModalOpen}
        onClose={() => setIsCreateBillModalOpen(false)}
        title="Compile Inpatient Composite Bill (Composite Pattern)"
        subtitle="Builds hierarchical invoice tree treating individual items and service groups uniformly"
        icon={<Receipt size={20} />}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateCompositeBillSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Inpatient</label>
            <select
              value={billPatientId}
              onChange={e => setBillPatientId(e.target.value)}
              className="glass-input"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Consultation Fees ($)</label>
              <input
                type="number"
                value={consultationFee}
                onChange={e => setConsultationFee(Number(e.target.value))}
                className="glass-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Diagnostics / Lab ($)</label>
              <input
                type="number"
                value={labCharges}
                onChange={e => setLabCharges(Number(e.target.value))}
                className="glass-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Inpatient Ward & Bed ($)</label>
              <input
                type="number"
                value={roomCharges}
                onChange={e => setRoomCharges(Number(e.target.value))}
                className="glass-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pharmacy Dispensed ($)</label>
              <input
                type="number"
                value={pharmacyCharges}
                onChange={e => setPharmacyCharges(Number(e.target.value))}
                className="glass-input"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800">
            <strong>Composite Pattern:</strong> Will construct 4 <code>BillGroup</code> composite branches with child <code>BillItem</code> leaves, calculating recursive subtotal and tax automatically.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsCreateBillModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Receipt size={16} />
              Build Composite Invoice
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Record Payment Modal */}
      <GlassModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Record Patient Payment"
        subtitle={`Invoice #${selectedBill?.invoiceNumber} (Total: $${selectedBill?.total.toFixed(2)})`}
        icon={<CreditCard size={20} />}
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePaySubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Amount ($)</label>
            <input
              type="number"
              value={payAmount}
              onChange={e => setPayAmount(Number(e.target.value))}
              className="glass-input"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
            <select
              value={payMethod}
              onChange={e => setPayMethod(e.target.value as any)}
              className="glass-input"
            >
              <option value="CARD">Credit / Debit Card</option>
              <option value="CASH">Direct Cash</option>
              <option value="INSURANCE">Insurance Settlement</option>
              <option value="UPI">UPI / Digital Wire</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsPayModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-emerald">
              Record Transaction
            </button>
          </div>
        </form>
      </GlassModal>

      {/* AI Pre-Submission Claim Denial Audit Modal */}
      <AiAnalysisModal
        isOpen={isAiAuditModalOpen}
        onClose={() => setIsAiAuditModalOpen(false)}
        analysis={currentAiAudit}
        isLoading={isAiAuditLoading}
        onRerun={() => selectedBill && handleRunAiAudit(selectedBill)}
        pastAnalyses={billAiHistory}
        title={`AI Claim Denial Audit: Invoice #${selectedBill?.invoiceNumber || ''} (${selectedBill?.patientName || ''})`}
      />
    </div>
  );
};

