import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { HospitalDataStore } from './store/dataStore.js';
import { Patient, Appointment, Admission, LabOrder, Prescription, TreatmentPlan, Bill, VitalsRecord, ClinicalRule, CareEvent } from './store/seedData.js';
import { AiAnalysisService } from './services/aiService.js';
import { AiAnalysisModel } from './db/models.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const store = HospitalDataStore.getInstance();

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'MediFlow Hospital Management System Backend',
    database: store.isMongoConnected ? 'MongoDB Atlas (Connected)' : 'Local Fallback',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Authentication (Facade Endpoint)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, role } = req.body;
  let user = store.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  
  if (!user && role) {
    user = store.users.find(u => u.role === role);
  }

  if (!user) {
    // Default fallback to first admin
    user = store.users[0];
  }

  store.logAudit(user.name, user.role, 'USER_LOGIN', 'Authentication', `User logged in with role ${user.role}`, 'Facade');

  res.json({
    success: true,
    user,
    token: `jwt_simulated_${user.id}_${Date.now()}`,
    session: {
      id: `sess_${Date.now()}`,
      activeRole: user.role,
      permissions: user.permissions,
      hospitalName: store.config.hospitalName,
      loginTime: new Date().toISOString()
    }
  });
});

// Users
app.get('/api/users', (req: Request, res: Response) => {
  res.json(store.users);
});

// Hospital Configuration (Singleton Pattern Endpoint)
app.get('/api/config', (req: Request, res: Response) => {
  res.json(store.config);
});

app.put('/api/config', (req: Request, res: Response) => {
  store.config = { ...store.config, ...req.body, lastUpdated: new Date().toISOString() };
  store.persist();
  store.logAudit('Admin', 'admin', 'UPDATE_CONFIG', 'System Configuration', 'Updated global hospital settings', 'Singleton');
  res.json(store.config);
});

// Doctors
app.get('/api/doctors', (req: Request, res: Response) => {
  res.json(store.doctors);
});

// Patients (Factory Method Pattern Context)
app.get('/api/patients', (req: Request, res: Response) => {
  res.json(store.patients);
});

app.get('/api/patients/:id', (req: Request, res: Response) => {
  const patient = store.patients.find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

app.post('/api/patients', (req: Request, res: Response) => {
  const data = req.body;
  const newPatient: Patient = {
    id: `pat_${Date.now()}`,
    mrn: `MED-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    name: data.name || 'Anonymous Patient',
    age: Number(data.age) || 30,
    gender: data.gender || 'Other',
    bloodGroup: data.bloodGroup || 'O+',
    contactNumber: data.contactNumber || '+1 (555) 000-0000',
    emergencyContact: data.emergencyContact || 'None provided',
    registrationType: data.registrationType || 'REGULAR',
    priority: data.priority || (data.registrationType === 'EMERGENCY' ? 'CRITICAL' : 'NORMAL'),
    status: data.status || 'REGISTERED',
    referralSource: data.referralSource,
    allergies: Array.isArray(data.allergies) ? data.allergies : (data.allergies ? [data.allergies] : []),
    diagnosis: data.diagnosis,
    attendingDoctorId: data.attendingDoctorId,
    room: data.room,
    bed: data.bed,
    medicalHistory: data.medicalHistory || [
      {
        id: `hist_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'Consultation',
        title: 'Initial Intake Registration',
        description: `Patient registered via ${data.registrationType || 'REGULAR'} workflow.`,
        doctorName: 'Triage Desk'
      }
    ],
    createdAt: new Date().toISOString()
  };

  store.patients.unshift(newPatient);
  store.persist();
  store.logAudit(data.actorName || 'Receptionist', 'receptionist', 'REGISTER_PATIENT', 'Patient Management', `Registered ${newPatient.name} [${newPatient.registrationType}]`, 'Factory Method');

  res.status(201).json(newPatient);
});

app.put('/api/patients/:id', (req: Request, res: Response) => {
  const index = store.patients.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Patient not found' });

  store.patients[index] = { ...store.patients[index], ...req.body };
  store.persist();
  res.json(store.patients[index]);
});

// Appointments (Strategy & Command & State Patterns)
app.get('/api/appointments', (req: Request, res: Response) => {
  res.json(store.appointments);
});

