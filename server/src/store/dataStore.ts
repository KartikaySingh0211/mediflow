import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '../db/connection.js';
import {
  UserModel, DoctorModel, PatientModel, AppointmentModel,
  AdmissionModel, LabOrderModel, PrescriptionModel, TreatmentPlanModel,
  BillModel, VitalsRecordModel, ClinicalRuleModel, CareEventModel,
  HospitalConfigModel, AuditLogModel
} from '../db/models.js';
import { seedDatabase } from '../db/seed.js';
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
  public isMongoConnected: boolean = false;

  private constructor() {
    this.init();
  }

  public static getInstance(): HospitalDataStore {
    if (!HospitalDataStore.instance) {
      HospitalDataStore.instance = new HospitalDataStore();
    }
    return HospitalDataStore.instance;
  }

  public async init() {
    try {
      console.log('[DataStore] Connecting to MongoDB Atlas cluster...');
      await connectToDatabase();
      this.isMongoConnected = true;

      // Check if MongoDB has data; if empty, run seed migration
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        console.log('[DataStore] MongoDB is empty. Seeding initial data to Atlas...');
        await seedDatabase({ wipe: false });
      }

      await this.loadFromMongo();
      console.log('[DataStore] ✅ Hospital data store successfully synchronized with MongoDB Atlas!');
    } catch (err) {
      console.error('[DataStore] MongoDB connection failed, falling back to local snapshot/seed:', err);
      this.loadFromDiskOrSeed();
    }
  }

  public async loadFromMongo() {
    try {
      const [
        users, doctors, patients, appointments, admissions,
        labOrders, prescriptions, treatmentPlans, bills,
        vitalsRecords, clinicalRules, careEvents, auditLogs, configDoc
      ] = await Promise.all([
        UserModel.find().lean(),
        DoctorModel.find().lean(),
        PatientModel.find().lean(),
        AppointmentModel.find().lean(),
        AdmissionModel.find().lean(),
        LabOrderModel.find().lean(),
        PrescriptionModel.find().lean(),
        TreatmentPlanModel.find().lean(),
        BillModel.find().lean(),
        VitalsRecordModel.find().lean(),
        ClinicalRuleModel.find().lean(),
        CareEventModel.find().lean(),
        AuditLogModel.find().sort({ timestamp: -1 }).limit(500).lean(),
        HospitalConfigModel.findOne({ singletonKey: 'GLOBAL_CONFIG' }).lean()
      ]);

      this.users = (users as any[]) || initialUsers;
      this.doctors = (doctors as any[]) || initialDoctors;
      this.patients = (patients as any[]) || initialPatients;
      this.appointments = (appointments as any[]) || initialAppointments;
      this.admissions = (admissions as any[]) || initialAdmissions;
      this.labOrders = (labOrders as any[]) || initialLabOrders;
      this.prescriptions = (prescriptions as any[]) || initialPrescriptions;
      this.treatmentPlans = (treatmentPlans as any[]) || initialTreatmentPlans;
      this.bills = (bills as any[]) || initialBills;
      this.vitalsRecords = (vitalsRecords as any[]) || initialVitalsRecords;
      this.clinicalRules = (clinicalRules as any[]) || initialClinicalRules;
      this.careEvents = (careEvents as any[]) || initialCareEvents;
      this.auditLogs = (auditLogs as any[]) || initialAuditLogs;
      if (configDoc) {
        const { singletonKey, _id, __v, createdAt, updatedAt, ...cfg } = configDoc as any;
        this.config = cfg as HospitalConfigData;
      } else {
        this.config = { ...initialHospitalConfig };
      }

      // Also update local snapshot
      this.saveLocalSnapshot();
    } catch (err) {
      console.error('[DataStore] Error loading from MongoDB:', err);
    }
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

  public async resetToSeed() {
    if (this.isMongoConnected) {
      try {
        await seedDatabase({ wipe: true });
        await this.loadFromMongo();
        console.log('[DataStore] MongoDB Atlas reset and re-seeded successfully.');
        return;
      } catch (err) {
        console.error('[DataStore] Error resetting MongoDB:', err);
      }
    }

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
    // 1. Save local snapshot
    this.saveLocalSnapshot();

    // 2. Asynchronously sync to MongoDB Atlas
    if (this.isMongoConnected) {
      this.syncToMongo().catch(err => {
        console.error('[DataStore] Async MongoDB sync error:', err);
      });
    }
  }

  private saveLocalSnapshot() {
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
      console.error('[DataStore] Error persisting to disk snapshot:', err);
    }
  }

  public async syncToMongo() {
    if (!this.isMongoConnected) return;

    try {
      // Upsert HospitalConfig
      await HospitalConfigModel.updateOne(
        { singletonKey: 'GLOBAL_CONFIG' },
        { $set: { ...this.config, singletonKey: 'GLOBAL_CONFIG' } },
        { upsert: true }
      );

      // Save modified collections
      // Patients
      for (const p of this.patients) {
        await PatientModel.updateOne({ id: p.id }, { $set: p }, { upsert: true });
      }
      // Appointments
      for (const a of this.appointments) {
        await AppointmentModel.updateOne({ id: a.id }, { $set: a }, { upsert: true });
      }
      // Admissions
      for (const ad of this.admissions) {
        await AdmissionModel.updateOne({ id: ad.id }, { $set: ad }, { upsert: true });
      }
      // Lab Orders
      for (const l of this.labOrders) {
        await LabOrderModel.updateOne({ id: l.id }, { $set: l }, { upsert: true });
      }
      // Prescriptions
      for (const rx of this.prescriptions) {
        await PrescriptionModel.updateOne({ id: rx.id }, { $set: rx }, { upsert: true });
      }
      // Treatment Plans
      for (const tp of this.treatmentPlans) {
        await TreatmentPlanModel.updateOne({ id: tp.id }, { $set: tp }, { upsert: true });
      }
      // Bills
      for (const b of this.bills) {
        await BillModel.updateOne({ id: b.id }, { $set: b }, { upsert: true });
      }
      // Vitals
      for (const v of this.vitalsRecords) {
        await VitalsRecordModel.updateOne({ id: v.id }, { $set: v }, { upsert: true });
      }
      // Care Events
      for (const ce of this.careEvents) {
        await CareEventModel.updateOne({ id: ce.id }, { $set: ce }, { upsert: true });
      }
    } catch (err) {
      console.error('[DataStore] Error syncing to MongoDB:', err);
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

    // Persist to MongoDB
    if (this.isMongoConnected) {
      AuditLogModel.create(log).catch(err => {
        console.error('[DataStore] Error saving audit log to MongoDB:', err);
      });
    }

    this.saveLocalSnapshot();
    return log;
  }
}
