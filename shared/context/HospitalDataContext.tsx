import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Patient, Doctor, Appointment, Admission, LabOrder, Prescription,
  TreatmentPlan, Bill, VitalsRecord, ClinicalRule, CareEvent, AuditLog,
  HospitalConfigData
} from '../types';
import { api } from '../services/api';
import { PatientFactoryProvider, PatientInput } from '../patterns/creational/FactoryMethod';
import { AdmissionBuilder } from '../patterns/creational/Builder';
import { STANDARD_TREATMENT_PROTOTYPES } from '../patterns/creational/Prototype';
import { LabAdapterFactory } from '../patterns/structural/Adapter';
import { BloodTestRequest, XRayRequest, MRIRequest, InternalDiagnosticProvider, ExternalDiagnosticProvider, RadiologyCenterProvider } from '../patterns/structural/Bridge';
import { CompositeBillCalculator } from '../patterns/structural/Composite';
import { BasicPrescription, DosageDecorator, TimingDecorator, WarningDecorator } from '../patterns/structural/Decorator';
import { MedicationFlyweightFactory } from '../patterns/structural/Flyweight';
import { SecurePatientRecordProxy, RealPatientRecordService } from '../patterns/structural/Proxy';
import { InsuranceClaimPipeline } from '../patterns/behavioral/ChainOfResponsibility';
import { BookAppointmentCommand, RescheduleAppointmentCommand, CancelAppointmentCommand, globalAppointmentInvoker } from '../patterns/behavioral/Command';
import { ClinicalRuleParser } from '../patterns/behavioral/Interpreter';
import { MedicalHistoryIterator } from '../patterns/behavioral/Iterator';
import { HospitalCareMediator } from '../patterns/behavioral/Mediator';
import { TreatmentPlanOriginator, TreatmentPlanHistory } from '../patterns/behavioral/Memento';
import { globalEventBus } from '../patterns/behavioral/Observer';
import { AppointmentContext } from '../patterns/behavioral/State';
import { SchedulingStrategyContext, LeastBusyStrategy, FirstAvailableStrategy, ManualSchedulingStrategy } from '../patterns/behavioral/Strategy';
import { PatientReportGenerator, BillingReportGenerator, LaboratoryReportGenerator, OfficialHospitalReport } from '../patterns/behavioral/TemplateMethod';
import { AnalyticsVisitor, ClinicalRiskVisitor } from '../patterns/behavioral/Visitor';
import { HospitalConfig } from '../patterns/creational/Singleton';
import { useAuth } from './AuthContext';