app.post('/api/appointments', (req: Request, res: Response) => {
  const data = req.body;
  const newAppointment: Appointment = {
    id: `apt_${Date.now()}`,
    patientId: data.patientId,
    patientName: data.patientName || 'Unknown Patient',
    doctorId: data.doctorId,
    doctorName: data.doctorName || 'Assigned Physician',
    department: data.department || 'General Medicine',
    date: data.date || new Date().toISOString().split('T')[0],
    time: data.time || '10:00 AM',
    reason: data.reason || 'General Clinical Consultation',
    status: 'SCHEDULED',
    priority: data.priority || 'NORMAL',
    schedulingStrategyUsed: data.schedulingStrategyUsed || 'MANUAL',
    history: [
      {
        from: 'NONE',
        to: 'SCHEDULED',
        timestamp: new Date().toISOString(),
        action: `BookAppointmentCommand (${data.schedulingStrategyUsed || 'MANUAL'} Strategy)`,
        performedBy: data.actorName || 'Receptionist'
      }
    ],
    createdAt: new Date().toISOString()
  };

  store.appointments.unshift(newAppointment);

  // Update doctor active patient count if available
  const doctor = store.doctors.find(d => d.id === data.doctorId);
  if (doctor) {
    doctor.currentActivePatients += 1;
  }

  store.persist();
  store.logAudit(data.actorName || 'Receptionist', 'receptionist', 'BOOK_APPOINTMENT', 'Appointments', `Booked appointment for ${newAppointment.patientName} with ${newAppointment.doctorName}`, 'Command + Strategy');

  res.status(201).json(newAppointment);
});

app.put('/api/appointments/:id/status', (req: Request, res: Response) => {
  const { status, actorName, actionNote } = req.body;
  const appointment = store.appointments.find(a => a.id === req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

  const prevStatus = appointment.status;
  appointment.status = status;
  appointment.history.push({
    from: prevStatus,
    to: status,
    timestamp: new Date().toISOString(),
    action: actionNote || `Transitioned state to ${status}`,
    performedBy: actorName || 'System'
  });

  // If patient in consultation, update patient status
  if (status === 'IN_CONSULTATION') {
    const patient = store.patients.find(p => p.id === appointment.patientId);
    if (patient) patient.status = 'IN_CONSULTATION';
  } else if (status === 'COMPLETED') {
    const patient = store.patients.find(p => p.id === appointment.patientId);
    if (patient && patient.status === 'IN_CONSULTATION') patient.status = 'REGISTERED';
  }

  store.persist();
  store.logAudit(actorName || 'Staff', 'doctor', 'UPDATE_APPOINTMENT_STATE', 'Appointments', `Changed appointment status ${prevStatus} -> ${status}`, 'State');

  res.json(appointment);
});

// Admissions (Builder Pattern Context)
app.get('/api/admissions', (req: Request, res: Response) => {
  res.json(store.admissions);
});

app.post('/api/admissions', (req: Request, res: Response) => {
  const data = req.body;
  const newAdmission: Admission = {
    id: `adm_${Date.now()}`,
    patientId: data.patientId,
    patientName: data.patientName,
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    department: data.department,
    ward: data.ward || 'General Inpatient Ward',
    room: data.room || 'Room 101',
    bed: data.bed || 'Bed A-01',
    admissionDate: new Date().toISOString(),
    reason: data.reason || 'Inpatient medical observation',
    priority: data.priority || 'HIGH',
    status: 'ADMITTED',
    treatmentPlanId: data.treatmentPlanId,
    notes: data.notes
  };

  store.admissions.unshift(newAdmission);

  // Update patient status and bed
  const patient = store.patients.find(p => p.id === data.patientId);
  if (patient) {
    patient.status = 'ADMITTED';
    patient.room = newAdmission.room;
    patient.bed = newAdmission.bed;
    patient.attendingDoctorId = newAdmission.doctorId;
    patient.medicalHistory.unshift({
      id: `hist_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Admission',
      title: `Inpatient Admission (${newAdmission.department})`,
      description: newAdmission.reason,
      doctorName: newAdmission.doctorName
    });
  }

  store.persist();
  store.logAudit(data.actorName || 'Doctor', 'doctor', 'CREATE_ADMISSION', 'Admissions', `Admitted ${newAdmission.patientName} to ${newAdmission.room} - ${newAdmission.bed}`, 'Builder');

  res.status(201).json(newAdmission);
});

app.put('/api/admissions/:id', (req: Request, res: Response) => {
  const index = store.admissions.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Admission not found' });

  const prev = store.admissions[index];
  store.admissions[index] = { ...prev, ...req.body };

  if (req.body.status === 'DISCHARGED') {
    const patient = store.patients.find(p => p.id === prev.patientId);
    if (patient) {
      patient.status = 'DISCHARGED';
      patient.medicalHistory.unshift({
        id: `hist_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'Surgery',
        title: 'Patient Discharge Approved',
        description: `Discharged from ${prev.ward}, ${prev.room}. Clinical discharge summary provided.`,
        doctorName: prev.doctorName
      });
    }
  }

  store.persist();
  res.json(store.admissions[index]);
});

