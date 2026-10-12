import mongoose, { Schema, Document } from 'mongoose';
import {
  User, Patient, Doctor, Appointment, Admission, LabOrder, Prescription,
  TreatmentPlan, Bill, VitalsRecord, ClinicalRule, CareEvent, AuditLog,
  HospitalConfigData
} from '../store/seedData.js';

// 1. User Schema
const UserSchema = new Schema<User>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['admin', 'receptionist', 'doctor', 'nurse', 'lab_tech', 'pharmacist', 'billing_officer'],
    index: true 
  },
  department: { type: String, required: true },
  avatar: { type: String, required: true },
  title: { type: String, required: true },
  permissions: [{ type: String }]
}, { timestamps: true });

// 2. Doctor Schema
const DoctorSchema = new Schema<Doctor>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  department: { type: String, required: true, index: true },
  specialization: { type: String, required: true },
  availability: { 
    type: String, 
    required: true, 
    enum: ['AVAILABLE', 'IN_CONSULTATION', 'ON_LEAVE', 'EMERGENCY_DUTY'],
    index: true 
  },
  currentActivePatients: { type: Number, default: 0 },
  experienceYears: { type: Number, default: 0 },
  email: { type: String, required: true }
}, { timestamps: true });

// 3. Patient Schema
const PatientSchema = new Schema<Patient>({
  id: { type: String, required: true, unique: true, index: true },
  mrn: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: { type: String, required: true },
  contactNumber: { type: String, required: true },
  emergencyContact: { type: String, required: true },
  registrationType: { 
    type: String, 
    required: true, 
    enum: ['REGULAR', 'EMERGENCY', 'REFERRED'],
    index: true 
  },
  priority: { 
    type: String, 
    required: true, 
    enum: ['NORMAL', 'HIGH', 'CRITICAL'],
    index: true 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['REGISTERED', 'ADMITTED', 'DISCHARGED', 'IN_CONSULTATION'],
    index: true 
  },
  referralSource: { type: String },
  allergies: [{ type: String }],
  diagnosis: { type: String },
  attendingDoctorId: { type: String, index: true },
  room: { type: String },
  bed: { type: String },
  medicalHistory: [{
    id: { type: String },
    date: { type: String },
    type: { type: String },
    title: { type: String },
    description: { type: String },
    doctorName: { type: String }
  }],
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

// 4. Appointment Schema
const AppointmentSchema = new Schema<Appointment>({
  id: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  doctorId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  department: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['SCHEDULED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'],
    index: true 
  },
  priority: { type: String, required: true, enum: ['NORMAL', 'HIGH', 'CRITICAL'] },
  schedulingStrategyUsed: { 
    type: String, 
    required: true, 
    enum: ['MANUAL', 'FIRST_AVAILABLE', 'LEAST_BUSY'] 
  },
  history: [{
    from: { type: String },
    to: { type: String },
    timestamp: { type: String },
    action: { type: String },
    performedBy: { type: String }
  }],
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

// 5. Admission Schema
const AdmissionSchema = new Schema<Admission>({
  id: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  doctorId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  department: { type: String, required: true },
  ward: { type: String, required: true },
  room: { type: String, required: true },
  bed: { type: String, required: true },
  admissionDate: { type: String, required: true },
  reason: { type: String, required: true },
  priority: { type: String, required: true, enum: ['NORMAL', 'HIGH', 'CRITICAL'] },
  status: { 
    type: String, 
    required: true, 
    enum: ['ADMITTED', 'UNDER_OBSERVATION', 'READY_FOR_DISCHARGE', 'DISCHARGED'],
    index: true 
  },
  treatmentPlanId: { type: String },
  notes: { type: String }
}, { timestamps: true });

// 6. Lab Order Schema
const LabOrderSchema = new Schema<LabOrder>({
  id: { type: String, required: true, unique: true, index: true },
  orderNumber: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  doctorId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  testCode: { type: String, required: true },
  testName: { type: String, required: true },
  category: { type: String, required: true, enum: ['BLOOD', 'RADIOLOGY', 'PATHOLOGY'] },
  provider: { type: String, required: true, enum: ['INTERNAL', 'EXTERNAL', 'RADIOLOGY_CENTER'] },
  priority: { type: String, required: true, enum: ['ROUTINE', 'URGENT', 'STAT'] },
  status: { 
    type: String, 
    required: true, 
    enum: ['PENDING', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED'],
    index: true 
  },
  orderDate: { type: String, required: true },
  completionDate: { type: String },
  results: {
    summary: { type: String },
    parameters: [{
      name: { type: String },
      value: { type: Schema.Types.Mixed },
      unit: { type: String },
      referenceRange: { type: String },
      status: { type: String, enum: ['NORMAL', 'HIGH', 'LOW', 'CRITICAL'] }
    }],
    technicianNotes: { type: String }
  },
  isCritical: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// 7. Prescription Schema
const PrescriptionSchema = new Schema<Prescription>({
  id: { type: String, required: true, unique: true, index: true },
  prescriptionNumber: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  doctorId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  date: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['PRESCRIBED', 'VERIFIED', 'DISPENSED'],
    index: true 
  },
  items: [{
    medicationId: { type: String, required: true },
    medicationName: { type: String, required: true },
    genericName: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: [{ type: String }],
    warnings: [{ type: String }],
    dispensed: { type: Boolean, default: false }
  }],
  notes: { type: String }
}, { timestamps: true });

// 8. Treatment Plan Schema
const TreatmentPlanSchema = new Schema<TreatmentPlan>({
  id: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  doctorId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  name: { type: String, required: true },
  diagnosis: { type: String, required: true },
  medications: [{ type: String }],
  instructions: [{ type: String }],
  followUpSchedule: { type: String },
  status: { type: String, required: true, enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] },
  versions: [{
    version: { type: Number, required: true },
    timestamp: { type: String, required: true },
    note: { type: String },
    snapshot: {
      name: { type: String },
      diagnosis: { type: String },
      medications: [{ type: String }],
      instructions: [{ type: String }],
      followUpSchedule: { type: String }
    }
  }],
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

// 9. Bill Schema
const BillSchema = new Schema<Bill>({
  id: { type: String, required: true, unique: true, index: true },
  invoiceNumber: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  date: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['DRAFT', 'PENDING', 'CLAIM_SUBMITTED', 'PAID', 'PARTIAL'],
    index: true 
  },
  groups: [{
    name: { type: String, required: true },
    items: [{
      id: { type: String },
      name: { type: String },
      category: { type: String },
      amount: { type: Number },
      quantity: { type: Number }
    }]
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  insuranceClaim: {
    claimId: { type: String },
    provider: { type: String },
    policyNumber: { type: String },
    preAuthCode: { type: String },
    claimAmount: { type: Number },
    approvedAmount: { type: Number },
    status: { type: String, enum: ['VALIDATING', 'APPROVED', 'REJECTED'] },
    stages: [{
      stage: { type: String },
      passed: { type: Boolean },
      message: { type: String },
      timestamp: { type: String }
    }]
  },
  payments: [{
    id: { type: String },
    amount: { type: Number },
    date: { type: String },
    method: { type: String, enum: ['CASH', 'CARD', 'INSURANCE', 'UPI'] },
    transactionRef: { type: String }
  }]
}, { timestamps: true });

// 10. Vitals Record Schema
const VitalsRecordSchema = new Schema<VitalsRecord>({
  id: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  recordedBy: { type: String, required: true },
  timestamp: { type: String, default: () => new Date().toISOString() },
  temperature: { type: Number, required: true },
  heartRate: { type: Number, required: true },
  bloodPressureSys: { type: Number, required: true },
  bloodPressureDia: { type: Number, required: true },
  respiratoryRate: { type: Number, required: true },
  oxygenSaturation: { type: Number, required: true },
  alertsGenerated: [{ type: String }]
}, { timestamps: true });

// 11. Clinical Rule Schema
const ClinicalRuleSchema = new Schema<ClinicalRule>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  field: { 
    type: String, 
    required: true, 
    enum: ['temperature', 'heartRate', 'bloodPressureSys', 'oxygenSaturation', 'respiratoryRate'] 
  },
  operator: { type: String, required: true, enum: ['>', '<', '==', '>=', '<='] },
  value: { type: Number, required: true },
  action: { 
    type: String, 
    required: true, 
    enum: ['CREATE_CRITICAL_ALERT', 'NOTIFY_PHYSICIAN', 'URGENT_TRIAGE', 'ORDER_OXYGEN'] 
  },
  severity: { type: String, required: true, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  message: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 12. Care Event Schema
const CareEventSchema = new Schema<CareEvent>({
  id: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  senderRole: { type: String, required: true },
  senderName: { type: String, required: true },
  targetDepartment: { type: String, required: true },
  eventType: { 
    type: String, 
    required: true, 
    enum: ['LAB_TEST_REQUIRED', 'MEDICATION_REQUIRED', 'PATIENT_MONITORING_REQUIRED', 'CONSULTATION_REQUESTED', 'DISCHARGE_CLEARANCE'] 
  },
  urgency: { type: String, required: true, enum: ['ROUTINE', 'URGENT', 'EMERGENCY'] },
  message: { type: String, required: true },
  status: { type: String, required: true, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], index: true },
  timestamp: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

// 13. Hospital Config Schema
const HospitalConfigSchema = new Schema({
  singletonKey: { type: String, default: 'GLOBAL_CONFIG', unique: true, index: true },
  hospitalName: { type: String, required: true },
  tagline: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  emergencyHotline: { type: String, required: true },
  workingHours: { type: String, required: true },
  address: { type: String, required: true },
  supportedRoles: [{ type: String }],
  departments: [{
    id: { type: String },
    name: { type: String },
    head: { type: String },
    totalBeds: { type: Number },
    occupiedBeds: { type: Number }
  }],
  wards: [{
    id: { type: String },
    name: { type: String },
    department: { type: String },
    capacity: { type: Number },
    occupied: { type: Number }
  }],
  systemPolicies: {
    emergencyAutoAdmit: { type: Boolean },
    telemetrySamplingRateSeconds: { type: Number },
    autoClaimValidation: { type: Boolean },
    strictRoleAccessControl: { type: Boolean },
    maxVitalsRetentionDays: { type: Number },
    mementoMaxSnapshots: { type: Number }
  },
  lastUpdated: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

// 14. Audit Log Schema
const AuditLogSchema = new Schema<AuditLog>({
  id: { type: String, required: true, unique: true, index: true },
  timestamp: { type: String, default: () => new Date().toISOString(), index: true },
  actor: { type: String, required: true },
  role: { type: String, required: true },
  action: { type: String, required: true },
  module: { type: String, required: true },
  details: { type: String, required: true },
  patternUsed: { type: String }
}, { timestamps: true });

export const UserModel = mongoose.model<User>('User', UserSchema, 'users');
export const DoctorModel = mongoose.model<Doctor>('Doctor', DoctorSchema, 'doctors');
export const PatientModel = mongoose.model<Patient>('Patient', PatientSchema, 'patients');
export const AppointmentModel = mongoose.model<Appointment>('Appointment', AppointmentSchema, 'appointments');
export const AdmissionModel = mongoose.model<Admission>('Admission', AdmissionSchema, 'admissions');
export const LabOrderModel = mongoose.model<LabOrder>('LabOrder', LabOrderSchema, 'lab_orders');
export const PrescriptionModel = mongoose.model<Prescription>('Prescription', PrescriptionSchema, 'prescriptions');
export const TreatmentPlanModel = mongoose.model<TreatmentPlan>('TreatmentPlan', TreatmentPlanSchema, 'treatment_plans');
export const BillModel = mongoose.model<Bill>('Bill', BillSchema, 'bills');
export const VitalsRecordModel = mongoose.model<VitalsRecord>('VitalsRecord', VitalsRecordSchema, 'vitals_records');
export const ClinicalRuleModel = mongoose.model<ClinicalRule>('ClinicalRule', ClinicalRuleSchema, 'clinical_rules');
export const CareEventModel = mongoose.model<CareEvent>('CareEvent', CareEventSchema, 'care_events');
export const HospitalConfigModel = mongoose.model('HospitalConfig', HospitalConfigSchema, 'hospital_config');
export const AuditLogModel = mongoose.model<AuditLog>('AuditLog', AuditLogSchema, 'audit_logs');

// 15. AI Analysis Schema
const AiAnalysisSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  targetType: { type: String, required: true, enum: ['PATIENT', 'BILL', 'HOSPITAL'], index: true },
  targetId: { type: String, required: true, index: true },
  targetName: { type: String, required: true },
  portalSource: { type: String, required: true, index: true },
  analysisType: { type: String, required: true, index: true },
  riskScore: { type: Number, required: true },
  riskLevel: { type: String, required: true, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'], index: true },
  summary: { type: String, required: true },
  keyFindings: [{ type: String }],
  recommendations: [{ type: String }],
  contraindications: [{ type: String }],
  evidenceFactors: [{
    factor: { type: String },
    impact: { type: String, enum: ['ELEVATED', 'PROTECTIVE', 'CRITICAL'] },
    weight: { type: Number }
  }],
  doctorActionPlan: { type: String },
  timestamp: { type: String, default: () => new Date().toISOString(), index: true },
  analyzedBy: { type: String, required: true }
}, { timestamps: true });

export const AiAnalysisModel = mongoose.model('AiAnalysis', AiAnalysisSchema, 'ai_analyses');
