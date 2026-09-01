import React, { useState } from 'react';
import { useHospitalData } from '../../context/HospitalDataContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassModal } from '../../components/common/GlassModal';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Patient, VitalsRecord, CareEvent } from '../../types';
import { 
  HeartPulse, 
  Activity, 
  AlertTriangle, 
  Send, 
  Bed, 
  CheckCircle2, 
  Clock, 
  Thermometer, 
  Flame, 
  ShieldAlert, 
  Plus 
} from 'lucide-react';

export const NurseDashboard: React.FC = () => {
  const {
    patients,
    admissions,
    vitalsRecords,
    careEvents,
    clinicalRules,
    recordPatientVitals,
    dispatchCareEvent,
    resolveCareEvent
  } = useHospitalData();

  const [selectedPatient, setSelectedPatient] = useState<Patient>(patients[0] || null);

  // Vitals Form State (Interpreter Pattern)
  const [temperature, setTemperature] = useState<number>(37.2);
  const [heartRate, setHeartRate] = useState<number>(78);
  const [bloodPressureSys, setBloodPressureSys] = useState<number>(120);
  const [bloodPressureDia, setBloodPressureDia] = useState<number>(80);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(16);
  const [oxygenSaturation, setOxygenSaturation] = useState<number>(98);

  // Care Request State (Mediator Pattern)
  const [isCareModalOpen, setIsCareModalOpen] = useState(false);
  const [careTargetDept, setCareTargetDept] = useState('Central Hospital Pharmacy');
  const [careEventType, setCareEventType] = useState<CareEvent['eventType']>('MEDICATION_REQUIRED');
  const [careUrgency, setCareUrgency] = useState<CareEvent['urgency']>('URGENT');
  const [careMessage, setCareMessage] = useState('');

  const [lastVitalsResult, setLastVitalsResult] = useState<VitalsRecord | null>(null);

  const handleRecordVitalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const record = await recordPatientVitals({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      temperature: Number(temperature),
      heartRate: Number(heartRate),
      bloodPressureSys: Number(bloodPressureSys),
      bloodPressureDia: Number(bloodPressureDia),
      respiratoryRate: Number(respiratoryRate),
      oxygenSaturation: Number(oxygenSaturation)
    });

    setLastVitalsResult(record);
  };

  const handleDispatchCareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    await dispatchCareEvent(
      selectedPatient.id,
      selectedPatient.name,
      careTargetDept,
      careEventType,
      careUrgency,
      careMessage
    );

    setIsCareModalOpen(false);
    setCareMessage('');
  };

  const patientVitals = vitalsRecords.filter(v => v.patientId === selectedPatient?.id);

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Inpatient Nursing & Care Telemetry Station</h2>
            <Badge variant="rose" icon={<HeartPulse size={12} />}>
              Interpreter • Mediator • Observer
            </Badge>
          </div>
          <p className="text-sm text-muted mt-1">
            Real-time vital sign threshold evaluation, clinical grammar alert interpretation, and inter-departmental care coordination.
          </p>
        </div>

        <button
          onClick={() => setIsCareModalOpen(true)}
          className="btn-rose"
        >
          <Send size={16} />
          Dispatch Care Request (Mediator)
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monitored Inpatients"
          value={admissions.filter(a => a.status === 'ADMITTED').length}
          subtext="Assigned to inpatient telemetry"
          icon={<Bed size={18} />}
          variant="indigo"
        />
        <StatCard
          label="Active Clinical Rules"
          value={clinicalRules.filter(r => r.isActive).length}
          subtext="Interpreter grammar rules"
          icon={<ShieldAlert size={18} />}
          variant="cyan"
        />
        <StatCard
          label="Open Care Requests"
          value={careEvents.filter(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length}
          subtext="Mediator coordination queue"
          icon={<Activity size={18} />}
          variant="rose"
        />
        <StatCard
          label="Vitals Evaluated"
          value={vitalsRecords.length}
          subtext="Total telemetry submissions"
          icon={<HeartPulse size={18} />}
          variant="emerald"
        />
      </div>

      {/* Main Grid: Vitals Recorder (Interpreter) & Care Events (Mediator) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Vital Signs Entry & Interpreter AST Output */}
        <GlassCard className="p-6 lg:col-span-2 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Thermometer size={18} className="text-rose" />
                Vitals Telemetry Entry (Interpreter Pattern)
              </h3>
              <p className="text-xs text-muted">
                Entering vitals automatically executes dynamic grammar AST rules to evaluate physiological stability.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Patient:</span>
              <select
                value={selectedPatient?.id}
                onChange={e => {
                  const p = patients.find(pat => pat.id === e.target.value);
                  if (p) setSelectedPatient(p);
                }}
                className="glass-input text-xs font-bold"
                style={{ width: 'auto' }}
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.room || 'Outpatient'})</option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleRecordVitalsSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Body Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={e => setTemperature(Number(e.target.value))}
                  className={`glass-input ${temperature > 38.5 ? 'border-rose-400 bg-rose-50/50 text-rose-700' : ''}`}
                  required
                />
                <span className="text-xs text-muted block mt-0.5">Rule threshold: &gt; 39.0°C</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Heart Rate (BPM)
                </label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={e => setHeartRate(Number(e.target.value))}
                  className={`glass-input ${heartRate > 100 ? 'border-amber-400 bg-amber-50/50' : ''}`}
                  required
                />
                <span className="text-xs text-muted block mt-0.5">Rule threshold: &gt; 100 bpm</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Oxygen Sat (SpO2 %)
                </label>
                <input
                  type="number"
                  value={oxygenSaturation}
                  onChange={e => setOxygenSaturation(Number(e.target.value))}
                  className={`glass-input ${oxygenSaturation < 92 ? 'border-rose-400 bg-rose-50/50 text-rose-700' : ''}`}
                  required
                />
                <span className="text-xs text-muted block mt-0.5">Rule threshold: &lt; 92%</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  BP Systolic (mmHg)
                </label>
                <input
                  type="number"
                  value={bloodPressureSys}
                  onChange={e => setBloodPressureSys(Number(e.target.value))}
                  className="glass-input"
                  required
                />
                <span className="text-xs text-muted block mt-0.5">Rule threshold: &lt; 90 mmHg</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  BP Diastolic (mmHg)
                </label>
                <input
                  type="number"
                  value={bloodPressureDia}
                  onChange={e => setBloodPressureDia(Number(e.target.value))}
                  className="glass-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Resp Rate (/min)
                </label>
                <input
                  type="number"
                  value={respiratoryRate}
                  onChange={e => setRespiratoryRate(Number(e.target.value))}
                  className="glass-input"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {/* Presets */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setTemperature(36.8);
                    setHeartRate(72);
                    setBloodPressureSys(120);
                    setBloodPressureDia(80);
                    setOxygenSaturation(98);
                    setRespiratoryRate(16);
                  }}
                  className="btn-secondary"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                >
                  Normal Vitals
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTemperature(39.6);
                    setHeartRate(124);
                    setBloodPressureSys(88);
                    setBloodPressureDia(56);
                    setOxygenSaturation(89);
                    setRespiratoryRate(28);
                  }}
                  className="btn-rose"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                >
                  Simulate Critical Shock (Pyrexia & Hypoxia)
                </button>
              </div>

              <button type="submit" className="btn-primary">
                <Activity size={16} />
                Evaluate Vitals via Interpreter
              </button>
            </div>
          </form>

          {/* Evaluation Results Banner */}
          {lastVitalsResult && (
            <div className="mt-2 p-4 bg-white rounded-xl border border-slate-200 shadow-sm animate-slide-up">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Interpreter Grammar Evaluation Result ({new Date(lastVitalsResult.timestamp).toLocaleTimeString()})
                </h4>
                {lastVitalsResult.alertsGenerated.length > 0 ? (
                  <span className="badge badge-rose">
                    {lastVitalsResult.alertsGenerated.length} Clinical Alerts Triggered
                  </span>
                ) : (
                  <span className="badge badge-emerald">All Parameters Stable (Normal Limits)</span>
                )}
              </div>

              {lastVitalsResult.alertsGenerated.length > 0 ? (
                <div className="flex flex-col gap-1.5 mt-2">
                  {lastVitalsResult.alertsGenerated.map((alert, idx) => (
                    <div key={idx} className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-800 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                      <span>{alert}</span>
                    </div>
                  ))}
                  <p className="text-xs text-rose-600 mt-1 font-medium">
                    ⚡ Auto-escalated to Care Coordination Mediator for immediate physician dispatch.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-emerald-700">
                  ✓ Hemodynamics verified within safe clinical reference ranges.
                </p>
              )}
            </div>
          )}
        </GlassCard>

        {/* Right 1 Col: Care Coordination Queue (Mediator Pattern) */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Activity size={18} className="text-indigo" />
                Care Coordination
              </h3>
              <p className="text-xs text-muted">Mediator Pattern Inter-Department Queue</p>
            </div>
            <Badge variant="indigo">Mediator</Badge>
          </div>

          <div className="flex flex-col gap-3" style={{ maxHeight: '550px', overflowY: 'auto' }}>
            {careEvents.map(event => (
              <div
                key={event.id}
                className="p-3.5 bg-white/80 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`badge ${
                    event.urgency === 'EMERGENCY' ? 'badge-rose' : (event.urgency === 'URGENT' ? 'badge-amber' : 'badge-cyan')
                  }`}>
                    {event.urgency}
                  </span>
                  <span className={`text-xs font-bold ${event.status === 'OPEN' ? 'text-rose' : 'text-emerald'}`}>
                    {event.status}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-800">{event.patientName} — {event.eventType}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{event.message}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1 text-xs text-muted">
                  <span>To: <strong>{event.targetDepartment}</strong></span>
                  {event.status === 'OPEN' && (
                    <button
                      onClick={() => resolveCareEvent(event.id)}
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Dispatch Care Request Modal (Mediator Pattern) */}
      <GlassModal
        isOpen={isCareModalOpen}
        onClose={() => setIsCareModalOpen(false)}
        title="Dispatch Care Coordination Request (Mediator Pattern)"
        subtitle="HospitalCareMediator coordinates communication and notifies target department"
        icon={<Send size={20} />}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleDispatchCareSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Department</label>
              <select
                value={careTargetDept}
                onChange={e => setCareTargetDept(e.target.value)}
                className="glass-input"
              >
                <option value="Central Hospital Pharmacy">Central Hospital Pharmacy</option>
                <option value="Cardiology & Internal Medicine">Cardiology & Internal Medicine</option>
                <option value="Diagnostic Pathology & Imaging">Diagnostic Pathology & Imaging</option>
                <option value="Emergency & Trauma Unit">Emergency & Trauma Unit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Urgency Level</label>
              <select
                value={careUrgency}
                onChange={e => setCareUrgency(e.target.value as any)}
                className="glass-input"
              >
                <option value="ROUTINE">ROUTINE</option>
                <option value="URGENT">URGENT</option>
                <option value="EMERGENCY">EMERGENCY (STAT)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Event Classification</label>
            <select
              value={careEventType}
              onChange={e => setCareEventType(e.target.value as any)}
              className="glass-input"
            >
              <option value="MEDICATION_REQUIRED">MEDICATION_REQUIRED</option>
              <option value="LAB_TEST_REQUIRED">LAB_TEST_REQUIRED</option>
              <option value="PATIENT_MONITORING_REQUIRED">PATIENT_MONITORING_REQUIRED</option>
              <option value="CONSULTATION_REQUESTED">CONSULTATION_REQUESTED</option>
              <option value="DISCHARGE_CLEARANCE">DISCHARGE_CLEARANCE</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Care Request Details / Message</label>
            <textarea
              rows={3}
              placeholder="e.g. STAT Heparin syringe requested at Trauma Bay 1..."
              value={careMessage}
              onChange={e => setCareMessage(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsCareModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-rose">
              <Send size={16} />
              Route via Hospital Care Mediator
            </button>
          </div>
        </form>
      </GlassModal>
    </div>
  );
};
