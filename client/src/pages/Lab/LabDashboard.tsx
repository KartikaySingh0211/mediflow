import React, { useState } from 'react';
import { useHospitalData } from '../../context/HospitalDataContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassModal } from '../../components/common/GlassModal';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { LabOrder } from '../../types';
import { 
  FlaskConical, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Play, 
  FileCheck, 
  Building2, 
  Search, 
  Layers 
} from 'lucide-react';

export const LabDashboard: React.FC = () => {
  const { labOrders, completeLabOrderResults } = useHospitalData();

  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Result entry form state
  const [summary, setSummary] = useState('');
  const [paramName, setParamName] = useState('Biomarker Level');
  const [paramValue, setParamValue] = useState('0.045');
  const [paramUnit, setParamUnit] = useState('ng/mL');
  const [paramRef, setParamRef] = useState('< 0.014');
  const [paramStatus, setParamStatus] = useState<'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL'>('NORMAL');
  const [isCritical, setIsCritical] = useState(false);
  const [techNotes, setTechNotes] = useState('Analysis processed and verified via Lab Provider Adapter.');

  const handleOpenEnterResult = (order: LabOrder) => {
    setSelectedOrder(order);
    setSummary(`Diagnostic evaluation of ${order.testName} complete.`);
    if (order.category === 'RADIOLOGY') {
      setParamName('Imaging Contrast Finding');
      setParamValue('No acute filling defect / Verified');
      setParamUnit('');
      setParamRef('Normal Study');
    } else {
      setParamName('Primary Assay Parameter');
      setParamValue('14.2');
      setParamUnit('mg/dL');
      setParamRef('10 - 20');
    }
    setIsCritical(false);
    setIsResultModalOpen(true);
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    await completeLabOrderResults(
      selectedOrder.id,
      {
        summary,
        parameters: [
          {
            name: paramName,
            value: paramValue,
            unit: paramUnit,
            referenceRange: paramRef,
            status: isCritical ? 'CRITICAL' : paramStatus
          }
        ]
      },
      isCritical,
      techNotes
    );

    setIsResultModalOpen(false);
    setSelectedOrder(null);
  };

  const pendingOrders = labOrders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING');
  const completedOrders = labOrders.filter(o => o.status === 'COMPLETED');

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Diagnostic Pathology & Imaging Laboratory</h2>
            <Badge variant="indigo" icon={<FlaskConical size={12} />}>
              Adapter • Abstract Factory • Bridge • Observer
            </Badge>
          </div>
          <p className="text-sm text-muted mt-1">
            Diagnostic order intake, vendor format adapter normalization, and critical result observer broadcasting.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Queue"
          value={pendingOrders.length}
          subtext="Awaiting diagnostic processing"
          icon={<Clock size={18} />}
          variant="amber"
        />
        <StatCard
          label="STAT Urgent Orders"
          value={labOrders.filter(o => o.priority === 'STAT').length}
          subtext="Immediate emergency priority"
          icon={<AlertTriangle size={18} />}
          variant="rose"
        />
        <StatCard
          label="Completed Analyses"
          value={completedOrders.length}
          subtext="Verified through Provider Adapters"
          icon={<CheckCircle2 size={18} />}
          variant="emerald"
        />
        <StatCard
          label="Critical Observer Alerts"
          value={labOrders.filter(o => o.isCritical).length}
          subtext="Broadcasted to attending physicians"
          icon={<FlaskConical size={18} />}
          variant="indigo"
        />
      </div>

      {/* Orders Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Diagnostic Queue (2 Cols) */}
        <GlassCard className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">Diagnostic Order Intake Workbench</h3>
              <p className="text-xs text-muted">Normalize order payloads through provider-specific adapters</p>
            </div>
            <span className="badge badge-amber">{pendingOrders.length} Pending Processing</span>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="font-bold text-slate-700">All Diagnostic Orders Processed</p>
              <p className="text-xs mt-1">New test requests from attending physicians will appear here dynamically.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingOrders.map(order => (
                <div
                  key={order.id}
                  className="p-4 bg-white/85 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      style={{
                        padding: '0.65rem',
                        borderRadius: '0.75rem',
                        background: order.priority === 'STAT' ? 'var(--rose-100)' : 'var(--primary-100)',
                        color: order.priority === 'STAT' ? 'var(--rose-600)' : 'var(--primary-600)'
                      }}
                    >
                      <FlaskConical size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{order.testName}</h4>
                        <span className={`badge ${
                          order.priority === 'STAT' ? 'badge-rose' : (order.priority === 'URGENT' ? 'badge-amber' : 'badge-cyan')
                        }`}>
                          {order.priority}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        Patient: <strong>{order.patientName}</strong> • Ordered by: {order.doctorName}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                        <span>Provider: <strong className="text-indigo">{order.provider}</strong></span>
                        <span>Order #{order.orderNumber}</span>
                        <span>{new Date(order.orderDate).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEnterResult(order)}
                    className="btn-primary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    <FileCheck size={14} />
                    Run Adapter & Enter Results
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Recently Completed Tests with Telemetry Output */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-bold">Verified Results</h3>
              <p className="text-xs text-muted">Adapter normalized outputs</p>
            </div>
            <Badge variant="emerald">Verified</Badge>
          </div>

          <div className="flex flex-col gap-3" style={{ maxHeight: '550px', overflowY: 'auto' }}>
            {completedOrders.map(order => (
              <div key={order.id} className="p-3.5 bg-white/80 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{order.testName}</span>
                  {order.isCritical ? (
                    <span className="badge badge-rose">CRITICAL FLAG</span>
                  ) : (
                    <span className="badge badge-emerald">COMPLETED</span>
                  )}
                </div>

                <p className="text-xs text-slate-600">{order.patientName} • {order.provider}</p>

                {order.results && (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <p className="font-semibold text-slate-800">{order.results.summary}</p>
                    {order.results.parameters?.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600 mt-1">
                        <span>{p.name}:</span>
                        <strong>{p.value} {p.unit} (Ref: {p.referenceRange})</strong>
                      </div>
                    ))}
                  </div>
                )}

                <span className="text-xs text-muted">
                  Completed: {order.completionDate ? new Date(order.completionDate).toLocaleTimeString() : 'Verified'}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Enter Result Modal (Adapter Normalization & Observer Dispatch) */}
      <GlassModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title="Enter Diagnostic Findings (Adapter & Observer Patterns)"
        subtitle={`Normalizing analysis for ${selectedOrder?.testName} via ${selectedOrder?.provider} Adapter`}
        icon={<FileCheck size={20} />}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleResultSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinical Diagnostic Summary</label>
            <input
              type="text"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Parameter Analyzed</label>
              <input
                type="text"
                value={paramName}
                onChange={e => setParamName(e.target.value)}
                className="glass-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Measured Value</label>
              <input
                type="text"
                value={paramValue}
                onChange={e => setParamValue(e.target.value)}
                className="glass-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unit of Measurement</label>
              <input
                type="text"
                value={paramUnit}
                onChange={e => setParamUnit(e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Standard Reference Range</label>
              <input
                type="text"
                value={paramRef}
                onChange={e => setParamRef(e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          {/* Critical Value Flag Toggle */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-900 block">Mark as CRITICAL Laboratory Alert</span>
              <span className="text-xs text-rose-700">
                Trigger Observer Pattern event to immediately notify attending physician.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isCritical}
              onChange={e => setIsCritical(e.target.checked)}
              style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Technician Verification Notes</label>
            <input
              type="text"
              value={techNotes}
              onChange={e => setTechNotes(e.target.value)}
              className="glass-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsResultModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <CheckCircle2 size={16} />
              Normalize via Adapter & Notify Observers
            </button>
          </div>
        </form>
      </GlassModal>
    </div>
  );
};
