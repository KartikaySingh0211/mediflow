import 'dotenv/config';
import mongoose from 'mongoose';
import { 
  PatientModel, 
  AppointmentModel, 
  VitalsRecordModel, 
  LabOrderModel, 
  PrescriptionModel, 
  TreatmentPlanModel, 
  BillModel, 
  CareEventModel,
  AiAnalysisModel 
} from './db/models.js';

const API_BASE = 'http://localhost:5001/api';

interface StepResult {
  step: string;
  operation: string;
  entity: string;
  status: 'SUCCESS' | 'FAILED';
  details: string;
  mongoDocId?: string;
  verifiedInMongo: boolean;
}

const results: StepResult[] = [];

async function logStep(
  step: string, 
  operation: string, 
  entity: string, 
  apiPromise: () => Promise<any>, 
  mongoVerify: (apiResult: any) => Promise<any>
) {
  try {
    process.stdout.write(`⏳ [${step}] Testing ${operation} on ${entity}... `);
    const apiRes = await apiPromise();
    const mongoDoc = await mongoVerify(apiRes);

    if (mongoDoc) {
      console.log(`✅ VERIFIED IN MONGO ATLAS`);
      results.push({
        step,
        operation,
        entity,
        status: 'SUCCESS',
        details: `Created/Updated via REST API and confirmed live in MongoDB Atlas cluster`,
        mongoDocId: mongoDoc._id ? mongoDoc._id.toString() : (mongoDoc.id || 'Found'),
        verifiedInMongo: true
      });
      return { apiRes, mongoDoc };
    } else {
      console.log(`❌ NOT FOUND IN MONGO ATLAS`);
      results.push({
        step,
        operation,
        entity,
        status: 'FAILED',
        details: `API call succeeded but document was not found in MongoDB collection`,
        verifiedInMongo: false
      });
      return { apiRes, mongoDoc: null };
    }
  } catch (err: any) {
    console.log(`❌ ERROR: ${err.message}`);
    results.push({
      step,
      operation,
      entity,
      status: 'FAILED',
      details: err.message,
      verifiedInMongo: false
    });
    return { apiRes: null, mongoDoc: null };
  }
}