// Laboratory (Abstract Factory, Bridge, Adapter, Observer)
app.get('/api/lab-orders', (req: Request, res: Response) => {
  res.json(store.labOrders);
});

app.post('/api/lab-orders', (req: Request, res: Response) => {
  const data = req.body;
  const newOrder: LabOrder = {
    id: `lab_${Date.now()}`,
    orderNumber: `LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    patientId: data.patientId,
    patientName: data.patientName,
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    testCode: data.testCode || 'LAB-GEN-01',
    testName: data.testName || 'Diagnostic Panel',
    category: data.category || 'BLOOD',
    provider: data.provider || 'INTERNAL',
    priority: data.priority || 'ROUTINE',
    status: 'PENDING',
    orderDate: new Date().toISOString()
  };

  store.labOrders.unshift(newOrder);
  store.persist();
  store.logAudit(data.actorName || 'Doctor', 'doctor', 'CREATE_LAB_ORDER', 'Diagnostics', `Ordered ${newOrder.testName} via ${newOrder.provider} provider`, 'Abstract Factory + Bridge');

  res.status(201).json(newOrder);
});

app.put('/api/lab-orders/:id/process', (req: Request, res: Response) => {
  const order = store.labOrders.find(l => l.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Lab order not found' });

  order.status = 'PROCESSING';
  store.persist();
  res.json(order);
});

app.put('/api/lab-orders/:id/results', (req: Request, res: Response) => {
  const order = store.labOrders.find(l => l.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Lab order not found' });

  const { results, isCritical, technicianNotes, actorName } = req.body;
  order.status = 'COMPLETED';
  order.completionDate = new Date().toISOString();
  order.isCritical = !!isCritical;
  order.results = {
    summary: results?.summary || 'Diagnostic test analysis completed.',
    parameters: results?.parameters || [],
    technicianNotes: technicianNotes || 'Verified and signed off by laboratory technician.'
  };

  // Add to patient medical history
  const patient = store.patients.find(p => p.id === order.patientId);
  if (patient) {
    patient.medicalHistory.unshift({
      id: `hist_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Lab Result',
      title: `${order.testName} Result Available`,
      description: order.results.summary,
      doctorName: actorName || 'Lab Technician'
    });
  }

  // If critical, trigger Care Event automatically
  if (order.isCritical) {
    store.careEvents.unshift({
      id: `care_${Date.now()}`,
      patientId: order.patientId,
      patientName: order.patientName,
      senderRole: 'Laboratory',
      senderName: actorName || 'David Chen (Lab Tech)',
      targetDepartment: 'Cardiology & Internal Medicine',
      eventType: 'LAB_TEST_REQUIRED',
      urgency: 'EMERGENCY',
      message: `CRITICAL ALERT: Critical lab values detected on ${order.testName} for ${order.patientName}!`,
      status: 'OPEN',
      timestamp: new Date().toISOString()
    });
  }

  store.persist();
  store.logAudit(actorName || 'Lab Tech', 'lab_tech', 'COMPLETE_LAB_RESULT', 'Diagnostics', `Completed test ${order.testName} (Critical: ${order.isCritical})`, 'Adapter + Observer');

  res.json(order);
});

// Prescriptions (Flyweight & Decorator Patterns)
app.get('/api/prescriptions', (req: Request, res: Response) => {
  res.json(store.prescriptions);
});

