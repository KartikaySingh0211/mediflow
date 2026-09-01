import fs from 'fs';
import path from 'path';
import {
  User, Patient, Doctor, Appointment, Admission, LabOrder, Prescription,
  TreatmentPlan, Bill, VitalsRecord, ClinicalRule, CareEvent, AuditLog,
  HospitalConfigData,
  initialUsers, initialDoctors, initialPatients, initialAppointments,
  initialAdmissions, initialLabOrders, initialPrescriptions, initialTreatmentPlans,
  initialBills, initialVitalsRecords, initialClinicalRules, initialCareEvents,
  initialAuditLogs, initialHospitalConfig
} from './seedData.js';

const SNAPSHOT_FILE = path.join(process.cwd(), 'data_snapshot.json');

export class HospitalDataStore {
  private static instance: HospitalDataStore;

  public users: User[] = [];
  public doctors: Doctor[] = [];
  public patients: Patient[] = [];
  public appointments: Appointment[] = [];
  public admissions: Admission[] = [];
  public labOrders: LabOrder[] = [];
  public prescriptions: Prescription[] = [];
  public treatmentPlans: TreatmentPlan[] = [];
  public bills: Bill[] = [];
  public vitalsRecords: VitalsRecord[] = [];
  public clinicalRules: ClinicalRule[] = [];
  public careEvents: CareEvent[] = [];
  public auditLogs: AuditLog[] = [];
  public config: HospitalConfigData = { ...initialHospitalConfig };

  private constructor() {
    this.loadFromDiskOrSeed();
  }

  public static getInstance(): HospitalDataStore {
    if (!HospitalDataStore.instance) {
      HospitalDataStore.instance = new HospitalDataStore();
    }
    return HospitalDataStore.instance;
  }

  private loadFromDiskOrSeed() {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      try {
        const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.users = data.users || initialUsers;
        this.doctors = data.doctors || initialDoctors;
        this.patients = data.patients || initialPatients;
        this.appointments = data.appointments || initialAppointments;
        this.admissions = data.admissions || initialAdmissions;
        this.labOrders = data.labOrders || initialLabOrders;
        this.prescriptions = data.prescriptions || initialPrescriptions;
        this.treatmentPlans = data.treatmentPlans || initialTreatmentPlans;
        this.bills = data.bills || initialBills;
        this.vitalsRecords = data.vitalsRecords || initialVitalsRecords;
        this.clinicalRules = data.clinicalRules || initialClinicalRules;
        this.careEvents = data.careEvents || initialCareEvents;
        this.auditLogs = data.auditLogs || initialAuditLogs;
        this.config = data.config || initialHospitalConfig;
        console.log('[DataStore] Loaded existing hospital snapshot from disk.');
        return;
      } catch (err) {
        console.error('[DataStore] Error loading snapshot, falling back to seed data:', err);
      }
    }

    // Seed defaults
    this.resetToSeed();
  }

  public resetToSeed() {
    this.users = JSON.parse(JSON.stringify(initialUsers));
    this.doctors = JSON.parse(JSON.stringify(initialDoctors));
    this.patients = JSON.parse(JSON.stringify(initialPatients));
    this.appointments = JSON.parse(JSON.stringify(initialAppointments));
    this.admissions = JSON.parse(JSON.stringify(initialAdmissions));
    this.labOrders = JSON.parse(JSON.stringify(initialLabOrders));
    this.prescriptions = JSON.parse(JSON.stringify(initialPrescriptions));
    this.treatmentPlans = JSON.parse(JSON.stringify(initialTreatmentPlans));
    this.bills = JSON.parse(JSON.stringify(initialBills));
    this.vitalsRecords = JSON.parse(JSON.stringify(initialVitalsRecords));
    this.clinicalRules = JSON.parse(JSON.stringify(initialClinicalRules));
    this.careEvents = JSON.parse(JSON.stringify(initialCareEvents));
    this.auditLogs = JSON.parse(JSON.stringify(initialAuditLogs));
    this.config = JSON.parse(JSON.stringify(initialHospitalConfig));
    this.persist();
    console.log('[DataStore] Initialized fresh seed data.');
  }

  public persist() {
    try {
      const payload = {
        users: this.users,
        doctors: this.doctors,
        patients: this.patients,
        appointments: this.appointments,
        admissions: this.admissions,
        labOrders: this.labOrders,
        prescriptions: this.prescriptions,
        treatmentPlans: this.treatmentPlans,
        bills: this.bills,
        vitalsRecords: this.vitalsRecords,
        clinicalRules: this.clinicalRules,
        careEvents: this.careEvents,
        auditLogs: this.auditLogs,
        config: this.config,
        savedAt: new Date().toISOString()
      };
      fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DataStore] Error persisting to disk:', err);
    }
  }

  public logAudit(actor: string, role: string, action: string, module: string, details: string, patternUsed?: string) {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      actor,
      role,
      action,
      module,
      details,
      patternUsed
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    this.persist();
    return log;
  }
}
