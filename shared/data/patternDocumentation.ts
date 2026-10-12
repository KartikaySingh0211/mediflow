import { PatternDocumentation } from '../pattern-tracing/types';

export const PATTERN_DOCUMENTATION: PatternDocumentation[] = [
  // ================= CREATIONAL PATTERNS (5) =================
  {
    id: 'singleton',
    name: 'Singleton Pattern',
    category: 'Creational',
    module: 'Authentication & System Configuration',
    problem: 'Hospital-wide configuration (operational policies, working hours, license credentials, bed allocations) is a shared global resource. Multiple independent config managers lead to state divergence and race conditions.',
    solution: 'Encapsulates global hospital configuration within a single private constructor instance, exposed strictly through static getInstance() with lazy initialization and trace telemetry.',
    advantages: [
      'Guarantees strict single-instance access across all clinical modules',
      'Centralizes system policies and operational hours',
      'Eliminates duplicate memory allocation for hospital constants',
      'Provides controlled global access point'
    ],
    filePath: 'src/patterns/creational/Singleton.ts',
    trigger: 'Application Boot / System Settings Update',
    participants: ['HospitalConfig', 'SystemSettingsView', 'PatternTraceService'],
    executionFlow: [
      '1. Client calls HospitalConfig.getInstance()',
      '2. Singleton checks if internal instance exists',
      '3. If null, instantiates new HospitalConfig and emits trace telemetry',
      '4. Returns identical instance to caller'
    ],
    codeExample: `export class HospitalConfig {
  private static instance: HospitalConfig;
  private configData: HospitalConfigData;

  private constructor() {
    this.configData = { hospitalName: "MediFlow Metro Medical", workingHours: "24/7" };
  }

  static getInstance(): HospitalConfig {
    if (!HospitalConfig.instance) {
      HospitalConfig.instance = new HospitalConfig();
      PatternTraceService.emit({
        pattern: "Singleton",
        category: "Creational",
        module: "System Configuration",
        step: 1,
        message: "Instantiated HospitalConfig Singleton instance"
      });
    }
    return HospitalConfig.instance;
  }
}`
  },
  {
    id: 'factory-method',
    name: 'Factory Method Pattern',
    category: 'Creational',
    module: 'Patient Management',
    problem: 'Patients enter MediFlow through divergent intake channels (Regular Outpatient, Emergency Trauma, Specialist Referral), each requiring distinct default priorities, triage flags, and validation rules.',
    solution: 'Defines an abstract PatientCreator with specialized subclasses (RegularPatientCreator, EmergencyPatientCreator, ReferredPatientCreator) delegating patient draft instantiation.',
    advantages: [
      'Decouples patient intake UI from concrete patient object construction',
      'Encapsulates domain-specific priority defaults (e.g. CRITICAL for emergency)',
      'Adheres to Open/Closed Principle for onboarding new patient intake types'
    ],
    filePath: 'src/patterns/creational/FactoryMethod.ts',
    trigger: 'Register Patient Button',
    participants: ['PatientCreator (Abstract)', 'RegularPatientCreator', 'EmergencyPatientCreator', 'ReferredPatientCreator', 'Patient'],
    executionFlow: [
      '1. Receptionist selects registration type in Patient Registration modal',
      '2. Application resolves corresponding PatientCreator implementation',
      '3. Creator executes createPatient(input), applying clinical defaults',
      '4. Returns typed Patient draft and emits step trace'
    ],
    codeExample: `export abstract class PatientCreator {
  abstract createPatient(data: Partial<Patient>): Patient;
}

export class EmergencyPatientCreator extends PatientCreator {
  createPatient(data: Partial<Patient>): Patient {
    PatternTraceService.emit({
      pattern: "Factory Method",
      category: "Creational",
      module: "Patient Management",
      step: 1,
      message: "EmergencyPatientCreator instantiated CRITICAL triage patient"
    });
    return {
      ...data,
      registrationType: "EMERGENCY",
      priority: "CRITICAL",
      status: "IN_CONSULTATION"
    } as Patient;
  }
}`
  },
  {
    id: 'abstract-factory',
    name: 'Abstract Factory Pattern',
    category: 'Creational',
    module: 'Laboratory & Diagnostics',
    problem: 'Hospital diagnostics interact with multiple provider environments (Internal Laboratory, External Pathology Lab, Advanced Radiology Center), each requiring a cohesive family of compatible order processors and result formatters.',
    solution: 'DiagnosticFactory interface declares methods for creating families of related products (DiagnosticProcessor, DiagnosticResultFormatter). Concrete factories instantiate provider-specific families.',
    advantages: [
      'Ensures processors and formatters from the same provider work together seamlessly',
      'Isolates concrete diagnostic provider classes from clinical ordering UI',
      'Enables effortless switching between in-house and third-party laboratory partners'
    ],
    filePath: 'src/patterns/creational/AbstractFactory.ts',
    trigger: 'Doctor Creates Diagnostic Lab Order',
    participants: ['DiagnosticFactory', 'InternalLabFactory', 'ExternalLabFactory', 'RadiologyFactory', 'DiagnosticProcessor', 'DiagnosticResultFormatter'],
    executionFlow: [
      '1. Attending physician chooses diagnostic provider tier',
      '2. Abstract Factory selects concrete provider factory (e.g. RadiologyFactory)',
      '3. Factory produces corresponding DiagnosticProcessor and ResultFormatter',
      '4. Diagnostic order is processed through the unified provider family'
    ],
    codeExample: `export interface DiagnosticFactory {
  createProcessor(): DiagnosticProcessor;
  createFormatter(): DiagnosticResultFormatter;
}

export class RadiologyFactory implements DiagnosticFactory {
  createProcessor(): DiagnosticProcessor {
    return new RadiologyProcessor();
  }
  createFormatter(): DiagnosticResultFormatter {
    return new DICOMRadiologyFormatter();
  }
}`
  },
  {
    id: 'builder',
    name: 'Builder Pattern',
    category: 'Creational',
    module: 'Patient Admission & Inpatient Management',
    problem: 'Patient Inpatient Admission is a complex composite entity requiring multiple optional and mandatory steps: patient linking, physician assignment, department routing, ward allocation, bed reservation, priority scoring, and clinical notes.',
    solution: 'AdmissionBuilder constructs an Admission step-by-step using fluent method chaining, supporting validation at each stage before producing the final Admission object.',
    advantages: [
      'Eliminates sprawling constructor parameter lists ("telescoping constructor")',
      'Enables fine-grained, step-by-step construction of complex hospital admissions',
      'Supports draft admissions and partial data assembly across multiple clinical screens'
    ],
    filePath: 'src/patterns/creational/Builder.ts',
    trigger: 'Doctor Admits Patient to Inpatient Ward',
    participants: ['AdmissionBuilder', 'Admission', 'DoctorDashboard'],
    executionFlow: [
      '1. Doctor opens Inpatient Admission modal',
      '2. AdmissionBuilder is initialized and chained with setPatient(), assignDoctor(), assignDepartment(), assignRoom(), assignBed()',
      '3. Builder validates bed availability and clinical priority',
      '4. build() produces immutable Admission and triggers trace'
    ],
    codeExample: `export class AdmissionBuilder {
  private admission: Partial<Admission> = {};

  setPatient(patientId: string, name: string): this {
    this.admission.patientId = patientId;
    this.admission.patientName = name;
    return this;
  }
  assignDoctor(doctorId: string, name: string): this {
    this.admission.doctorId = doctorId;
    this.admission.doctorName = name;
    return this;
  }
  assignBed(ward: string, room: string, bed: string): this {
    this.admission.ward = ward;
    this.admission.room = room;
    this.admission.bed = bed;
    return this;
  }
  build(): Admission {
    PatternTraceService.emit({
      pattern: "Builder",
      category: "Creational",
      module: "Admissions",
      step: 1,
      message: \`AdmissionBuilder constructed admission for \${this.admission.patientName}\`
    });
    return this.admission as Admission;
  }
}`
  },
  {
    id: 'prototype',
    name: 'Prototype Pattern',
    category: 'Creational',
    module: 'Treatment Plan Protocols',
    problem: 'Specialist treatment plans (e.g. Post-ACS Cardiac Protocol, Acute Stroke Care, Post-Op Surgical Recovery) share complex standardized baselines. Constructing each plan from scratch leads to human error and duplicate data entry.',
    solution: 'TreatmentPlanTemplate implements Prototype<TreatmentPlan>, enabling clinicians to deep-clone clinical protocol templates and customize medications and follow-ups without modifying base templates.',
    advantages: [
      'Rapidly spawns personalized patient treatment plans from standardized clinical prototypes',
      'Performs clean deep-cloning of nested medication and instruction arrays',
      'Reduces cognitive load and medical prescription error rates'
    ],
    filePath: 'src/patterns/creational/Prototype.ts',
    trigger: 'Doctor Clones Clinical Treatment Template',
    participants: ['Prototype<T>', 'TreatmentPlanTemplate', 'TreatmentPlan'],
    executionFlow: [
      '1. Physician browses hospital Standard Treatment Plan catalog',
      '2. Selects "Post-Acute Coronary Syndrome Protocol"',
      '3. Calls template.clone(), generating an independent deep copy',
      '4. Customizes dosages for patient and saves as active treatment plan'
    ],
    codeExample: `export interface Prototype<T> {
  clone(): T;
}

export class TreatmentPlanTemplate implements Prototype<TreatmentPlan> {
  constructor(public data: Omit<TreatmentPlan, 'id' | 'createdAt' | 'updatedAt' | 'versions'>) {}

  clone(): TreatmentPlan {
    PatternTraceService.emit({
      pattern: "Prototype",
      category: "Creational",
      module: "Treatment Plans",
      step: 1,
      message: \`Cloned treatment template: "\${this.data.name}"\`
    });
    return {
      ...this.data,
      id: \`tp_\${Date.now()}\`,
      medications: [...this.data.medications],
      instructions: [...this.data.instructions],
      versions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as TreatmentPlan;
  }
}`
  },

  // ================= STRUCTURAL PATTERNS (7) =================
  {
    id: 'adapter',
    name: 'Adapter Pattern',
    category: 'Structural',
    module: 'Laboratory Integration',
    problem: 'External pathology laboratories and DICOM radiology imaging services utilize non-standard API payloads (e.g. patient_identifier, requested_test_code) incompatible with MediFlow internal LabOrder interfaces.',
    solution: 'LabProviderAdapter interface normalizes disparate vendor schemas into standard submitOrder() and getResults() contracts via InternalLabAdapter, ExternalLabAdapter, and RadiologyAdapter.',
    advantages: [
      'Enables MediFlow to integrate external laboratories without modifying internal clinical models',
      'Encapsulates vendor-specific data transformation and parsing logic',
      'Enables plug-and-play integration for third-party diagnostics'
    ],
    filePath: 'src/patterns/structural/Adapter.ts',
    trigger: 'Laboratory Technician Processes Diagnostic Sample',
    participants: ['LabProviderAdapter', 'InternalLabAdapter', 'ExternalLabAdapter', 'RadiologyAdapter', 'LabOrder'],
    executionFlow: [
      '1. Lab Tech triggers order processing',
      '2. System routes order through ExternalLabAdapter',
      '3. Adapter transforms internal LabOrder schema to vendor payload',
      '4. Response is adapted back into standard MediFlow result object'
    ],
    codeExample: `export interface LabProviderAdapter {
  submitOrder(order: LabOrder): Promise<{ providerRef: string; status: string }>;
  formatResult(vendorPayload: any): LabOrder['results'];
}

export class ExternalLabAdapter implements LabProviderAdapter {
  async submitOrder(order: LabOrder) {
    PatternTraceService.emit({
      pattern: "Adapter",
      category: "Structural",
      module: "Diagnostics",
      step: 1,
      message: \`ExternalLabAdapter normalized order \${order.orderNumber} for Quest Diagnostics API\`
    });
    return { providerRef: \`EXT-\${order.orderNumber}\`, status: "PROCESSING" };
  }
}`
  },
  {
    id: 'bridge',
    name: 'Bridge Pattern',
    category: 'Structural',
    module: 'Diagnostic Requests & Providers',
    problem: 'Diagnostic requests (BloodTestRequest, XRayRequest, MRIRequest) and diagnostic execution providers (Internal Lab, External Lab, Radiology Center) vary along orthogonal dimensions. Direct subclassing would cause a combinatorial class explosion.',
    solution: 'Bridge decouples the DiagnosticRequest abstraction from the DiagnosticProvider implementor, allowing test types and providers to vary independently.',
    advantages: [
      'Prevents cartesian product of classes (3 test types × 3 providers = 9 classes avoided)',
      'Allows adding new diagnostic test modalities without touching provider code',
      'Allows switching providers dynamically at runtime based on urgency or equipment load'
    ],
    filePath: 'src/patterns/structural/Bridge.ts',
    trigger: 'Physician Configures Diagnostic Request & Provider',
    participants: ['DiagnosticRequest (Abstraction)', 'BloodTestRequest', 'XRayRequest', 'MRIRequest', 'DiagnosticProvider (Implementor)', 'InternalProvider', 'ExternalProvider'],
    executionFlow: [
      '1. Doctor selects test modality (e.g. MRIRequest)',
      '2. System assigns runtime provider implementor (e.g. RadiologyCenterProvider)',
      '3. Request delegates execution to provider via Bridge bridge interface',
      '4. Diagnostic order is scheduled cleanly'
    ],
    codeExample: `export abstract class DiagnosticRequest {
  constructor(protected provider: DiagnosticProvider) {}
  abstract execute(order: LabOrder): Promise<void>;
}

export class BloodTestRequest extends DiagnosticRequest {
  async execute(order: LabOrder) {
    PatternTraceService.emit({
      pattern: "Bridge",
      category: "Structural",
      module: "Diagnostics",
      step: 1,
      message: \`Bridge: BloodTestRequest bridged to \${this.provider.getName()}\`
    });
    await this.provider.processTest(order);
  }
}`
  },
  {
    id: 'composite',
    name: 'Composite Pattern',
    category: 'Structural',
    module: 'Hospital Billing & Invoicing',
    problem: 'Hospital invoices represent recursive tree hierarchies: individual line items (Consultations, Lab Tests, Medication doses, Room charges) grouped into departmental categories and multi-day itemized packages.',
    solution: 'BillComponent interface defines uniform getTotal() and getDescription() operations implemented by BillItem (leaf) and BillGroup (composite), enabling recursive cost calculation.',
    advantages: [
      'Treats individual clinical charges and grouped service packages uniformly',
      'Simplifies recursive price and tax calculations without complex conditionals',
      'Facilitates flexible hierarchical bill generation for insurance claims'
    ],
    filePath: 'src/patterns/structural/Composite.ts',
    trigger: 'Billing Officer Compiles Patient Invoice',
    participants: ['BillComponent', 'BillItem (Leaf)', 'BillGroup (Composite)', 'Bill'],
    executionFlow: [
      '1. Billing Officer initiates invoice generation for discharged patient',
      '2. BillGroup composites are created for Consultations, Lab, Ward, and Pharmacy',
      '3. Individual BillItem leaves are attached to each group',
      '4. Root composite calculates recursive total, tax, and itemized summary'
    ],
    codeExample: `export interface BillComponent {
  getTotal(): number;
  getDescription(): string;
}

export class BillGroup implements BillComponent {
  constructor(public name: string, private children: BillComponent[] = []) {}

  add(child: BillComponent) { this.children.push(child); }
  getTotal(): number {
    return this.children.reduce((acc, c) => acc + c.getTotal(), 0);
  }
  getDescription(): string {
    return \`\${this.name} (\${this.children.length} items): $\${this.getTotal().toFixed(2)}\`;
  }
}`
  },
  {
    id: 'decorator',
    name: 'Decorator Pattern',
    category: 'Structural',
    module: 'Prescription & Pharmacy Instructions',
    problem: 'Prescription directions require dynamic clinical caveats (precise dosages, timing protocols, food instructions, high-risk drug warnings). Creating static subclasses for every combination is unmanageable.',
    solution: 'PrescriptionDecorator wraps BasicPrescription to dynamically attach DosageDecorator, TimingDecorator, FoodInstructionDecorator, and WarningDecorator in customizable layers.',
    advantages: [
      'Dynamically enriches prescription instructions with specialized medical warnings',
      'Avoids combinatorial subclassing explosion for drug administration rules',
      'Keeps base prescription objects clean while allowing arbitrary clinical annotations'
    ],
    filePath: 'src/patterns/structural/Decorator.ts',
    trigger: 'Doctor Enriches Prescription with Warnings & Timing',
    participants: ['PrescriptionComponent', 'BasicPrescription', 'PrescriptionDecorator', 'DosageDecorator', 'TimingDecorator', 'WarningDecorator'],
    executionFlow: [
      '1. Doctor prescribes Atorvastatin Calcium',
      '2. BasicPrescription is instantiated',
      '3. DosageDecorator attaches "40 mg PO"',
      '4. TimingDecorator attaches "At bedtime"',
      '5. WarningDecorator attaches "Avoid grapefruit; report muscle pain immediately"',
      '6. Full decorated instruction list is delivered to pharmacy'
    ],
    codeExample: `export class WarningDecorator extends PrescriptionDecorator {
  constructor(component: PrescriptionComponent, private warning: string) {
    super(component);
  }

  getInstructions(): string[] {
    PatternTraceService.emit({
      pattern: "Decorator",
      category: "Structural",
      module: "Pharmacy",
      step: 1,
      message: \`WarningDecorator appended caution: "\${this.warning}"\`
    });
    return [...this.decorated.getInstructions(), \`⚠️ WARNING: \${this.warning}\`];
  }
}`
  },
  {
    id: 'facade',
    name: 'Facade Pattern',
    category: 'Structural',
    module: 'Authentication & Session Subsystems',
    problem: 'User login coordinates multiple disparate internal subsystems: credential verification, user profile fetching, role matrix lookup, department permission checks, session generation, and audit logging.',
    solution: 'AuthFacade exposes a single simplified login(email, role) interface that encapsulates and orchestrates all internal authentication and authorization services.',
    advantages: [
      'Shields UI components from complex subsystem orchestration',
      'Reduces coupling between front-end views and security services',
      'Provides a clean, unified authentication entry point'
    ],
    filePath: 'src/patterns/structural/Facade.ts',
    trigger: 'User Login / Persona Quick Switch',
    participants: ['AuthFacade', 'AuthService', 'ProfileService', 'RoleService', 'PermissionService', 'AuditService'],
    executionFlow: [
      '1. User clicks login with chosen persona',
      '2. UI calls AuthFacade.login(email, role)',
      '3. Facade verifies credentials -> loads profile -> assigns roles & permissions -> creates session -> writes audit log',
      '4. Returns unified session object'
    ],
    codeExample: `export class AuthFacade {
  static async login(email: string, role?: string) {
    PatternTraceService.emit({
      pattern: "Facade",
      category: "Structural",
      module: "Authentication",
      step: 1,
      message: \`AuthFacade coordinating auth, profile, role, and session for \${email}\`
    });
    const res = await api.login(email, role);
    return res;
  }
}`
  },
  {
    id: 'flyweight',
    name: 'Flyweight Pattern',
    category: 'Structural',
    module: 'Medication Catalog & Pharmacy',
    problem: 'Hospital prescriptions reference thousands of drug administrations daily. Storing duplicate drug metadata (chemical formula, generic name, manufacturer, contraindications) in every prescription item wastes significant memory.',
    solution: 'MedicationFlyweightFactory shares intrinsic immutable medication metadata (MedicationMetadata) across all extrinsic prescription instances (dosage, patient, frequency).',
    advantages: [
      'Drastically reduces memory footprint by sharing immutable drug monographs',
      'Separates intrinsic drug metadata from extrinsic patient-specific prescription parameters',
      'Ensures medication warnings and manufacturer details remain globally consistent'
    ],
    filePath: 'src/patterns/structural/Flyweight.ts',
    trigger: 'Pharmacist Inspects Prescription / Doctor Adds Drug',
    participants: ['MedicationMetadata (Flyweight)', 'MedicationFlyweightFactory', 'PrescriptionItem (Extrinsic Context)'],
    executionFlow: [
      '1. Doctor selects medication from formulary',
      '2. MedicationFlyweightFactory checks internal metadata pool',
      '3. Reuses cached MedicationMetadata flyweight instance',
      '4. Combines flyweight with patient-specific dosage and duration'
    ],
    codeExample: `export class MedicationFlyweightFactory {
  private static flyweights = new Map<string, MedicationMetadata>();

  static getMedication(id: string): MedicationMetadata {
    if (!this.flyweights.has(id)) {
      this.flyweights.set(id, { id, genericName: "Atorvastatin", manufacturer: "Pfizer", warnings: [] });
      PatternTraceService.emit({
        pattern: "Flyweight",
        category: "Structural",
        module: "Pharmacy",
        step: 1,
        message: \`Flyweight created new shared metadata for drug: \${id}\`
      });
    }
    return this.flyweights.get(id)!;
  }
}`
  },
  {
    id: 'proxy',
    name: 'Proxy Pattern',
    category: 'Structural',
    module: 'Patient Record Security & Access Control',
    problem: 'Patient electronic health records (EHR) contain sensitive medical data requiring strict HIPAA role-based authorization before granting access to clinical histories or diagnostic notes.',
    solution: 'SecurePatientRecordProxy intercepts record queries, validates the active user role and permission tokens, and only forwards authorized requests to RealPatientRecordService.',
    advantages: [
      'Enforces strict role-based access control (RBAC) at the service boundary',
      'Logs access attempts and denials automatically for medical compliance audits',
      'Transparent to calling UI components (implements identical PatientRecordService interface)'
    ],
    filePath: 'src/patterns/structural/Proxy.ts',
    trigger: 'User Clicks View Patient Record',
    participants: ['PatientRecordService', 'RealPatientRecordService', 'SecurePatientRecordProxy', 'AuthContext'],
    executionFlow: [
      '1. User attempts to view Patient Clinical Profile',
      '2. SecurePatientRecordProxy intercepts request',
      '3. Proxy checks if active role possesses "patient:clinical_read" permission',
      '4. If authorized, delegates to RealPatientRecordService; otherwise rejects with security audit'
    ],
    codeExample: `export class SecurePatientRecordProxy implements PatientRecordService {
  constructor(private realService: RealPatientRecordService, private userRole: string) {}

  async getPatientRecord(id: string): Promise<Patient> {
    if (this.userRole === 'billing_officer') {
      PatternTraceService.emit({
        pattern: "Proxy",
        category: "Structural",
        module: "Patient Records",
        step: 1,
        message: "Proxy redacted clinical notes: Billing Officer granted demographic/billing access only"
      });
    }
    return this.realService.getPatientRecord(id);
  }
}`
  },

  // ================= BEHAVIORAL PATTERNS (11) =================
  {
    id: 'chain-of-responsibility',
    name: 'Chain of Responsibility Pattern',
    category: 'Behavioral',
    module: 'Insurance Claim Processing',
    problem: 'Health insurance claims must pass through a rigorous multi-stage validation pipeline (Policy Validity -> Coverage Eligibility -> Incident Amount Limits -> Itemized Medical Documentation). Monolithic conditional checks are brittle and unmaintainable.',
    solution: 'ClaimHandler chain (PolicyValidator -> CoverageValidator -> AmountValidator -> DocumentValidator) processes claim requests sequentially, passing to the next handler or rejecting with specific diagnostic reasons.',
    advantages: [
      'Decouples claim sender from specific validation stage implementations',
      'Enables adding, removing, or reordering claim validation stages dynamically',
      'Provides granular step-by-step feedback for rejected insurance claims'
    ],
    filePath: 'src/patterns/behavioral/ChainOfResponsibility.ts',
    trigger: 'Billing Officer Submits Insurance Claim',
    participants: ['ClaimHandler', 'PolicyValidator', 'CoverageValidator', 'AmountValidator', 'DocumentValidator', 'Bill'],
    executionFlow: [
      '1. Billing Officer clicks "Submit Insurance Claim"',
      '2. PolicyValidator verifies active policy status with insurer',
      '3. CoverageValidator confirms inpatient procedure coverage tier',
      '4. AmountValidator checks annual policy claim ceiling',
      '5. DocumentValidator validates physician diagnosis and itemized bill',
      '6. Claim approved and payment authorized'
    ],
    codeExample: `export abstract class ClaimHandler {
  protected nextHandler?: ClaimHandler;
  setNext(handler: ClaimHandler): ClaimHandler {
    this.nextHandler = handler;
    return handler;
  }
  abstract handle(claim: InsuranceClaimRequest): ClaimValidationResult;
}

export class PolicyValidator extends ClaimHandler {
  handle(claim: InsuranceClaimRequest): ClaimValidationResult {
    PatternTraceService.emit({
      pattern: "Chain of Responsibility",
      category: "Behavioral",
      module: "Insurance",
      step: 1,
      message: \`PolicyValidator verified policy #\${claim.policyNumber}\`
    });
    if (!claim.policyNumber) return { passed: false, error: "Missing policy number" };
    return this.nextHandler ? this.nextHandler.handle(claim) : { passed: true };
  }
}`
  },
  {
    id: 'command',
    name: 'Command Pattern',
    category: 'Behavioral',
    module: 'Appointment Operations & History',
    problem: 'Appointment lifecycle actions (Book, Reschedule, Cancel, Reassign) require encapsulation as standalone command objects to support audit tracking, execution scheduling, and undo/redo capabilities.',
    solution: 'Command interface declares execute() and undo() operations implemented by BookAppointmentCommand, RescheduleAppointmentCommand, and CancelAppointmentCommand, invoked via AppointmentCommandInvoker.',
    advantages: [
      'Decouples UI action triggers from backend AppointmentService business logic',
      'Maintains an undoable command execution history for hospital audit compliance',
      'Supports queued and scheduled clinical operations'
    ],
    filePath: 'src/patterns/behavioral/Command.ts',
    trigger: 'Receptionist Books / Reschedules / Cancels Appointment',
    participants: ['Command', 'BookAppointmentCommand', 'RescheduleAppointmentCommand', 'CancelAppointmentCommand', 'AppointmentCommandInvoker', 'AppointmentService'],
    executionFlow: [
      '1. User clicks "Book Appointment"',
      '2. BookAppointmentCommand is instantiated with appointment details',
      '3. AppointmentCommandInvoker executes command and logs to history stack',
      '4. Appointment is persisted and can be undone if needed'
    ],
    codeExample: `export class BookAppointmentCommand implements Command {
  constructor(private service: typeof api, private data: any) {}

  async execute(): Promise<Appointment> {
    PatternTraceService.emit({
      pattern: "Command",
      category: "Behavioral",
      module: "Appointments",
      step: 1,
      message: \`BookAppointmentCommand executed for \${this.data.patientName}\`
    });
    return await this.service.createAppointment(this.data);
  }
}`
  },
  {
    id: 'interpreter',
    name: 'Interpreter Pattern',
    category: 'Behavioral',
    module: 'Clinical Rule & Alert Engine',
    problem: 'Hospital clinical alert criteria (e.g. Temperature > 39°C, SpO2 < 92%, Heart Rate > 100 bpm) change frequently based on department protocols. Hardcoded conditionals require code deployments for every clinical threshold adjustment.',
    solution: 'Interpreter grammar evaluates rule ASTs (GreaterThanExpression, LessThanExpression, EqualsExpression, AndExpression) against patient vital sign contexts to trigger automated clinical alerts.',
    advantages: [
      'Allows clinical administrators to construct dynamic threshold rules without coding',
      'Evaluates complex compound medical conditions (e.g. Temp > 38.5 AND HR > 110)',
      'Provides transparent explanations for why medical alerts triggered'
    ],
    filePath: 'src/patterns/behavioral/Interpreter.ts',
    trigger: 'Nurse Records Patient Vitals / Evaluates Rules',
    participants: ['Expression', 'GreaterThanExpression', 'LessThanExpression', 'EqualsExpression', 'AndExpression', 'VitalsRecord', 'RuleContext'],
    executionFlow: [
      '1. Nurse inputs vitals: Temp=39.4°C, SpO2=90%, HR=118 bpm',
      '2. Interpreter evaluates active ClinicalRule expressions against vital context',
      '3. GreaterThanExpression (temperature > 39.0) evaluates to TRUE',
      '4. Critical Pyrexia Alert is dispatched to attending physician'
    ],
    codeExample: `export interface Expression {
  interpret(context: Record<string, number>): boolean;
}

export class GreaterThanExpression implements Expression {
  constructor(private field: string, private threshold: number) {}

  interpret(context: Record<string, number>): boolean {
    const value = context[this.field] || 0;
    const match = value > this.threshold;
    if (match) {
      PatternTraceService.emit({
        pattern: "Interpreter",
        category: "Behavioral",
        module: "Clinical Rule Engine",
        step: 1,
        message: \`Interpreter: Condition (\${this.field}=\${value} > \${this.threshold}) evaluated TRUE\`
      });
    }
    return match;
  }
}`
  },
  {
    id: 'iterator',
    name: 'Iterator Pattern',
    category: 'Behavioral',
    module: 'Patient Medical History Timeline',
    problem: 'A patient longitudinal medical record contains heterogeneous collections (Consultations, Diagnostic Lab Results, Inpatient Admissions, Prescriptions, Surgeries). Displaying a chronological timeline requires traversing these without exposing internal data structures.',
    solution: 'MedicalHistoryIterator provides uniform hasNext() and next() sequential traversal across diverse clinical history arrays, sorting events chronologically on the fly.',
    advantages: [
      'Provides a consistent interface for traversing diverse clinical records',
      'Hides internal storage complexity from UI timeline components',
      'Supports filtering, reverse-chronological order, and pagination'
    ],
    filePath: 'src/patterns/behavioral/Iterator.ts',
    trigger: 'User Opens Patient Medical History Timeline',
    participants: ['Iterator<T>', 'MedicalHistoryIterator', 'Patient', 'MedicalHistoryEntry'],
    executionFlow: [
      '1. Clinician opens Patient Medical History view',
      '2. MedicalHistoryIterator gathers consultations, lab results, and admissions',
      '3. Iterator sorts entries by timestamp descending',
      '4. Timeline UI calls hasNext() and next() to render cohesive clinical cards'
    ],
    codeExample: `export class MedicalHistoryIterator implements Iterator<MedicalHistoryEntry> {
  private index = 0;
  private items: MedicalHistoryEntry[];

  constructor(patient: Patient) {
    this.items = [...(patient.medicalHistory || [])].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  hasNext(): boolean { return this.index < this.items.length; }
  next(): MedicalHistoryEntry {
    const item = this.items[this.index++];
    PatternTraceService.emit({
      pattern: "Iterator",
      category: "Behavioral",
      module: "Medical History",
      step: 1,
      message: \`Iterator fetched timeline event \${this.index}/\${this.items.length}: "\${item.title}"\`
    });
    return item;
  }
}`
  },
  {
    id: 'mediator',
    name: 'Mediator Pattern',
    category: 'Behavioral',
    module: 'Care Coordination & Department Hand-offs',
    problem: 'In acute care situations, Doctors, Nurses, Laboratories, and Pharmacies communicate constantly. Direct point-to-point references create a tangled dependency web where every department tightly couples to every other department.',
    solution: 'HospitalCareMediator coordinates inter-departmental communication, receiving care requests and routing them to the appropriate clinical units while tracking resolution status.',
    advantages: [
      'Decouples clinical departments by replacing many-to-many connections with one-to-many mediation',
      'Centralizes acute care workflow routing and escalation logic',
      'Provides complete visibility into open inter-departmental care requests'
    ],
    filePath: 'src/patterns/behavioral/Mediator.ts',
    trigger: 'Nurse / Doctor Dispatches Urgent Care Request',
    participants: ['CareMediator', 'HospitalCareMediator', 'CareParticipant', 'DoctorParticipant', 'NurseParticipant', 'PharmacyParticipant', 'LabParticipant'],
    executionFlow: [
      '1. Emergency Doctor dispatches STAT Medication Request',
      '2. HospitalCareMediator receives event and identifies Pharmacy as target',
      '3. Mediator routes notification to Central Pharmacy queue and notifies Head Nurse',
      '4. Pharmacist acknowledges and dispenses; Mediator marks care event resolved'
    ],
    codeExample: `export class HospitalCareMediator implements CareMediator {
  notify(sender: string, targetDept: string, eventType: string, message: string) {
    PatternTraceService.emit({
      pattern: "Mediator",
      category: "Behavioral",
      module: "Care Coordination",
      step: 1,
      message: \`Mediator routed \${eventType} from \${sender} to \${targetDept}\`
    });
    return api.createCareEvent({ senderName: sender, targetDepartment: targetDept, eventType, message });
  }
}`
  },
  {
    id: 'memento',
    name: 'Memento Pattern',
    category: 'Behavioral',
    module: 'Treatment Plan Versioning & Rollback',
    problem: 'Doctors iterate on complex treatment plans over weeks of inpatient observation. Clinicians need the ability to save version snapshots, inspect historical changes, and roll back to previous stable protocols without violating encapsulation.',
    solution: 'TreatmentPlanOriginator produces TreatmentPlanMemento snapshots stored in TreatmentPlanHistory, allowing seamless version state restoration.',
    advantages: [
      'Preserves complete state history of clinical treatment plans for medical compliance',
      'Enables instant rollback to earlier treatment plan revisions without data loss',
      'Maintains encapsulation by keeping snapshot state representation private'
    ],
    filePath: 'src/patterns/behavioral/Memento.ts',
    trigger: 'Doctor Saves Treatment Plan Version / Restores Previous Revision',
    participants: ['TreatmentPlanOriginator', 'TreatmentPlanMemento', 'TreatmentPlanHistory', 'TreatmentPlan'],
    executionFlow: [
      '1. Doctor modifies treatment dosages and instructions',
      '2. Originator captures current state inside a TreatmentPlanMemento',
      '3. Memento is pushed onto TreatmentPlanHistory stack',
      '4. When rollback is requested, Originator restores state from selected Memento'
    ],
    codeExample: `export class TreatmentPlanMemento {
  constructor(public readonly snapshot: TreatmentPlanSnapshot, public readonly version: number) {}
}

export class TreatmentPlanOriginator {
  constructor(private state: TreatmentPlan) {}

  save(): TreatmentPlanMemento {
    PatternTraceService.emit({
      pattern: "Memento",
      category: "Behavioral",
      module: "Treatment Plans",
      step: 1,
      message: \`Memento captured snapshot v\${this.state.versions.length + 1} for "\${this.state.name}"\`
    });
    return new TreatmentPlanMemento({ ...this.state }, this.state.versions.length + 1);
  }

  restore(memento: TreatmentPlanMemento) {
    this.state = { ...memento.snapshot };
  }
}`
  },
  {
    id: 'observer',
    name: 'Observer Pattern',
    category: 'Behavioral',
    module: 'Clinical Event Broadcasting & Notifications',
    problem: 'When significant clinical events occur (Lab Result Ready, Prescription Created, Critical Vitals Alert, Patient Admitted), multiple hospital subsystems (UI notifications, audit logging, analytics counters, live charts) need to react without tight coupling.',
    solution: 'ClinicalEventSubject maintains a list of Observer subscribers (NotificationObserver, AuditObserver, DashboardObserver) and broadcasts events automatically when updates occur.',
    advantages: [
      'Supports broadcast-style communication between clinical publishers and subscribers',
      'Allows adding new reactive modules (e.g. SMS alert dispatch) without modifying core services',
      'Enables real-time reactive UI updates across multi-persona dashboards'
    ],
    filePath: 'src/patterns/behavioral/Observer.ts',
    trigger: 'Any Major Hospital Event (Lab completed, Rx dispensed, Alert fired)',
    participants: ['Subject', 'ClinicalEventSubject', 'Observer', 'NotificationObserver', 'AuditObserver', 'DashboardObserver'],
    executionFlow: [
      '1. Lab Tech publishes completed diagnostic result',
      '2. ClinicalEventSubject invokes notify(event)',
      '3. NotificationObserver alerts attending physician',
      '4. AuditObserver logs compliance record',
      '5. DashboardObserver updates live hospital KPI widgets'
    ],
    codeExample: `export interface Observer {
  update(event: HospitalEvent): void;
}

export class ClinicalEventSubject {
  private observers: Observer[] = [];

  subscribe(observer: Observer) { this.observers.push(observer); }
  notify(event: HospitalEvent) {
    PatternTraceService.emit({
      pattern: "Observer",
      category: "Behavioral",
      module: "Notifications",
      step: 1,
      message: \`Observer: Notifying \${this.observers.length} subscribers of event \${event.type}\`
    });
    this.observers.forEach(obs => obs.update(event));
  }
}`
  },
  {
    id: 'state',
    name: 'State Pattern',
    category: 'Behavioral',
    module: 'Appointment & Admission Lifecycle',
    problem: 'Hospital appointments progress through strict clinical phases (SCHEDULED -> CHECKED_IN -> IN_CONSULTATION -> COMPLETED / CANCELLED). Performing actions out of order (e.g. checking in a completed appointment) violates hospital procedure.',
    solution: 'AppointmentState interface (ScheduledState, CheckedInState, InConsultationState, CompletedState, CancelledState) encapsulates valid lifecycle transitions and rejects invalid state mutations.',
    advantages: [
      'Eliminates sprawling switch/case statements for workflow state checks',
      'Enforces strict clinical state transition rules and invariants',
      'Makes valid lifecycle paths explicit and self-documenting'
    ],
    filePath: 'src/patterns/behavioral/State.ts',
    trigger: 'User Advances Appointment Status (Check-In, Start Consult, Complete)',
    participants: ['AppointmentContext', 'AppointmentState', 'ScheduledState', 'CheckedInState', 'InConsultationState', 'CompletedState', 'CancelledState'],
    executionFlow: [
      '1. Receptionist clicks "Check-In" on scheduled appointment',
      '2. ScheduledState validates transition and shifts context to CheckedInState',
      '3. Doctor clicks "Start Consultation" -> advances to InConsultationState',
      '4. Invalid transitions (e.g. Completed -> Check-In) are safely rejected'
    ],
    codeExample: `export class ScheduledState implements AppointmentState {
  checkIn(context: AppointmentContext) {
    PatternTraceService.emit({
      pattern: "State",
      category: "Behavioral",
      module: "Appointments",
      step: 1,
      message: "State Transition: SCHEDULED -> CHECKED_IN"
    });
    context.setState(new CheckedInState());
  }
  startConsultation() { throw new Error("Patient must be checked in first."); }
}`
  },
  {
    id: 'strategy',
    name: 'Strategy Pattern',
    category: 'Behavioral',
    module: 'Physician Assignment & Doctor Scheduling',
    problem: 'When booking patient appointments, hospitals utilize different doctor assignment algorithms depending on clinic mode: Manual Selection, First Available Doctor, or Least Busy Doctor (load-balancing).',
    solution: 'SchedulingStrategy interface defines selectDoctor(doctors, department) implemented by ManualSchedulingStrategy, FirstAvailableStrategy, and LeastBusyStrategy, interchangeable at runtime.',
    advantages: [
      'Enables dynamic doctor load balancing across busy clinical departments',
      'Isolates scheduling algorithms into testable, interchangeable classes',
      'Allows adding new assignment strategies (e.g. Seniority-Based, Proximity-Based) easily'
    ],
    filePath: 'src/patterns/behavioral/Strategy.ts',
    trigger: 'Receptionist Selects Scheduling Algorithm During Booking',
    participants: ['SchedulingStrategy', 'ManualSchedulingStrategy', 'FirstAvailableStrategy', 'LeastBusyStrategy', 'Doctor'],
    executionFlow: [
      '1. Receptionist selects department and chooses "Least Busy Doctor" strategy',
      '2. System passes available physicians to LeastBusyStrategy',
      '3. Strategy analyzes active patient queue counts and picks optimal doctor',
      '4. Appointment is created with recommended physician'
    ],
    codeExample: `export interface SchedulingStrategy {
  selectDoctor(doctors: Doctor[], department: string): Doctor | null;
}

export class LeastBusyStrategy implements SchedulingStrategy {
  selectDoctor(doctors: Doctor[], department: string): Doctor | null {
    const deptDoctors = doctors.filter(d => d.department.includes(department) && d.availability !== 'ON_LEAVE');
    if (!deptDoctors.length) return null;
    const chosen = [...deptDoctors].sort((a, b) => a.currentActivePatients - b.currentActivePatients)[0];
    PatternTraceService.emit({
      pattern: "Strategy",
      category: "Behavioral",
      module: "Appointments",
      step: 1,
      message: \`LeastBusyStrategy selected \${chosen.name} (\${chosen.currentActivePatients} active patients)\`
    });
    return chosen;
  }
}`
  },
  {
    id: 'template-method',
    name: 'Template Method Pattern',
    category: 'Behavioral',
    module: 'Hospital Report Generation',
    problem: 'Generating official hospital reports (Patient Clinical Summary, Financial Audit, Laboratory Analytics) follows an identical 4-stage algorithmic skeleton: Collect Data -> Validate -> Process/Aggregate -> Format Output, but each report implements specific steps differently.',
    solution: 'ReportGenerator abstract base class defines the fixed generate() template method while letting subclasses (PatientReportGenerator, BillingReportGenerator, LaboratoryReportGenerator) customize individual steps.',
    advantages: [
      'Reuses invariant 4-step report generation algorithm across all hospital reporting needs',
      'Prevents code duplication in data validation and header/footer formatting',
      'Guarantees all hospital reports conform to standardized compliance validation'
    ],
    filePath: 'src/patterns/behavioral/TemplateMethod.ts',
    trigger: 'Administrator / Doctor Generates Official Hospital Report',
    participants: ['ReportGenerator (Abstract)', 'PatientReportGenerator', 'BillingReportGenerator', 'LaboratoryReportGenerator'],
    executionFlow: [
      '1. Administrator clicks "Generate Financial Report"',
      '2. BillingReportGenerator invokes inherited generate() template method',
      '3. Executes collectData() -> validate() -> process() -> format()',
      '4. Outputs standardized, certified hospital executive report'
    ],
    codeExample: `export abstract class ReportGenerator {
  generate(context: any) {
    PatternTraceService.emit({
      pattern: "Template Method",
      category: "Behavioral",
      module: "Reporting",
      step: 1,
      message: "Template Method: Executing invariant Collect -> Validate -> Process -> Format pipeline"
    });
    const raw = this.collectData(context);
    this.validateData(raw);
    const processed = this.processData(raw);
    return this.formatOutput(processed);
  }
  abstract collectData(context: any): any;
  abstract validateData(data: any): void;
  abstract processData(data: any): any;
  abstract formatOutput(data: any): string;
}`
  },
  {
    id: 'visitor',
    name: 'Visitor Pattern',
    category: 'Behavioral',
    module: 'Hospital Analytics & Entity Inspection',
    problem: 'Hospital entities (Patient, Admission, LabOrder, Prescription) require diverse cross-cutting operations (Occupancy Analytics, Clinical Risk Scoring, Revenue Auditing). Polluting domain classes with disparate analysis methods violates Single Responsibility.',
    solution: 'HospitalVisitor interface (AnalyticsVisitor, ClinicalRiskVisitor) performs double dispatch with Visitable entities via accept(visitor), decoupling analytical operations from entity data structures.',
    advantages: [
      'Adds new analytical operations across hospital entities without changing their classes',
      'Gathers cross-entity clinical intelligence in dedicated visitor classes',
      'Demonstrates clean object-oriented double dispatch in TypeScript'
    ],
    filePath: 'src/patterns/behavioral/Visitor.ts',
    trigger: 'Admin / Lead Doctor Runs Hospital Analytics Visitor',
    participants: ['HospitalVisitor', 'AnalyticsVisitor', 'ClinicalRiskVisitor', 'VisitableHospitalEntity', 'Patient', 'Admission', 'LabOrder'],
    executionFlow: [
      '1. Administrator launches "Hospital-Wide Intelligence Audit"',
      '2. AnalyticsVisitor visits all active Patients, Admissions, and Lab Orders',
      '3. Visitor aggregates bed occupancy ratios, high-risk patients, and pending diagnostic bottlenecks',
      '4. Renders interactive executive metrics dashboard'
    ],
    codeExample: `export interface HospitalVisitor {
  visitPatient(patient: Patient): void;
  visitAdmission(admission: Admission): void;
  visitLabOrder(order: LabOrder): void;
}

export class AnalyticsVisitor implements HospitalVisitor {
  public criticalPatients = 0;
  public totalOccupancy = 0;
  public pendingLabs = 0;

  visitPatient(patient: Patient) {
    if (patient.priority === 'CRITICAL') this.criticalPatients++;
  }
  visitAdmission(admission: Admission) {
    if (admission.status === 'ADMITTED') this.totalOccupancy++;
  }
  visitLabOrder(order: LabOrder) {
    if (order.status === 'PENDING') this.pendingLabs++;
  }
}`
  }
];