app.post('/api/prescriptions', (req: Request, res: Response) => {
  const data = req.body;
  const newPrescription: Prescription = {
    id: `rx_${Date.now()}`,
    prescriptionNumber: `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    patientId: data.patientId,
    patientName: data.patientName,
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    date: new Date().toISOString().split('T')[0],
    status: 'PRESCRIBED',
    items: data.items || [],
    notes: data.notes
  };

  store.prescriptions.unshift(newPrescription);

  // Add to patient history
  const patient = store.patients.find(p => p.id === data.patientId);
  if (patient) {
    patient.medicalHistory.unshift({
      id: `hist_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Prescription',
      title: `Medications Prescribed (${newPrescription.items.length} items)`,
      description: newPrescription.items.map(i => `${i.medicationName} ${i.dosage}`).join(', '),
      doctorName: newPrescription.doctorName
    });
  }

  store.persist();
  store.logAudit(data.actorName || 'Doctor', 'doctor', 'CREATE_PRESCRIPTION', 'Pharmacy', `Prescribed ${newPrescription.items.length} items for ${newPrescription.patientName}`, 'Flyweight + Decorator');

  res.status(201).json(newPrescription);
});

app.put('/api/prescriptions/:id/dispense', (req: Request, res: Response) => {
  const rx = store.prescriptions.find(p => p.id === req.params.id);
  if (!rx) return res.status(404).json({ error: 'Prescription not found' });

  rx.status = 'DISPENSED';
  rx.items.forEach(item => { item.dispensed = true; });

  store.persist();
  store.logAudit(req.body.actorName || 'Pharmacist', 'pharmacist', 'DISPENSE_PRESCRIPTION', 'Pharmacy', `Dispensed prescription ${rx.prescriptionNumber}`, 'Decorator');

  res.json(rx);
});

// Treatment Plans (Prototype & Memento Patterns)
app.get('/api/treatment-plans', (req: Request, res: Response) => {
  res.json(store.treatmentPlans);
});

app.get('/api/treatment-plans/patient/:patientId', (req: Request, res: Response) => {
  const plans = store.treatmentPlans.filter(tp => tp.patientId === req.params.patientId);
  res.json(plans);
});

