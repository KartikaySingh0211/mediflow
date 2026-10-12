import { connectToDatabase, disconnectDatabase } from './connection.js';
import {
  UserModel, DoctorModel, PatientModel, AppointmentModel,
  AdmissionModel, LabOrderModel, PrescriptionModel, TreatmentPlanModel,
  BillModel, VitalsRecordModel, ClinicalRuleModel, CareEventModel,
  HospitalConfigModel, AuditLogModel
} from './models.js';
import {
  initialUsers, initialDoctors, initialPatients, initialAppointments,
  initialAdmissions, initialLabOrders, initialPrescriptions, initialTreatmentPlans,
  initialBills, initialVitalsRecords, initialClinicalRules, initialCareEvents,
  initialAuditLogs, initialHospitalConfig
} from '../store/seedData.js';

export async function seedDatabase(options: { wipe?: boolean } = { wipe: true }): Promise<{
  users: number;
  doctors: number;
  patients: number;
  appointments: number;
  admissions: number;
  labOrders: number;
  prescriptions: number;
  treatmentPlans: number;
  bills: number;
  vitalsRecords: number;
  clinicalRules: number;
  careEvents: number;
  auditLogs: number;
  config: number;
}> {
  console.log('[Seed] Beginning MongoDB database seeding...');
  await connectToDatabase();

  if (options.wipe) {
    console.log('[Seed] Wiping existing collections for fresh seed state...');
    await Promise.all([
      UserModel.deleteMany({}),
      DoctorModel.deleteMany({}),
      PatientModel.deleteMany({}),
      AppointmentModel.deleteMany({}),
      AdmissionModel.deleteMany({}),
      LabOrderModel.deleteMany({}),
      PrescriptionModel.deleteMany({}),
      TreatmentPlanModel.deleteMany({}),
      BillModel.deleteMany({}),
      VitalsRecordModel.deleteMany({}),
      ClinicalRuleModel.deleteMany({}),
      CareEventModel.deleteMany({}),
      HospitalConfigModel.deleteMany({}),
      AuditLogModel.deleteMany({})
    ]);
  }

  console.log('[Seed] Inserting static hospital seed records into MongoDB Atlas collections...');
  const [
    users, doctors, patients, appointments, admissions,
    labOrders, prescriptions, treatmentPlans, bills,
    vitalsRecords, clinicalRules, careEvents, auditLogs, config
  ] = await Promise.all([
    UserModel.insertMany(initialUsers),
    DoctorModel.insertMany(initialDoctors),
    PatientModel.insertMany(initialPatients),
    AppointmentModel.insertMany(initialAppointments),
    AdmissionModel.insertMany(initialAdmissions),
    LabOrderModel.insertMany(initialLabOrders),
    PrescriptionModel.insertMany(initialPrescriptions),
    TreatmentPlanModel.insertMany(initialTreatmentPlans),
    BillModel.insertMany(initialBills),
    VitalsRecordModel.insertMany(initialVitalsRecords),
    ClinicalRuleModel.insertMany(initialClinicalRules),
    CareEventModel.insertMany(initialCareEvents),
    AuditLogModel.insertMany(initialAuditLogs),
    HospitalConfigModel.create({
      singletonKey: 'GLOBAL_CONFIG',
      ...initialHospitalConfig
    })
  ]);

  const summary = {
    users: users.length,
    doctors: doctors.length,
    patients: patients.length,
    appointments: appointments.length,
    admissions: admissions.length,
    labOrders: labOrders.length,
    prescriptions: prescriptions.length,
    treatmentPlans: treatmentPlans.length,
    bills: bills.length,
    vitalsRecords: vitalsRecords.length,
    clinicalRules: clinicalRules.length,
    careEvents: careEvents.length,
    auditLogs: auditLogs.length,
    config: 1
  };

  console.log('[Seed] ✅ Database seeding completed successfully! Document counts:');
  console.table(summary);

  return summary;
}

// Direct execution runner
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed] ❌ Seeding failed:', err);
      await disconnectDatabase();
      process.exit(1);
    });
}
