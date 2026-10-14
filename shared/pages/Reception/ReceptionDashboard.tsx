import React, { useState } from 'react';
import { useHospitalData } from '../../context/HospitalDataContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassModal } from '../../components/common/GlassModal';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Patient, Appointment } from '../../types';
import { 
  UserCheck, 
  UserPlus, 
  Calendar, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Stethoscope, 
  ArrowRight, 
  Zap,
  Activity
} from 'lucide-react';

export const ReceptionDashboard: React.FC = () => {
  const {
    patients,
    doctors,
    appointments,
    registerPatient,
    bookAppointment,
    undoLastAppointmentCommand,
    advanceAppointmentState
  } = useHospitalData();

  const [searchTerm, setSearchTerm] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedPatientForBooking, setSelectedPatientForBooking] = useState<Patient | null>(null);

  // Patient Registration Form State (Factory Method)
  const [regType, setRegType] = useState<'REGULAR' | 'EMERGENCY' | 'REFERRED'>('REGULAR');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [contactNumber, setContactNumber] = useState('+1 (555) 300-1234');
  const [emergencyContact, setEmergencyContact] = useState('Relative +1 (555) 300-5678');
  const [referralSource, setReferralSource] = useState('St. Jude Community Clinic');
  const [allergies, setAllergies] = useState('None');
  const [diagnosis, setDiagnosis] = useState('');

  // Appointment Booking Form State (Strategy + Command)
  const [selectedDepartment, setSelectedDepartment] = useState('Cardiology');
  const [schedulingStrategy, setSchedulingStrategy] = useState<'LEAST_BUSY' | 'FIRST_AVAILABLE' | 'MANUAL'>('LEAST_BUSY');
  const [manualDoctorId, setManualDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('10:30 AM');
  const [appointmentReason, setAppointmentReason] = useState('Clinical Triage & Specialist Review');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.diagnosis && p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerPatient({
      name: patientName,
      age: Number(age),
      gender,
      bloodGroup,
      contactNumber,
      emergencyContact,
      referralSource: regType === 'REFERRED' ? referralSource : undefined,
      allergies: allergies.split(',').map(s => s.trim()),
      diagnosis
    }, regType);

    setIsRegisterModalOpen(false);
    // Reset inputs
    setPatientName('');
  };

  const handleBookAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForBooking) return;

    await bookAppointment({
      patientId: selectedPatientForBooking.id,
      patientName: selectedPatientForBooking.name,
      department: selectedDepartment,
      doctorId: manualDoctorId || undefined,
      date: appointmentDate,
      time: appointmentTime,
      reason: appointmentReason,
      priority: selectedPatientForBooking.priority
    }, schedulingStrategy);

    setIsBookModalOpen(false);
    setSelectedPatientForBooking(null);
  };

  const handleCheckIn = async (appointment: Appointment) => {
    try {
      await advanceAppointmentState(appointment.id, 'CHECKED_IN');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Patient Intake & Reception Triage</h2>
            <Badge variant="cyan" icon={<UserCheck size={12} />}>
              Factory Method • Strategy • Command • State
            </Badge>
          </div>
          <p className="text-sm text-muted mt-1">
            Patient registration factory, intelligent physician scheduling algorithms, and appointment lifecycle state transitions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={undoLastAppointmentCommand}
            className="btn-secondary"
            title="Undo last appointment action via Command Invoker"
          >
            <RotateCcw size={15} />
            <span>Undo Last Action (Command)</span>
          </button>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="btn-primary"
          >
            <UserPlus size={16} />
            <span>Register New Patient (Factory)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Registered Patients"
          value={patients.length}
          subtext="Processed via Factory Method"
          icon={<UserCheck size={18} />}
          variant="cyan"
        />
        <StatCard
          label="Emergency Triage (Critical)"
          value={patients.filter(p => p.priority === 'CRITICAL').length}
          subtext="Immediate resuscitation queue"
          icon={<Zap size={18} />}
          variant="rose"
        />
        <StatCard
          label="Appointments Scheduled"
          value={appointments.filter(a => a.status === 'SCHEDULED').length}
          subtext="Awaiting reception check-in"
          icon={<Calendar size={18} />}
          variant="indigo"
        />
        <StatCard
          label="Patients Checked-In"
          value={appointments.filter(a => a.status === 'CHECKED_IN').length}
          subtext="State: Ready for consultation"
          icon={<CheckCircle2 size={18} />}
          variant="emerald"
        />
      </div>

      {/* Main Content Split: Patient Registry + Today's Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Patient Registry */}
        <GlassCard className="p-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold">Patient Master Index (EHR)</h3>
              <p className="text-xs text-muted">Search by Patient Name, MRN, or Clinical Diagnosis</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search MRN or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="glass-input pl-9"
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>MRN / Patient</th>
                  <th>Intake Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Clinical Diagnosis</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-xs text-muted">{p.mrn} • {p.age}y {p.gender}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        p.registrationType === 'EMERGENCY' ? 'badge-rose' : (p.registrationType === 'REFERRED' ? 'badge-indigo' : 'badge-cyan')
                      }`}>
                        {p.registrationType}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        p.priority === 'CRITICAL' ? 'badge-rose' : (p.priority === 'HIGH' ? 'badge-amber' : 'badge-emerald')
                      }`}>
                        {p.priority}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-slate-700">{p.status}</span>
                    </td>
                    <td className="text-xs text-slate-600 max-w-xs truncate">
                      {p.diagnosis || 'General Triage'}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedPatientForBooking(p);
                          setIsBookModalOpen(true);
                        }}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        <Calendar size={13} />
                        Book Appt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Right 1 Col: Appointments Lifecycle & State Transitions */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock size={18} className="text-cyan" />
                Live Appointments
              </h3>
              <p className="text-xs text-muted">State Pattern Workflow Lifecycle</p>
            </div>
            <Badge variant="cyan">State Pattern</Badge>
          </div>

          <div className="flex flex-col gap-3" style={{ maxHeight: '550px', overflowY: 'auto' }}>
            {appointments.map(apt => (
              <div
                key={apt.id}
                className="p-3.5 bg-white/80 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{apt.patientName}</span>
                  <span className={`badge ${
                    apt.status === 'CHECKED_IN' ? 'badge-emerald' : (apt.status === 'IN_CONSULTATION' ? 'badge-indigo' : 'badge-cyan')
                  }`}>
                    {apt.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex flex-col gap-0.5">
                  <p>Attending: <strong>{apt.doctorName}</strong> ({apt.department})</p>
                  <p>Slot: {apt.date} at {apt.time}</p>
                  <p className="text-slate-500 italic mt-0.5">"{apt.reason}"</p>
                </div>

                {/* State Transition Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                  <span className="text-xs text-muted">Strategy: {apt.schedulingStrategyUsed || 'LEAST_BUSY'}</span>

                  {apt.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleCheckIn(apt)}
                      className="btn-emerald"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      <CheckCircle2 size={13} />
                      Check In Patient
                    </button>
                  )}

                  {apt.status === 'CHECKED_IN' && (
                    <span className="text-xs font-bold text-emerald flex items-center gap-1">
                      <CheckCircle2 size={13} /> Waiting for Doctor
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Patient Registration Modal (Factory Method Pattern) */}
      <GlassModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Patient Registration (Factory Method Pattern)"
        subtitle="Select Creator Implementation: RegularPatientCreator, EmergencyPatientCreator, or ReferredPatientCreator"
        icon={<UserPlus size={20} />}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
          {/* Creator Selection Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select PatientCreator Factory
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { 
                  type: 'REGULAR', 
                  title: 'Regular Intake', 
                  badge: 'Standard Queue',
                  desc: 'Normal Priority, Standard Outpatient Triage', 
                  icon: <UserCheck size={16} />,
                  activeBg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  activeBorder: '#0284c7',
                  activeShadow: '0 6px 18px rgba(2, 132, 199, 0.35)',
                  inactiveBg: '#f0f9ff',
                  inactiveBorder: '#bae6fd',
                  inactiveTitle: '#0369a1',
                  inactiveDesc: '#0284c7',
                  badgeBg: '#e0f2fe',
                  badgeColor: '#0369a1'
                },
                { 
                  type: 'EMERGENCY', 
                  title: 'Emergency Trauma', 
                  badge: '⚡ CRITICAL',
                  desc: 'CRITICAL Priority, Immediate Trauma Care', 
                  icon: <Zap size={16} />,
                  activeBg: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
                  activeBorder: '#e11d48',
                  activeShadow: '0 6px 20px rgba(225, 29, 72, 0.45)',
                  inactiveBg: '#fff1f2',
                  inactiveBorder: '#fecdd3',
                  inactiveTitle: '#be123c',
                  inactiveDesc: '#9f1239',
                  badgeBg: '#ffe4e6',
                  badgeColor: '#be123c'
                },
                { 
                  type: 'REFERRED', 
                  title: 'Specialist Referral', 
                  badge: 'Specialist Source',
                  desc: 'Normal Priority, External Doctor / Clinic', 
                  icon: <Stethoscope size={16} />,
                  activeBg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                  activeBorder: '#4f46e5',
                  activeShadow: '0 6px 18px rgba(79, 70, 229, 0.35)',
                  inactiveBg: '#eef2ff',
                  inactiveBorder: '#c7d2fe',
                  inactiveTitle: '#4338ca',
                  inactiveDesc: '#4f46e5',
                  badgeBg: '#e0e7ff',
                  badgeColor: '#4338ca'
                }
              ].map(c => {
                const isSelected = regType === c.type;
                return (
                  <div
                    key={c.type}
                    onClick={() => setRegType(c.type as any)}
                    style={{
                      padding: '0.85rem 0.9rem',
                      borderRadius: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: isSelected ? `2.5px solid ${c.activeBorder}` : `2px solid ${c.inactiveBorder}`,
                      background: isSelected ? c.activeBg : c.inactiveBg,
                      color: isSelected ? '#ffffff' : c.inactiveTitle,
                      boxShadow: isSelected ? c.activeShadow : '0 2px 6px rgba(0,0,0,0.03)',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      position: 'relative'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: isSelected ? '#ffffff' : c.inactiveTitle }}>{c.icon}</span>
                        <h5 style={{ fontWeight: 800, fontSize: '0.825rem', color: isSelected ? '#ffffff' : c.inactiveTitle }}>
                          {c.title}
                        </h5>
                      </div>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '9999px',
                          background: isSelected ? 'rgba(255, 255, 255, 0.25)' : c.badgeBg,
                          color: isSelected ? '#ffffff' : c.badgeColor,
                          border: isSelected ? 'none' : `1px solid ${c.inactiveBorder}`
                        }}
                      >
                        {c.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', opacity: isSelected ? 0.95 : 0.85, lineHeight: 1.3, color: isSelected ? '#f8fafc' : c.inactiveDesc }}>
                      {c.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Legal Name</label>
              <input
                type="text"
                placeholder="e.g. Jonathan Mercer"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                className="glass-input"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="glass-input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="glass-input"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value)}
                className="glass-input"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
              <input
                type="text"
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                className="glass-input"
                required
              />
            </div>
          </div>

          {regType === 'REFERRED' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Referring Clinic / Physician</label>
              <input
                type="text"
                value={referralSource}
                onChange={e => setReferralSource(e.target.value)}
                className="glass-input"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Primary Triage Symptoms / Diagnosis</label>
            <input
              type="text"
              placeholder="e.g. Chest pain with shortness of breath..."
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              className="glass-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsRegisterModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className={regType === 'EMERGENCY' ? 'btn-rose' : (regType === 'REFERRED' ? 'btn-indigo' : 'btn-primary')}
            >
              <UserPlus size={16} />
              Execute Factory & Register Patient
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Appointment Booking Modal (Strategy & Command Patterns) */}
      <GlassModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule Appointment (Strategy & Command Patterns)"
        subtitle={`Scheduling appointment for ${selectedPatientForBooking?.name || 'Patient'}`}
        icon={<Calendar size={20} />}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleBookAppointmentSubmit} className="flex flex-col gap-4">
          {/* Strategy Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Physician Assignment Strategy (GoF Strategy Pattern)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { 
                  id: 'LEAST_BUSY', 
                  title: 'Least Busy Doctor', 
                  badge: 'Balanced Load',
                  desc: 'Balances appointments across lowest queue count', 
                  icon: <Activity size={16} />,
                  activeBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  activeBorder: '#059669',
                  activeShadow: '0 6px 18px rgba(5, 150, 105, 0.35)',
                  inactiveBg: '#ecfdf5',
                  inactiveBorder: '#a7f3d0',
                  inactiveTitle: '#047857',
                  inactiveDesc: '#059669',
                  badgeBg: '#d1fae5',
                  badgeColor: '#065f46'
                },
                { 
                  id: 'FIRST_AVAILABLE', 
                  title: 'First Available', 
                  badge: 'Earliest Slot',
                  desc: 'Greedy slot match to next open workstation', 
                  icon: <Clock size={16} />,
                  activeBg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  activeBorder: '#0284c7',
                  activeShadow: '0 6px 18px rgba(2, 132, 199, 0.35)',
                  inactiveBg: '#f0f9ff',
                  inactiveBorder: '#bae6fd',
                  inactiveTitle: '#0369a1',
                  inactiveDesc: '#0284c7',
                  badgeBg: '#e0f2fe',
                  badgeColor: '#0369a1'
                },
                { 
                  id: 'MANUAL', 
                  title: 'Manual Selection', 
                  badge: 'Designated MD',
                  desc: 'Explicitly designate attending physician and clinic', 
                  icon: <UserCheck size={16} />,
                  activeBg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                  activeBorder: '#4f46e5',
                  activeShadow: '0 6px 18px rgba(79, 70, 229, 0.35)',
                  inactiveBg: '#eef2ff',
                  inactiveBorder: '#c7d2fe',
                  inactiveTitle: '#4338ca',
                  inactiveDesc: '#4f46e5',
                  badgeBg: '#e0e7ff',
                  badgeColor: '#4338ca'
                }
              ].map(strat => {
                const isSelected = schedulingStrategy === strat.id;
                return (
                  <div
                    key={strat.id}
                    onClick={() => setSchedulingStrategy(strat.id as any)}
                    style={{
                      padding: '0.85rem 0.9rem',
                      borderRadius: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: isSelected ? `2.5px solid ${strat.activeBorder}` : `2px solid ${strat.inactiveBorder}`,
                      background: isSelected ? strat.activeBg : strat.inactiveBg,
                      color: isSelected ? '#ffffff' : strat.inactiveTitle,
                      boxShadow: isSelected ? strat.activeShadow : '0 2px 6px rgba(0,0,0,0.03)',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      position: 'relative'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: isSelected ? '#ffffff' : strat.inactiveTitle }}>{strat.icon}</span>
                        <h5 style={{ fontWeight: 800, fontSize: '0.825rem', color: isSelected ? '#ffffff' : strat.inactiveTitle }}>
                          {strat.title}
                        </h5>
                      </div>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '9999px',
                          background: isSelected ? 'rgba(255, 255, 255, 0.25)' : strat.badgeBg,
                          color: isSelected ? '#ffffff' : strat.badgeColor,
                          border: isSelected ? 'none' : `1px solid ${strat.inactiveBorder}`
                        }}
                      >
                        {strat.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', opacity: isSelected ? 0.95 : 0.85, lineHeight: 1.3, color: isSelected ? '#f8fafc' : strat.inactiveDesc }}>
                      {strat.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinical Department</label>
              <select
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                className="glass-input"
              >
                {['Cardiology', 'Neurology', 'Emergency & Trauma', 'General Surgery'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {schedulingStrategy === 'MANUAL' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Attending Physician</label>
                <select
                  value={manualDoctorId}
                  onChange={e => setManualDoctorId(e.target.value)}
                  className="glass-input"
                  required
                >
                  <option value="">Select Doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.department} - {d.currentActivePatients} active pts)</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Algorithm Strategy Target</label>
                <div className="glass-input text-xs font-semibold text-indigo-700 bg-indigo-50/50">
                  {schedulingStrategy === 'LEAST_BUSY' ? '⚡ Will automatically pick least loaded physician' : '⚡ Will select next immediate open physician'}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Appointment Date</label>
              <input
                type="date"
                value={appointmentDate}
                onChange={e => setAppointmentDate(e.target.value)}
                className="glass-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Time Slot</label>
              <input
                type="text"
                value={appointmentTime}
                onChange={e => setAppointmentTime(e.target.value)}
                className="glass-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Consultation Reason</label>
            <input
              type="text"
              value={appointmentReason}
              onChange={e => setAppointmentReason(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsBookModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Calendar size={16} />
              Execute Command & Book Appointment
            </button>
          </div>
        </form>
      </GlassModal>
    </div>
  );
};