app.post('/api/treatment-plans', (req: Request, res: Response) => {
  const data = req.body;
  const newPlan: TreatmentPlan = {
    id: `tp_${Date.now()}`,
    patientId: data.patientId,
    patientName: data.patientName,
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    name: data.name || 'Personalized Treatment Plan',
    diagnosis: data.diagnosis || 'Clinical Assessment',
    medications: data.medications || [],
    instructions: data.instructions || [],
    followUpSchedule: data.followUpSchedule || '2 weeks',
    status: 'ACTIVE',
    versions: [
      {
        version: 1,
        timestamp: new Date().toISOString(),
        note: data.initialVersionNote || 'Initial plan created / cloned from Prototype template',
        snapshot: {
          name: data.name,
          diagnosis: data.diagnosis,
          medications: data.medications || [],
          instructions: data.instructions || [],
          followUpSchedule: data.followUpSchedule || '2 weeks'
        }
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.treatmentPlans.unshift(newPlan);
  store.persist();
  store.logAudit(data.actorName || 'Doctor', 'doctor', 'CREATE_TREATMENT_PLAN', 'Treatment Plans', `Created treatment plan ${newPlan.name} for ${newPlan.patientName}`, 'Prototype + Memento');

  res.status(201).json(newPlan);
});

app.put('/api/treatment-plans/:id/version', (req: Request, res: Response) => {
  const plan = store.treatmentPlans.find(tp => tp.id === req.params.id);
  if (!plan) return res.status(404).json({ error: 'Treatment plan not found' });

  const { name, diagnosis, medications, instructions, followUpSchedule, note, actorName } = req.body;

  if (name) plan.name = name;
  if (diagnosis) plan.diagnosis = diagnosis;
  if (medications) plan.medications = medications;
  if (instructions) plan.instructions = instructions;
  if (followUpSchedule) plan.followUpSchedule = followUpSchedule;

  const nextVersion = (plan.versions.length ? plan.versions[plan.versions.length - 1].version : 0) + 1;
  plan.versions.push({
    version: nextVersion,
    timestamp: new Date().toISOString(),
    note: note || `Updated clinical plan to Version ${nextVersion}`,
    snapshot: {
      name: plan.name,
      diagnosis: plan.diagnosis,
      medications: [...plan.medications],
      instructions: [...plan.instructions],
      followUpSchedule: plan.followUpSchedule
    }
  });
  plan.updatedAt = new Date().toISOString();

  store.persist();
  store.logAudit(actorName || 'Doctor', 'doctor', 'SAVE_PLAN_SNAPSHOT', 'Treatment Plans', `Saved Memento snapshot v${nextVersion} for plan ${plan.name}`, 'Memento');

  res.json(plan);
});

app.put('/api/treatment-plans/:id/restore', (req: Request, res: Response) => {
  const plan = store.treatmentPlans.find(tp => tp.id === req.params.id);
  if (!plan) return res.status(404).json({ error: 'Treatment plan not found' });

  const { targetVersion, actorName } = req.body;
  const versionRecord = plan.versions.find(v => v.version === Number(targetVersion));
  if (!versionRecord) return res.status(404).json({ error: `Version ${targetVersion} not found` });

  const snap = versionRecord.snapshot;
  plan.name = snap.name;
  plan.diagnosis = snap.diagnosis;
  plan.medications = [...snap.medications];
  plan.instructions = [...snap.instructions];
  plan.followUpSchedule = snap.followUpSchedule;
  plan.updatedAt = new Date().toISOString();

  // Record a rollback version event
  const newVer = plan.versions[plan.versions.length - 1].version + 1;
  plan.versions.push({
    version: newVer,
    timestamp: new Date().toISOString(),
    note: `Restored state from Memento version ${targetVersion}`,
    snapshot: {
      name: snap.name,
      diagnosis: snap.diagnosis,
      medications: [...snap.medications],
      instructions: [...snap.instructions],
      followUpSchedule: snap.followUpSchedule
    }
  });

  store.persist();
  store.logAudit(actorName || 'Doctor', 'doctor', 'RESTORE_PLAN_MEMENTO', 'Treatment Plans', `Restored plan ${plan.name} to version ${targetVersion}`, 'Memento');

  res.json(plan);
});

// Billing & Insurance (Composite & Chain of Responsibility Patterns)
app.get('/api/bills', (req: Request, res: Response) => {
  res.json(store.bills);
});

app.post('/api/bills', (req: Request, res: Response) => {
  const data = req.body;
  const newBill: Bill = {
    id: `bill_${Date.now()}`,
    invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    patientId: data.patientId,
    patientName: data.patientName,
    date: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    groups: data.groups || [],
    subtotal: Number(data.subtotal) || 0,
    tax: Number(data.tax) || 0,
    discount: Number(data.discount) || 0,
    total: Number(data.total) || 0,
    payments: []
  };

  store.bills.unshift(newBill);
  store.persist();
  store.logAudit(data.actorName || 'Billing Officer', 'billing_officer', 'GENERATE_COMPOSITE_BILL', 'Billing', `Generated composite invoice ${newBill.invoiceNumber} for $${newBill.total.toFixed(2)}`, 'Composite');

  res.status(201).json(newBill);
});

app.post('/api/bills/:id/claim', (req: Request, res: Response) => {
  const bill = store.bills.find(b => b.id === req.params.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });

  const { provider, policyNumber, preAuthCode, actorName } = req.body;

  // Execute Chain of Responsibility validation rules
  const stages: Array<{ stage: string; passed: boolean; message: string; timestamp: string }> = [];

  // Stage 1: Policy Validator
  const isPolicyValid = !!policyNumber && policyNumber.length >= 6;
  stages.push({
    stage: 'Policy Validator',
    passed: isPolicyValid,
    message: isPolicyValid ? `Policy ${policyNumber} verified active with ${provider}.` : 'Invalid or expired policy number format.',
    timestamp: new Date().toISOString()
  });

  // Stage 2: Coverage Validator
  const isCoverageValid = isPolicyValid && !policyNumber.toUpperCase().includes('EXPIRED');
  stages.push({
    stage: 'Coverage Validator',
    passed: isCoverageValid,
    message: isCoverageValid ? 'Hospital service categories eligible for comprehensive coverage.' : 'Coverage lapsed or excluded under current policy tier.',
    timestamp: new Date().toISOString()
  });

  // Stage 3: Amount Validator
  const isAmountValid = isCoverageValid && bill.total < 100000;
  stages.push({
    stage: 'Amount Validator',
    passed: isAmountValid,
    message: isAmountValid ? `Claim amount ($${bill.total.toFixed(2)}) is within max per-incident threshold.` : 'Claim amount exceeds allowed single-incident limit.',
    timestamp: new Date().toISOString()
  });

  // Stage 4: Document Validator
  const isDocValid = isAmountValid && bill.groups.length > 0;
  stages.push({
    stage: 'Document Validator',
    passed: isDocValid,
    message: isDocValid ? 'Composite itemized invoice breakdown and medical orders verified.' : 'Missing required itemized diagnostic and doctor billing codes.',
    timestamp: new Date().toISOString()
  });

  const allPassed = stages.every(s => s.passed);
  const approvedAmount = allPassed ? Math.round(bill.total * 0.95 * 100) / 100 : 0;

  bill.insuranceClaim = {
    claimId: `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    provider: provider || 'Standard Health Insurance',
    policyNumber: policyNumber || 'POL-UNKNOWN',
    preAuthCode,
    claimAmount: bill.total,
    approvedAmount,
    status: allPassed ? 'APPROVED' : 'REJECTED',
    stages
  };

  bill.status = allPassed ? 'CLAIM_SUBMITTED' : 'PENDING';

  if (allPassed && approvedAmount > 0) {
    bill.payments.push({
      id: `pay_${Date.now()}`,
      amount: approvedAmount,
      date: new Date().toISOString(),
      method: 'INSURANCE',
      transactionRef: `TX-INS-${Math.floor(100000 + Math.random() * 900000)}`
    });
    if (approvedAmount >= bill.total) {
      bill.status = 'PAID';
    } else {
      bill.status = 'PARTIAL';
    }
  }

  store.persist();
  store.logAudit(actorName || 'Billing Officer', 'billing_officer', 'PROCESS_INSURANCE_CLAIM', 'Insurance', `Claim ${bill.insuranceClaim.claimId} evaluated via Chain of Responsibility (${bill.insuranceClaim.status})`, 'Chain of Responsibility');

  res.json(bill);
});

app.post('/api/bills/:id/pay', (req: Request, res: Response) => {
  const bill = store.bills.find(b => b.id === req.params.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });

  const { amount, method, actorName } = req.body;
  const payAmt = Number(amount) || 0;

  bill.payments.push({
    id: `pay_${Date.now()}`,
    amount: payAmt,
    date: new Date().toISOString(),
    method: method || 'CARD',
    transactionRef: `TX-${method || 'CARD'}-${Math.floor(100000 + Math.random() * 900000)}`
  });

  const totalPaid = bill.payments.reduce((acc, p) => acc + p.amount, 0);
  if (totalPaid >= bill.total) {
    bill.status = 'PAID';
  } else {
    bill.status = 'PARTIAL';
  }

  store.persist();
  store.logAudit(actorName || 'Billing Officer', 'billing_officer', 'RECORD_PAYMENT', 'Billing', `Recorded payment of $${payAmt.toFixed(2)} for ${bill.invoiceNumber}`, 'Composite');

  res.json(bill);
});

// Vitals & Clinical Rules (Interpreter & Mediator & Observer Patterns)
app.get('/api/vitals', (req: Request, res: Response) => {
  res.json(store.vitalsRecords);
});

app.post('/api/vitals', (req: Request, res: Response) => {
  const data = req.body;
  const temp = Number(data.temperature);
  const hr = Number(data.heartRate);
  const sys = Number(data.bloodPressureSys);
  const dia = Number(data.bloodPressureDia);
  const rr = Number(data.respiratoryRate);
  const spo2 = Number(data.oxygenSaturation);

  // Evaluate active Clinical Rules using Interpreter logic
  const alerts: string[] = [];
  store.clinicalRules.filter(r => r.isActive).forEach(rule => {
    let val = 0;
    if (rule.field === 'temperature') val = temp;
    if (rule.field === 'heartRate') val = hr;
    if (rule.field === 'bloodPressureSys') val = sys;
    if (rule.field === 'oxygenSaturation') val = spo2;
    if (rule.field === 'respiratoryRate') val = rr;

    let match = false;
    if (rule.operator === '>' && val > rule.value) match = true;
    if (rule.operator === '<' && val < rule.value) match = true;
    if (rule.operator === '>=' && val >= rule.value) match = true;
    if (rule.operator === '<=' && val <= rule.value) match = true;
    if (rule.operator === '==' && val === rule.value) match = true;

    if (match) {
      alerts.push(`${rule.severity}: ${rule.name} (${rule.field}=${val} ${rule.operator} ${rule.value})`);
    }
  });

  const record: VitalsRecord = {
    id: `vit_${Date.now()}`,
    patientId: data.patientId,
    patientName: data.patientName,
    recordedBy: data.recordedBy || 'Elena Rostova, RN',
    timestamp: new Date().toISOString(),
    temperature: temp,
    heartRate: hr,
    bloodPressureSys: sys,
    bloodPressureDia: dia,
    respiratoryRate: rr,
    oxygenSaturation: spo2,
    alertsGenerated: alerts
  };

  store.vitalsRecords.unshift(record);

  // If alerts generated, create Care Event via Mediator pattern
  if (alerts.length > 0) {
    store.careEvents.unshift({
      id: `care_${Date.now()}`,
      patientId: data.patientId,
      patientName: data.patientName,
      senderRole: 'Nurse',
      senderName: data.recordedBy || 'Elena Rostova, RN',
      targetDepartment: 'Cardiology & Internal Medicine',
      eventType: 'PATIENT_MONITORING_REQUIRED',
      urgency: alerts.some(a => a.startsWith('CRITICAL')) ? 'EMERGENCY' : 'URGENT',
      message: `Abnormal vitals detected: ${alerts.join(' | ')}`,
      status: 'OPEN',
      timestamp: new Date().toISOString()
    });
  }

  store.persist();
  store.logAudit(data.recordedBy || 'Nurse', 'nurse', 'RECORD_VITALS', 'Clinical Rules', `Evaluated vitals for ${data.patientName}; generated ${alerts.length} alerts`, 'Interpreter + Observer');

  res.status(201).json(record);
});

// Clinical Rules CRUD
app.get('/api/clinical-rules', (req: Request, res: Response) => {
  res.json(store.clinicalRules);
});

app.post('/api/clinical-rules', (req: Request, res: Response) => {
  const newRule: ClinicalRule = {
    id: `rule_${Date.now()}`,
    name: req.body.name || 'New Custom Clinical Rule',
    field: req.body.field || 'temperature',
    operator: req.body.operator || '>',
    value: Number(req.body.value) || 38.5,
    action: req.body.action || 'NOTIFY_PHYSICIAN',
    severity: req.body.severity || 'MEDIUM',
    message: req.body.message || 'Custom rule condition met.',
    isActive: req.body.isActive !== false
  };

  store.clinicalRules.unshift(newRule);
  store.persist();
  res.status(201).json(newRule);
});

app.put('/api/clinical-rules/:id', (req: Request, res: Response) => {
  const index = store.clinicalRules.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Rule not found' });

  store.clinicalRules[index] = { ...store.clinicalRules[index], ...req.body };
  store.persist();
  res.json(store.clinicalRules[index]);
});

// Care Events (Mediator Pattern Context)
app.get('/api/care-events', (req: Request, res: Response) => {
  res.json(store.careEvents);
});

app.post('/api/care-events', (req: Request, res: Response) => {
  const newEvent: CareEvent = {
    id: `care_${Date.now()}`,
    patientId: req.body.patientId,
    patientName: req.body.patientName,
    senderRole: req.body.senderRole || 'Doctor',
    senderName: req.body.senderName || 'Dr. Robert Vance',
    targetDepartment: req.body.targetDepartment || 'Nursing',
    eventType: req.body.eventType || 'PATIENT_MONITORING_REQUIRED',
    urgency: req.body.urgency || 'ROUTINE',
    message: req.body.message || 'Care coordination message',
    status: 'OPEN',
    timestamp: new Date().toISOString()
  };

  store.careEvents.unshift(newEvent);
  store.persist();
  store.logAudit(newEvent.senderName, newEvent.senderRole.toLowerCase(), 'DISPATCH_CARE_EVENT', 'Care Coordination', `Dispatched care request to ${newEvent.targetDepartment}`, 'Mediator');

  res.status(201).json(newEvent);
});

app.put('/api/care-events/:id/status', (req: Request, res: Response) => {
  const event = store.careEvents.find(c => c.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Care event not found' });

  event.status = req.body.status || 'RESOLVED';
  store.persist();
  res.json(event);
});

// AI Intelligence & Clinical Decision Support Endpoints (Stored in MongoDB Atlas)
app.post('/api/ai/analyze/patient/:id', async (req: Request, res: Response) => {
  try {
    const patient = store.patients.find(p => p.id === req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    
    const vitals = store.vitalsRecords.filter(v => v.patientId === patient.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const labs = store.labOrders.filter(l => l.patientId === patient.id);
    const prescriptions = store.prescriptions.filter(p => p.patientId === patient.id);
    const doctorName = req.body.analyzedBy || 'Dr. Robert Vance, MD';

    const analysis = await AiAnalysisService.analyzePatient(patient, vitals, labs, prescriptions, doctorName);
    
    store.logAudit(doctorName, 'doctor', 'AI_CLINICAL_ANALYSIS', 'Clinical AI Intelligence', `Computed AI Acuity Risk (${analysis.riskScore}/100 [${analysis.riskLevel}]) for ${patient.name}`, 'Expert System / AI');

    res.json(analysis);
  } catch (error: any) {
    console.error('[AI Analysis Error]', error);
    res.status(500).json({ error: 'Failed to generate patient AI analysis', details: error.message });
  }
});

app.post('/api/ai/analyze/bill/:id', async (req: Request, res: Response) => {
  try {
    const bill = store.bills.find(b => b.id === req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    
    const auditorName = req.body.analyzedBy || 'Marcus Holloway';
    const analysis = await AiAnalysisService.analyzeBill(bill, auditorName);

    store.logAudit(auditorName, 'billing', 'AI_CLAIM_AUDIT', 'Financial AI Intelligence', `Pre-submission AI Denial Risk audit (${analysis.riskScore}% [${analysis.riskLevel}]) for Invoice #${bill.invoiceNumber}`, 'Predictive AI / Rules');

    res.json(analysis);
  } catch (error: any) {
    console.error('[AI Bill Analysis Error]', error);
    res.status(500).json({ error: 'Failed to generate bill AI analysis', details: error.message });
  }
});

app.get('/api/ai/analyze/operations', async (req: Request, res: Response) => {
  try {
    const totalPatients = store.patients.length;
    const criticalCount = store.patients.filter(p => p.priority === 'CRITICAL').length;
    const totalBeds = store.config.wards.reduce((acc, w) => acc + w.capacity, 0);
    const occupiedBeds = store.config.wards.reduce((acc, w) => acc + w.occupied, 0);
    const pendingLabs = store.labOrders.filter(l => l.status !== 'COMPLETED' && l.status !== 'CANCELLED').length;

    const analysis = await AiAnalysisService.analyzeHospitalOperations(
      totalPatients,
      criticalCount,
      totalBeds,
      occupiedBeds,
      pendingLabs
    );

    res.json(analysis);
  } catch (error: any) {
    console.error('[AI Operations Error]', error);
    res.status(500).json({ error: 'Failed to generate operational AI analysis', details: error.message });
  }
});

app.get('/api/ai/analyses', async (req: Request, res: Response) => {
  try {
    const targetType = req.query.targetType as string;
    const filter = targetType ? { targetType } : {};
    const analyses = await AiAnalysisModel.find(filter).sort({ timestamp: -1 }).limit(100);
    res.json(analyses);
  } catch (error: any) {
    console.error('[Get AI Analyses Error]', error);
    res.status(500).json({ error: 'Failed to fetch AI analyses from MongoDB', details: error.message });
  }
});

app.get('/api/ai/analyses/target/:targetId', async (req: Request, res: Response) => {
  try {
    const analyses = await AiAnalysisModel.find({ targetId: req.params.targetId }).sort({ timestamp: -1 });
    res.json(analyses);
  } catch (error: any) {
    console.error('[Get AI Analyses Target Error]', error);
    res.status(500).json({ error: 'Failed to fetch target AI analyses from MongoDB', details: error.message });
  }
});

// Audit Logs
app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json(store.auditLogs);
});

// Reset Data Endpoint
app.post('/api/reset-data', (req: Request, res: Response) => {
  store.resetToSeed();
  res.json({ success: true, message: 'Hospital database reset to clean seed baseline.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[MediFlow Backend] Server running on http://localhost:${PORT}`);
});

