export type UserRole = 
  | 'admin' 
  | 'receptionist' 
  | 'doctor' 
  | 'nurse' 
  | 'lab_tech' 
  | 'pharmacist' 
  | 'billing_officer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar: string;
  title: string;
  permissions: string[];
}

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  contactNumber: string;
  emergencyContact: string;
  registrationType: 'REGULAR' | 'EMERGENCY' | 'REFERRED';
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: 'REGISTERED' | 'ADMITTED' | 'DISCHARGED' | 'IN_CONSULTATION';
  referralSource?: string;
  allergies: string[];
  diagnosis?: string;
  attendingDoctorId?: string;
  room?: string;
  bed?: string;
  medicalHistory: Array<{
    id: string;
    date: string;
    type: 'Consultation' | 'Admission' | 'Lab Result' | 'Prescription' | 'Surgery';
    title: string;
    description: string;
    doctorName: string;
  }>;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  availability: 'AVAILABLE' | 'IN_CONSULTATION' | 'ON_LEAVE' | 'EMERGENCY_DUTY';
  currentActivePatients: number;
  experienceYears: number;
  email: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  reason: string;
  status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
  schedulingStrategyUsed: 'MANUAL' | 'FIRST_AVAILABLE' | 'LEAST_BUSY';
  history: Array<{
    from: string;
    to: string;
    timestamp: string;
    action: string;
    performedBy: string;
  }>;
  createdAt: string;
}

export interface Admission {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  ward: string;
  room: string;
  bed: string;
  admissionDate: string;
  reason: string;
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: 'ADMITTED' | 'UNDER_OBSERVATION' | 'READY_FOR_DISCHARGE' | 'DISCHARGED';
  treatmentPlanId?: string;
  notes?: string;
}

export interface LabOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  testCode: string;
  testName: string;
  category: 'BLOOD' | 'RADIOLOGY' | 'PATHOLOGY';
  provider: 'INTERNAL' | 'EXTERNAL' | 'RADIOLOGY_CENTER';
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  status: 'PENDING' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  orderDate: string;
  completionDate?: string;
  results?: {
    summary: string;
    parameters: Array<{ name: string; value: string | number; unit: string; referenceRange: string; status: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' }>;
    technicianNotes: string;
  };
  isCritical?: boolean;
}

export interface PrescriptionItem {
  medicationId: string;
  medicationName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string[];
  warnings: string[];
  dispensed: boolean;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  status: 'PRESCRIBED' | 'VERIFIED' | 'DISPENSED';
  items: PrescriptionItem[];
  notes?: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  name: string;
  diagnosis: string;
  medications: string[];
  instructions: string[];
  followUpSchedule: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  versions: Array<{
    version: number;
    timestamp: string;
    note: string;
    snapshot: {
      name: string;
      diagnosis: string;
      medications: string[];
      instructions: string[];
      followUpSchedule: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  quantity: number;
}

export interface BillGroup {
  name: string;
  items: BillItem[];
}

export interface Bill {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  date: string;
  status: 'DRAFT' | 'PENDING' | 'CLAIM_SUBMITTED' | 'PAID' | 'PARTIAL';
  groups: BillGroup[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  insuranceClaim?: {
    claimId: string;
    provider: string;
    policyNumber: string;
    preAuthCode?: string;
    claimAmount: number;
    approvedAmount?: number;
    status: 'VALIDATING' | 'APPROVED' | 'REJECTED';
    stages: Array<{
      stage: string;
      passed: boolean;
      message: string;
      timestamp: string;
    }>;
  };
  payments: Array<{
    id: string;
    amount: number;
    date: string;
    method: 'CASH' | 'CARD' | 'INSURANCE' | 'UPI';
    transactionRef: string;
  }>;
}

export interface VitalsRecord {
  id: string;
  patientId: string;
  patientName: string;
  recordedBy: string;
  timestamp: string;
  temperature: number;
  heartRate: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  alertsGenerated: string[];
}

export interface ClinicalRule {
  id: string;
  name: string;
  field: 'temperature' | 'heartRate' | 'bloodPressureSys' | 'oxygenSaturation' | 'respiratoryRate';
  operator: '>' | '<' | '==' | '>=' | '<=';
  value: number;
  action: 'CREATE_CRITICAL_ALERT' | 'NOTIFY_PHYSICIAN' | 'URGENT_TRIAGE' | 'ORDER_OXYGEN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  isActive: boolean;
}

export interface CareEvent {
  id: string;
  patientId: string;
  patientName: string;
  senderRole: string;
  senderName: string;
  targetDepartment: string;
  eventType: 'LAB_TEST_REQUIRED' | 'MEDICATION_REQUIRED' | 'PATIENT_MONITORING_REQUIRED' | 'CONSULTATION_REQUESTED' | 'DISCHARGE_CLEARANCE';
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  module: string;
  details: string;
  patternUsed?: string;
}

export interface HospitalConfigData {
  hospitalName: string;
  tagline: string;
  licenseNumber: string;
  emergencyHotline: string;
  workingHours: string;
  address: string;
  supportedRoles: string[];
  departments: Array<{ id: string; name: string; head: string; totalBeds: number; occupiedBeds: number }>;
  wards: Array<{ id: string; name: string; department: string; capacity: number; occupied: number }>;
  systemPolicies: Record<string, string | boolean | number>;
  lastUpdated: string;
}