async function runMongoCrudVerification() {
  console.log('========================================================================');
  console.log('🚀 MEDIFLOW: FULL SYSTEM CRUD & MONGODB ATLAS PERSISTENCE VERIFICATION');
  console.log('========================================================================\n');

  // 1. Connect directly to MongoDB Atlas cluster for independent verification
  const MONGODB_URI = process.env.MONGODB_URI || '';
  console.log('[Mongo Verifier] Connecting directly to MongoDB Atlas cluster...');
  await mongoose.connect(MONGODB_URI);
  console.log(`[Mongo Verifier] Connected to database: ${mongoose.connection.db?.databaseName}`);
  console.log('------------------------------------------------------------------------\n');

  const testId = `test_${Date.now()}`;

  // STEP 1: CREATE PATIENT (Intake / Factory Method)
  const patientData = {
    name: `Test Subject Alpha (${testId})`,
    age: 48,
    gender: 'Female',
    bloodGroup: 'B+',
    contactNumber: '+1 (555) 019-2834',
    registrationType: 'EMERGENCY',
    priority: 'CRITICAL',
    diagnosis: 'Acute Coronary Syndrome with Troponin Elevation',
    allergies: ['Penicillin', 'Sulfa drugs'],
    actorName: 'Sarah Jenkins (Reception Desk)'
  };

  const { apiRes: createdPatient } = await logStep(
    'Step 1',
    'CREATE (POST /api/patients)',
    'Patient (Factory Method)',
    async () => {
      const res = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      return await res.json();
    },
    async (res) => {
      return await PatientModel.findOne({ id: res.id });
    }
  );

  const patientId = createdPatient?.id;

  // STEP 2: CREATE APPOINTMENT (Command + Strategy)
  const apptData = {
    patientId,
    patientName: createdPatient?.name,
    doctorId: 'doc_vance',
    doctorName: 'Dr. Robert Vance, MD',
    department: 'Cardiology',
    date: new Date().toISOString().split('T')[0],
    time: '14:30',
    type: 'Emergency Consultation',
    reason: 'STAT cardiac evaluation',
    schedulingStrategy: 'LeastBusyStrategy'
  };

  const { apiRes: createdAppt } = await logStep(
    'Step 2',
    'CREATE (POST /api/appointments)',
    'Appointment (Command + Strategy)',
    async () => {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apptData)
      });
      return await res.json();
    },
    async (res) => {
      return await AppointmentModel.findOne({ id: res.id });
    }
  );

  // STEP 3: UPDATE APPOINTMENT STATUS (State Pattern)
  await logStep(
    'Step 3',
    'UPDATE (PUT /api/appointments/:id/status)',
    'Appointment State Transition',
    async () => {
      const res = await fetch(`${API_BASE}/appointments/${createdAppt.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CHECKED_IN', actorName: 'Sarah Jenkins', actionNote: 'Patient arrived at triage desk' })
      });
      return await res.json();
    },
    async (res) => {
      return await AppointmentModel.findOne({ id: res.id, status: 'CHECKED_IN' });
    }
  );

  // STEP 4: RECORD VITALS & GENERATE CARE ALERTS (Interpreter + Observer)
  const vitalsData = {
    patientId,
    patientName: createdPatient?.name,
    bloodPressureSys: 165,
    bloodPressureDia: 102,
    heartRate: 115,
    temperature: 38.9,
    respiratoryRate: 24,
    oxygenSaturation: 89, // Critical hypoxemia
    recordedBy: 'Elena Rostova, RN'
  };

  const { apiRes: createdVitals } = await logStep(
    'Step 4',
    'CREATE (POST /api/vitals)',
    'Vitals Record (Interpreter + Observer)',
    async () => {
      const res = await fetch(`${API_BASE}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vitalsData)
      });
      return await res.json();
    },
    async (res) => {
      return await VitalsRecordModel.findOne({ id: res.id });
    }
  );

  // STEP 5: VERIFY AUTOMATIC CARE EVENT TRIGGERED (Mediator Pattern)
  await logStep(
    'Step 5',
    'READ (GET /api/care-events)',
    'Care Event Auto-Generated by Vitals Observer',
    async () => {
      const res = await fetch(`${API_BASE}/care-events`);
      const events = (await res.json()) as any[];
      return events.find((e: any) => e.patientId === patientId) || events[0];

    },
    async (res) => {
      return await CareEventModel.findOne({ patientId });
    }
  );

  // STEP 6: CREATE LAB ORDER (Abstract Factory + Bridge)
  const labData = {
    patientId,
    patientName: createdPatient?.name,
    doctorId: 'doc_vance',
    doctorName: 'Dr. Robert Vance, MD',
    testCode: 'CARD-TROP-I',
    testName: 'High-Sensitivity Troponin I & CK-MB',
    category: 'BLOOD',
    provider: 'INTERNAL',
    priority: 'STAT'
  };

  const { apiRes: createdLab } = await logStep(
    'Step 6',
    'CREATE (POST /api/lab-orders)',
    'Lab Order (Abstract Factory + Bridge)',
    async () => {
      const res = await fetch(`${API_BASE}/lab-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(labData)
      });
      return await res.json();
    },
    async (res) => {
      return await LabOrderModel.findOne({ id: res.id });
    }
  );

  // STEP 7: COMPLETE LAB RESULTS (Adapter Pattern / Diagnostic Processing)
  await logStep(
    'Step 7',
    'UPDATE (PUT /api/lab-orders/:id/results)',
    'Lab Results Completion (Adapter)',
    async () => {
      const resultsPayload = {
        summary: 'Elevated cardiac biomarkers consistent with acute myocardial ischemia',
        parameters: [
          { name: 'Troponin I', value: 4.8, unit: 'ng/mL', referenceRange: '< 0.04', status: 'CRITICAL' },
          { name: 'CK-MB', value: 34, unit: 'U/L', referenceRange: '0 - 25', status: 'HIGH' }
        ],
        technicianNotes: 'Assayed on Beckman Coulter Access 2 via internal laboratory bridge.'
      };
      const res = await fetch(`${API_BASE}/lab-orders/${createdLab.id}/results`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultsPayload)
      });
      return await res.json();
    },
    async (res) => {
      return await LabOrderModel.findOne({ id: res.id, status: 'COMPLETED' });
    }
  );

  // STEP 8: CREATE & SNAPSHOT TREATMENT PLAN (Prototype + Memento)
  const planData = {
    patientId,
    patientName: createdPatient?.name,
    doctorId: 'doc_vance',
    doctorName: 'Dr. Robert Vance, MD',
    name: 'Acute Coronary Syndrome Initial Protocol',
    diagnosis: 'STEMI / Unstable Angina',
    medications: ['Aspirin 325mg PO STAT', 'Ticagrelor 90mg BID', 'Atorvastatin 80mg QHS'],
    instructions: ['Bed rest with continuous 12-lead ECG telemetry', 'Low-flow O2 via nasal cannula'],
    followUpSchedule: 'ICU cardiology rounds Q4H'
  };

  const { apiRes: createdPlan } = await logStep(
    'Step 8',
    'CREATE (POST /api/treatment-plans)',
    'Treatment Plan (Prototype)',
    async () => {
      const res = await fetch(`${API_BASE}/treatment-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });
      return await res.json();
    },
    async (res) => {
      return await TreatmentPlanModel.findOne({ id: res.id });
    }
  );

  // STEP 9: CAPTURE MEMENTO VERSION SNAPSHOT (Memento Pattern)
  await logStep(
    'Step 9',
    'UPDATE (PUT /api/treatment-plans/:id/version)',
    'Treatment Plan Version Snapshot (Memento)',
    async () => {
      const versionUpdate = {
        name: 'Acute Coronary Syndrome Protocol - Post-Lab Titration',
        diagnosis: 'STEMI Confirmed via Troponin I 4.8 ng/mL',
        medications: ['Aspirin 325mg PO STAT', 'Ticagrelor 90mg BID', 'Atorvastatin 80mg QHS', 'Heparin IV continuous infusion'],
        instructions: ['Continuous hemodynamic monitoring', 'Transfer to Cath Lab'],
        followUpSchedule: 'Immediate coronary angiogram',
        versionNote: 'Added IV Heparin infusion following Troponin critical elevation'
      };
      const res = await fetch(`${API_BASE}/treatment-plans/${createdPlan.id}/version`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionUpdate)
      });
      return await res.json();
    },
    async (res) => {
      const doc = await TreatmentPlanModel.findOne({ id: res.id });
      return doc && doc.versions.length >= 2 ? doc : null;
    }
  );

  // STEP 10: CREATE PRESCRIPTION WITH WARNING DECORATORS (Flyweight + Decorator)
  const rxData = {
    patientId,
    patientName: createdPatient?.name,
    doctorId: 'doc_vance',
    doctorName: 'Dr. Robert Vance, MD',
    items: [
      {
        medicationId: 'med_atorvastatin',
        dosage: '80 mg PO',
        frequency: 'Once daily at bedtime',
        duration: '30 days',
        timing: 'Take after evening meal with water',
        warning: 'Absolute contraindication with grapefruit; monitor liver enzymes'
      }
    ],
    notes: 'Prescribed via Flyweight Medication Formulary with Decorator clinical warnings.'
  };

  const { apiRes: createdRx } = await logStep(
    'Step 10',
    'CREATE (POST /api/prescriptions)',
    'Prescription (Flyweight + Decorator)',
    async () => {
      const res = await fetch(`${API_BASE}/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rxData)
      });
      return await res.json();
    },
    async (res) => {
      return await PrescriptionModel.findOne({ id: res.id });
    }
  );

  // STEP 11: DISPENSE PRESCRIPTION (Pharmacy Dispense Update)
  await logStep(
    'Step 11',
    'UPDATE (PUT /api/prescriptions/:id/dispense)',
    'Pharmacy Dispensation Update',
    async () => {
      const res = await fetch(`${API_BASE}/prescriptions/${createdRx.id}/dispense`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorName: 'Priya Sharma, PharmD' })
      });
      return await res.json();
    },
    async (res) => {
      return await PrescriptionModel.findOne({ id: res.id, status: 'DISPENSED' });
    }
  );

  // STEP 12: CREATE COMPOSITE INVOICE (Composite Pattern)
  const billData = {
    patientId,
    patientName: createdPatient?.name,
    groups: [
      {
        name: 'Critical Care Cardiology Consultations',
        items: [
          { name: 'Initial Emergency Triage Assessment', category: 'Consultation', amount: 350, quantity: 1 },
          { name: 'Specialist Cardiology Direct Bedside Consult', category: 'Consultation', amount: 650, quantity: 1 }
        ]
      },
      {
        name: 'STAT Diagnostic Pathology & Biomarkers',
        items: [
          { name: 'High-Sensitivity Troponin I & CK-MB Panel', category: 'Laboratory', amount: 240, quantity: 1 },
          { name: 'Continuous 12-Lead Electrocardiography (ECG)', category: 'Diagnostics', amount: 180, quantity: 1 }
        ]
      },
      {
        name: 'Inpatient Pharmaceuticals',
        items: [
          { name: 'Atorvastatin 80mg High-Intensity Statin Pack', category: 'Pharmacy', amount: 85, quantity: 1 }
        ]
      }
    ]
  };

  const { apiRes: createdBill } = await logStep(
    'Step 12',
    'CREATE (POST /api/bills)',
    'Composite Hospital Bill (Composite)',
    async () => {
      const res = await fetch(`${API_BASE}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });
      return await res.json();
    },
    async (res) => {
      return await BillModel.findOne({ id: res.id });
    }
  );

  // STEP 13: SUBMIT INSURANCE CLAIM (Chain of Responsibility Pattern)
  await logStep(
    'Step 13',
    'UPDATE (POST /api/bills/:id/claim)',
    'Insurance Claim Adjudication (Chain of Responsibility)',
    async () => {
      const claimPayload = {
        insuranceProvider: 'BlueCross Health Assurance Corp',
        policyNumber: 'BC-ACS-992144-H9'
      };
      const res = await fetch(`${API_BASE}/bills/${createdBill.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimPayload)
      });
      return await res.json();
    },
    async (res) => {
      const doc = await BillModel.findOne({ id: res.id });
      return doc && doc.insuranceClaim && doc.insuranceClaim.status === 'APPROVED' ? doc : null;
    }
  );

  // STEP 14: RECORD PAYMENT TRANSACTION
  await logStep(
    'Step 14',
    'UPDATE (POST /api/bills/:id/pay)',
    'Payment Transaction Settlement',
    async () => {
      const payPayload = {
        amount: 250,
        paymentMethod: 'CARD'
      };
      const res = await fetch(`${API_BASE}/bills/${createdBill.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payPayload)
      });
      return await res.json();
    },
    async (res) => {
      const doc = await BillModel.findOne({ id: res.id });
      return doc && doc.payments && doc.payments.length > 0 ? doc : null;
    }
  );

  // STEP 15: RUN AI CLINICAL ACUITY ANALYSIS (AI Decision Support -> Stored in Mongo)
  await logStep(
    'Step 15',
    'CREATE & PERSIST (POST /api/ai/analyze/patient/:id)',
    'AI Clinical Acuity Synthesizer (MongoDB ai_analyses)',
    async () => {
      const res = await fetch(`${API_BASE}/ai/analyze/patient/${patientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyzedBy: 'Dr. Robert Vance, MD' })
      });
      return await res.json();
    },
    async (res) => {
      return await AiAnalysisModel.findOne({ targetId: patientId });
    }
  );

  // STEP 16: RUN AI CLAIM DENIAL RISK AUDIT (Stored in Mongo)
  await logStep(
    'Step 16',
    'CREATE & PERSIST (POST /api/ai/analyze/bill/:id)',
    'AI Claim Denial Pre-Audit (MongoDB ai_analyses)',
    async () => {
      const res = await fetch(`${API_BASE}/ai/analyze/bill/${createdBill.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyzedBy: 'Marcus Holloway' })
      });
      return await res.json();
    },
    async (res) => {
      return await AiAnalysisModel.findOne({ targetId: createdBill.id });
    }
  );

  // STEP 17: RUN AI HOSPITAL OPERATIONAL FORECAST (Stored in Mongo)
  await logStep(
    'Step 17',
    'CREATE & PERSIST (GET /api/ai/analyze/operations)',
    'AI Operational Load Synthesizer (MongoDB ai_analyses)',
    async () => {
      const res = await fetch(`${API_BASE}/ai/analyze/operations`);
      return await res.json();
    },
    async (res) => {
      return await AiAnalysisModel.findOne({ targetType: 'HOSPITAL', id: res.id });
    }
  );

  // Print Summary Table
  console.log('\n========================================================================');
  console.log('📊 MONGODB ATLAS CLUSTER PERSISTENCE VERIFICATION AUDIT REPORT');
  console.log('========================================================================\n');
  console.table(results.map(r => ({
    Step: r.step,
    Entity: r.entity,
    Operation: r.operation,
    Status: r.status,
    MongoAtlasVerified: r.verifiedInMongo ? '✅ YES' : '❌ NO',
    DocId: r.mongoDocId
  })));

  const allPassed = results.every(r => r.status === 'SUCCESS');
  if (allPassed) {
    console.log('\n🎉 ALL 17 CRUD OPERATIONS VERIFIED AS 100% PERSISTENT IN MONGODB ATLAS!');
  } else {
    console.log('\n⚠️ Some operations failed verification. Review table above.');
  }

  await mongoose.disconnect();
  console.log('[Mongo Verifier] Disconnected cleanly.');
  process.exit(allPassed ? 0 : 1);
}

runMongoCrudVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