interface HospitalDataContextValue {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  admissions: Admission[];
  labOrders: LabOrder[];
  prescriptions: Prescription[];
  treatmentPlans: TreatmentPlan[];
  bills: Bill[];
  vitalsRecords: VitalsRecord[];
  clinicalRules: ClinicalRule[];
  careEvents: CareEvent[];
  auditLogs: AuditLog[];
  config: HospitalConfigData | null;
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // Pattern-Driven Action Handlers
  registerPatient: (input: PatientInput, type: 'REGULAR' | 'EMERGENCY' | 'REFERRED') => Promise<Patient>;
  bookAppointment: (data: any, strategyType: 'MANUAL' | 'FIRST_AVAILABLE' | 'LEAST_BUSY') => Promise<Appointment>;
  undoLastAppointmentCommand: () => Promise<void>;
  advanceAppointmentState: (appointmentId: string, nextState: 'CHECKED_IN' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED') => Promise<Appointment>;
  createInpatientAdmission: (builder: (b: AdmissionBuilder) => AdmissionBuilder) => Promise<Admission>;
  dischargePatient: (admissionId: string) => Promise<Admission>;
  cloneTreatmentPlanPrototype: (templateId: string, patientId: string, patientName: string, doctorId: string, doctorName: string) => Promise<TreatmentPlan>;
  saveTreatmentPlanVersion: (planId: string, updates: any, note: string) => Promise<TreatmentPlan>;
  restoreTreatmentPlanVersion: (planId: string, targetVersion: number) => Promise<TreatmentPlan>;
  orderDiagnosticTest: (orderData: Partial<LabOrder>) => Promise<LabOrder>;
  completeLabOrderResults: (orderId: string, results: any, isCritical: boolean, notes: string) => Promise<LabOrder>;
  createPrescriptionWithDecorators: (patientId: string, patientName: string, doctorId: string, doctorName: string, drugId: string, dosage: string, frequency: string, timing: string, warning?: string) => Promise<Prescription>;
  dispensePrescription: (prescriptionId: string) => Promise<Prescription>;
  generateCompositeBill: (patientId: string, patientName: string, groupsData: any[]) => Promise<Bill>;
  processInsuranceClaim: (billId: string, provider: string, policyNumber: string) => Promise<Bill>;
  recordPayment: (billId: string, amount: number, method: 'CASH' | 'CARD' | 'INSURANCE' | 'UPI') => Promise<Bill>;
  recordPatientVitals: (data: any) => Promise<VitalsRecord>;
  dispatchCareEvent: (patientId: string, patientName: string, targetDept: string, eventType: any, urgency: any, message: string) => Promise<CareEvent>;
  resolveCareEvent: (eventId: string) => Promise<void>;
  getSecurePatientRecord: (patientId: string) => Promise<Patient>;
  getPatientTimelineIterator: (patient: Patient) => MedicalHistoryIterator;
  runAnalyticsVisitor: () => { summary: Record<string, any>; highRisk: any[] };
  generateHospitalReport: (type: 'PATIENT' | 'BILLING' | 'LABORATORY', context: any) => OfficialHospitalReport;
  updateHospitalConfig: (partial: Partial<HospitalConfigData>) => Promise<HospitalConfigData>;
  resetDatabase: () => Promise<void>;
}

const HospitalDataContext = createContext<HospitalDataContextValue | undefined>(undefined);

export const HospitalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [vitalsRecords, setVitalsRecords] = useState<VitalsRecord[]>([]);
  const [clinicalRules, setClinicalRules] = useState<ClinicalRule[]>([]);
  const [careEvents, setCareEvents] = useState<CareEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [config, setConfig] = useState<HospitalConfigData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshData = useCallback(async () => {
    try {
      const [
        pats, docs, apts, adms, labs, rxs, plans, bls, vits, rules, cares, logs, cfg
      ] = await Promise.all([
        api.getPatients(),
        api.getDoctors(),
        api.getAppointments(),
        api.getAdmissions(),
        api.getLabOrders(),
        api.getPrescriptions(),
        api.getTreatmentPlans(),
        api.getBills(),
        api.getVitals(),
        api.getClinicalRules(),
        api.getCareEvents(),
        api.getAuditLogs(),
        api.getConfig()
      ]);

      setPatients(pats);
      setDoctors(docs);
      setAppointments(apts);
      setAdmissions(adms);
      setLabOrders(labs);
      setPrescriptions(rxs);
      setTreatmentPlans(plans);
      setBills(bls);
      setVitalsRecords(vits);
      setClinicalRules(rules);
      setCareEvents(cares);
      setAuditLogs(logs);
      setConfig(cfg);
    } catch (err) {
      console.error('[HospitalDataProvider] Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    // Poll updates every 15 seconds to keep cross-persona tabs in sync
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // 1. PATIENT INTAKE (Factory Method Pattern)
  const registerPatient = async (input: PatientInput, type: 'REGULAR' | 'EMERGENCY' | 'REFERRED'): Promise<Patient> => {
    const creator = PatientFactoryProvider.getCreator(type);
    const draft = creator.register(input);
    const newPatient = await api.createPatient({ ...draft, actorName: currentUser?.name });

    // Trigger Observer Event
    globalEventBus.notify({
      id: `evt_${Date.now()}`,
      type: 'PATIENT_ADMITTED',
      sourceModule: 'Patient Intake',
      actorName: currentUser?.name || 'Receptionist',
      patientName: newPatient.name,
      timestamp: new Date().toISOString(),
      payload: { patientId: newPatient.id, priority: newPatient.priority }
    });

    await refreshData();
    return newPatient;
  };

  // 2. APPOINTMENT BOOKING (Strategy + Command Patterns)
  const bookAppointment = async (data: any, strategyType: 'MANUAL' | 'FIRST_AVAILABLE' | 'LEAST_BUSY'): Promise<Appointment> => {
    let strategy = new LeastBusyStrategy();
    if (strategyType === 'FIRST_AVAILABLE') strategy = new FirstAvailableStrategy();
    if (strategyType === 'MANUAL') strategy = new ManualSchedulingStrategy();

    const strategyContext = new SchedulingStrategyContext(strategy);
    const selectedDoctor = strategyContext.executeStrategy(doctors, data.department, data.doctorId);

    const payload = {
      ...data,
      doctorId: selectedDoctor?.id || data.doctorId,
      doctorName: selectedDoctor?.name || data.doctorName,
      schedulingStrategyUsed: strategyType,
      actorName: currentUser?.name
    };

    const command = new BookAppointmentCommand(payload);
    const appointment = await globalAppointmentInvoker.executeCommand<Appointment>(command);

    globalEventBus.notify({
      id: `evt_${Date.now()}`,
      type: 'APPOINTMENT_CREATED',
      sourceModule: 'Appointments',
      actorName: currentUser?.name || 'Receptionist',
      patientName: appointment.patientName,
      timestamp: new Date().toISOString(),
      payload: { appointmentId: appointment.id, doctor: appointment.doctorName }
    });

    await refreshData();
    return appointment;
  };

  const undoLastAppointmentCommand = async () => {
    await globalAppointmentInvoker.undoLastCommand();
    await refreshData();
  };

  // 3. APPOINTMENT STATE TRANSITIONS (State Pattern)
  const advanceAppointmentState = async (appointmentId: string, nextState: 'CHECKED_IN' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED'): Promise<Appointment> => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) throw new Error('Appointment not found.');

    const context = new AppointmentContext(apt.id, apt.patientName, apt.status);

    if (nextState === 'CHECKED_IN') context.checkIn();
    else if (nextState === 'IN_CONSULTATION') context.startConsultation();
    else if (nextState === 'COMPLETED') context.complete();
    else if (nextState === 'CANCELLED') context.cancel('User requested cancellation');

    const updated = await api.updateAppointmentStatus(appointmentId, nextState, currentUser?.name);

    globalEventBus.notify({
      id: `evt_${Date.now()}`,
      type: 'APPOINTMENT_STATE_CHANGED',
      sourceModule: 'Appointments',
      actorName: currentUser?.name || 'Staff',
      patientName: apt.patientName,
      timestamp: new Date().toISOString(),
      payload: { appointmentId, fromState: apt.status, toState: nextState }
    });

    await refreshData();
    return updated;
  };

  // 4. INPATIENT ADMISSION (Builder Pattern)
  const createInpatientAdmission = async (builderCallback: (b: AdmissionBuilder) => AdmissionBuilder): Promise<Admission> => {
    const builder = new AdmissionBuilder();
    const configuredBuilder = builderCallback(builder);
    const builtAdmission = configuredBuilder.build();

    const created = await api.createAdmission({
      ...builtAdmission,
      actorName: currentUser?.name
    });

    globalEventBus.notify({
      id: `evt_${Date.now()}`,
      type: 'PATIENT_ADMITTED',
      sourceModule: 'Admissions',
      actorName: currentUser?.name || 'Doctor',
      patientName: created.patientName,
      timestamp: new Date().toISOString(),
      payload: { admissionId: created.id, ward: created.ward, room: created.room }
    });

    await refreshData();
    return created;
  };

  const dischargePatient = async (admissionId: string): Promise<Admission> => {
    const updated = await api.updateAdmission(admissionId, {
      status: 'DISCHARGED',
      dischargeDate: new Date().toISOString()
    });

    globalEventBus.notify({
      id: `evt_${Date.now()}`,
      type: 'PATIENT_DISCHARGED',
      sourceModule: 'Admissions',
      actorName: currentUser?.name || 'Doctor',
      patientName: updated.patientName,
      timestamp: new Date().toISOString(),
      payload: { admissionId }
    });

    await refreshData();
    return updated;
  };

  // 5. TREATMENT PLAN CLONING & MEMENTO (Prototype + Memento Patterns)
  const cloneTreatmentPlanPrototype = async (templateId: string, patientId: string, patientName: string, doctorId: string, doctorName: string): Promise<TreatmentPlan> => {
    const proto = STANDARD_TREATMENT_PROTOTYPES.find(p => p.templateId === templateId) || STANDARD_TREATMENT_PROTOTYPES[0];
    const cloned = proto.clone();

    const created = await api.createTreatmentPlan({
      ...cloned,
      patientId,
      patientName,
      doctorId,
      doctorName,
      initialVersionNote: `Cloned from ${proto.name} Prototype`,
      actorName: currentUser?.name
    });

    await refreshData();
    return created;
  };

  const saveTreatmentPlanVersion = async (planId: string, updates: any, note: string): Promise<TreatmentPlan> => {
    const plan = treatmentPlans.find(tp => tp.id === planId);
    if (!plan) throw new Error('Treatment plan not found.');

    const originator = new TreatmentPlanOriginator(plan);
    originator.updateState(updates);
    originator.saveToMemento(note);

    const saved = await api.saveTreatmentPlanVersion(planId, {
      ...updates,
      note,
      actorName: currentUser?.name
    });

    await refreshData();
    return saved;
  };

  const restoreTreatmentPlanVersion = async (planId: string, targetVersion: number): Promise<TreatmentPlan> => {
    const restored = await api.restoreTreatmentPlanVersion(planId, targetVersion, currentUser?.name);
    await refreshData();
    return restored;
  };

  // 6. DIAGNOSTIC LAB ORDERS (Abstract Factory + Bridge + Adapter Patterns)
  const orderDiagnosticTest = async (orderData: Partial<LabOrder>): Promise<LabOrder> => {
    // 1. Adapter translates provider
    const provider = orderData.provider || 'INTERNAL';
    const adapter = LabAdapterFactory.getAdapter(provider);

    // 2. Bridge couples test request modality with provider
    let bridgeProvider = new InternalDiagnosticProvider();
    if (provider === 'EXTERNAL') bridgeProvider = new ExternalDiagnosticProvider();
    if (provider === 'RADIOLOGY_CENTER') bridgeProvider = new RadiologyCenterProvider();

    let request = new BloodTestRequest(bridgeProvider);
    if (orderData.category === 'RADIOLOGY') request = new XRayRequest(bridgeProvider);

    const createdOrder = await api.createLabOrder({
      ...orderData,
      actorName: currentUser?.name
    });

    // Execute adapter submit
    await adapter.submitOrder(createdOrder);
    await request.processRequest(createdOrder);

    await refreshData();
    return createdOrder;
  };

  const completeLabOrderResults = async (orderId: string, results: any, isCritical: boolean, notes: string): Promise<LabOrder> => {
    const completed = await api.completeLabResults(orderId, {
      results,
      isCritical,
      technicianNotes: notes,
      actorName: currentUser?.name
    });

    // Broadcast Observer notification
    globalEventBus.notify({
      id: `evt_${Date.now()}`,
      type: 'LAB_RESULT_READY',
      sourceModule: 'Diagnostics',
      actorName: currentUser?.name || 'Lab Technician',
      patientName: completed.patientName,
      timestamp: new Date().toISOString(),
      payload: { orderId: completed.id, testName: completed.testName, isCritical }
    });

    await refreshData();
    return completed;
  };

  // 7. PRESCRIPTIONS (Flyweight + Decorator Patterns)
  const createPrescriptionWithDecorators = async (
    patientId: string,
    patientName: string,
    doctorId: string,
    doctorName: string,
    drugId: string,
    dosage: string,
    frequency: string,
    timing: string,
    warning?: string
  ): Promise<Prescription> => {
    // 1. Flyweight retrieves shared metadata
    const metadata = MedicationFlyweightFactory.getMedication(drugId);

    // 2. Decorator layers instruction modifiers
    const base = new BasicPrescription(metadata.tradeName, `Take ${metadata.tradeName} as directed`);
    const withDosage = new DosageDecorator(base, dosage);
    const withTiming = new TimingDecorator(withDosage, frequency, timing);
    const decorated = warning ? new WarningDecorator(withTiming, warning) : withTiming;

    const item = {
      medicationId: metadata.id,
      medicationName: metadata.tradeName,
      genericName: metadata.genericName,
      dosage,
      frequency,
      duration: '30 Days',
      instructions: decorated.getInstructions(),
      warnings: decorated.getWarnings().concat(metadata.standardWarnings),
      dispensed: false
    };

    const created = await api.createPrescription({
      patientId,
      patientName,
      doctorId,
      doctorName,
      items: [item],
      actorName: currentUser?.name
    });

    globalEventBus.notify({
      id: `evt_${Date.now()}`,
      type: 'PRESCRIPTION_CREATED',
      sourceModule: 'Pharmacy',
      actorName: currentUser?.name || 'Doctor',
      patientName,
      timestamp: new Date().toISOString(),
      payload: { prescriptionId: created.id, drug: metadata.tradeName }
    });

    await refreshData();
    return created;
  };

  const dispensePrescription = async (prescriptionId: string): Promise<Prescription> => {
    const rx = await api.dispensePrescription(prescriptionId, currentUser?.name);
    await refreshData();
    return rx;
  };

  // 8. BILLING & INSURANCE (Composite + Chain of Responsibility Patterns)
  const generateCompositeBill = async (patientId: string, patientName: string, groupsData: any[]): Promise<Bill> => {
    const { subtotal, tax, total } = CompositeBillCalculator.buildInvoiceTree(groupsData);

    const created = await api.createBill({
      patientId,
      patientName,
      groups: groupsData,
      subtotal,
      tax,
      total,
      actorName: currentUser?.name
    });

    await refreshData();
    return created;
  };

  const processInsuranceClaim = async (billId: string, provider: string, policyNumber: string): Promise<Bill> => {
    const targetBill = bills.find(b => b.id === billId);
    if (!targetBill) throw new Error('Bill not found.');

    // Execute Chain of Responsibility pipeline
    InsuranceClaimPipeline.processClaim({
      bill: targetBill,
      insuranceProvider: provider,
      policyNumber,
      medicalDocumentationIncluded: true
    });

    const updated = await api.submitInsuranceClaim(billId, {
      provider,
      policyNumber,
      actorName: currentUser?.name
    });

    if (updated.insuranceClaim?.status === 'APPROVED') {
      globalEventBus.notify({
        id: `evt_${Date.now()}`,
        type: 'CLAIM_APPROVED',
        sourceModule: 'Insurance',
        actorName: currentUser?.name || 'Billing Officer',
        patientName: updated.patientName,
        timestamp: new Date().toISOString(),
        payload: { claimId: updated.insuranceClaim.claimId, approvedAmount: updated.insuranceClaim.approvedAmount }
      });
    }

    await refreshData();
    return updated;
  };

  const recordPayment = async (billId: string, amount: number, method: 'CASH' | 'CARD' | 'INSURANCE' | 'UPI'): Promise<Bill> => {
    const updated = await api.recordPayment(billId, { amount, method, actorName: currentUser?.name });
    await refreshData();
    return updated;
  };

  // 9. VITALS & CLINICAL RULES (Interpreter + Care Mediator Patterns)
  const recordPatientVitals = async (data: any): Promise<VitalsRecord> => {
    const record = await api.recordVitals({ ...data, recordedBy: currentUser?.name });

    if (record.alertsGenerated && record.alertsGenerated.length > 0) {
      globalEventBus.notify({
        id: `evt_${Date.now()}`,
        type: 'CRITICAL_VITALS_ALERT',
        sourceModule: 'Clinical Rule Engine',
        actorName: currentUser?.name || 'Nurse',
        patientName: record.patientName,
        timestamp: new Date().toISOString(),
        payload: { alerts: record.alertsGenerated }
      });
    }

    await refreshData();
    return record;
  };

  // 10. CARE COORDINATION (Mediator Pattern)
  const dispatchCareEvent = async (
    patientId: string,
    patientName: string,
    targetDept: string,
    eventType: any,
    urgency: any,
    message: string
  ): Promise<CareEvent> => {
    const mediator = HospitalCareMediator.getInstance();
    const event = await mediator.dispatchCareRequest(
      {
        getName: () => currentUser?.name || 'Clinical Staff',
        getRole: () => currentUser?.role || 'Staff',
        receiveCareRequest: () => {}
      },
      targetDept,
      eventType,
      urgency,
      patientId,
      patientName,
      message
    );

    await refreshData();
    return event;
  };

  const resolveCareEvent = async (eventId: string): Promise<void> => {
    await api.updateCareEventStatus(eventId, 'RESOLVED');
    await refreshData();
  };

  // 11. SECURE RECORD ACCESS (Proxy Pattern)
  const getSecurePatientRecord = async (patientId: string): Promise<Patient> => {
    const realService = new RealPatientRecordService();
    const proxy = new SecurePatientRecordProxy(
      realService,
      currentUser?.role || 'receptionist',
      currentUser?.name || 'Anonymous'
    );
    return await proxy.getPatientRecord(patientId);
  };

  // 12. MEDICAL TIMELINE (Iterator Pattern)
  const getPatientTimelineIterator = (patient: Patient): MedicalHistoryIterator => {
    return new MedicalHistoryIterator(patient);
  };

  // 13. HOSPITAL ANALYTICS (Visitor Pattern)
  const runAnalyticsVisitor = () => {
    const analyticsVisitor = new AnalyticsVisitor();
    const riskVisitor = new ClinicalRiskVisitor();

    patients.forEach(p => {
      analyticsVisitor.visitPatient(p);
      riskVisitor.visitPatient(p);
    });

    admissions.forEach(a => {
      analyticsVisitor.visitAdmission(a);
      riskVisitor.visitAdmission(a);
    });

    labOrders.forEach(l => {
      analyticsVisitor.visitLabOrder(l);
      riskVisitor.visitLabOrder(l);
    });

    prescriptions.forEach(rx => {
      analyticsVisitor.visitPrescription(rx);
      riskVisitor.visitPrescription();
    });

    return {
      summary: analyticsVisitor.getMetricsSummary(),
      highRisk: riskVisitor.getResults()
    };
  };

  // 14. REPORT GENERATION (Template Method Pattern)
  const generateHospitalReport = (type: 'PATIENT' | 'BILLING' | 'LABORATORY', context: any): OfficialHospitalReport => {
    let generator;
    if (type === 'BILLING') generator = new BillingReportGenerator();
    else if (type === 'LABORATORY') generator = new LaboratoryReportGenerator();
    else generator = new PatientReportGenerator();

    return generator.generate(context);
  };

  // 15. CONFIG UPDATE (Singleton Pattern)
  const updateHospitalConfig = async (partial: Partial<HospitalConfigData>): Promise<HospitalConfigData> => {
    const singleton = HospitalConfig.getInstance();
    singleton.updateConfig(partial);
    const updated = await api.updateConfig(partial);
    setConfig(updated);
    return updated;
  };

  const resetDatabase = async () => {
    await api.resetData();
    await refreshData();
  };

  return (
    <HospitalDataContext.Provider
      value={{
        patients,
        doctors,
        appointments,
        admissions,
        labOrders,
        prescriptions,
        treatmentPlans,
        bills,
        vitalsRecords,
        clinicalRules,
        careEvents,
        auditLogs,
        config,
        isLoading,
        refreshData,
        registerPatient,
        bookAppointment,
        undoLastAppointmentCommand,
        advanceAppointmentState,
        createInpatientAdmission,
        dischargePatient,
        cloneTreatmentPlanPrototype,
        saveTreatmentPlanVersion,
        restoreTreatmentPlanVersion,
        orderDiagnosticTest,
        completeLabOrderResults,
        createPrescriptionWithDecorators,
        dispensePrescription,
        generateCompositeBill,
        processInsuranceClaim,
        recordPayment,
        recordPatientVitals,
        dispatchCareEvent,
        resolveCareEvent,
        getSecurePatientRecord,
        getPatientTimelineIterator,
        runAnalyticsVisitor,
        generateHospitalReport,
        updateHospitalConfig,
        resetDatabase
      }}
    >
      {children}
    </HospitalDataContext.Provider>
  );
};

export const useHospitalData = () => {
  const context = useContext(HospitalDataContext);
  if (!context) {
    throw new Error('useHospitalData must be used within a HospitalDataProvider');
  }
  return context;
};
