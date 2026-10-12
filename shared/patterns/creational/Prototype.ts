import { TreatmentPlan } from '../../types';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface Prototype<T> {
  clone(): T;
}

export class TreatmentPlanTemplate implements Prototype<TreatmentPlan> {
  constructor(
    public readonly templateId: string,
    public name: string,
    public diagnosis: string,
    public medications: string[],
    public instructions: string[],
    public followUpSchedule: string,
    public targetDepartment: string
  ) {}

  public clone(): TreatmentPlan {
    PatternTraceService.emit({
      pattern: 'Prototype',
      category: 'Creational',
      module: 'Treatment Plans',
      step: 1,
      message: `Prototype: Cloned clinical template "${this.name}"`
    });

    const deepClonedMedications = [...this.medications];
    const deepClonedInstructions = [...this.instructions];

    const clonedPlan: TreatmentPlan = {
      id: `tp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      patientId: '',
      patientName: '',
      doctorId: '',
      doctorName: '',
      name: `Customized: ${this.name}`,
      diagnosis: this.diagnosis,
      medications: deepClonedMedications,
      instructions: deepClonedInstructions,
      followUpSchedule: this.followUpSchedule,
      status: 'ACTIVE',
      versions: [
        {
          version: 1,
          timestamp: new Date().toISOString(),
          note: `Cloned from prototype template: ${this.name}`,
          snapshot: {
            name: `Customized: ${this.name}`,
            diagnosis: this.diagnosis,
            medications: [...deepClonedMedications],
            instructions: [...deepClonedInstructions],
            followUpSchedule: this.followUpSchedule
          }
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    PatternTraceService.emit({
      pattern: 'Prototype',
      category: 'Creational',
      module: 'Treatment Plans',
      step: 2,
      message: `Prototype: Generated independent treatment plan draft (Deep copy verified)`
    });

    return clonedPlan;
  }
}

// Built-in Standard Clinical Protocol Prototypes
export const STANDARD_TREATMENT_PROTOTYPES: TreatmentPlanTemplate[] = [
  new TreatmentPlanTemplate(
    'proto_cardiac',
    'Post-Acute Coronary Syndrome & Angina Care Protocol',
    'Unstable Angina Pectoris / Coronary Artery Disease',
    [
      'Atorvastatin 40mg PO QHS',
      'Metoprolol Succinate 50mg PO QAM',
      'Aspirin 81mg PO Daily',
      'Sublingual Nitroglycerin 0.4mg PRN chest pain'
    ],
    [
      'Continuous 3-lead ECG telemetry monitoring',
      'Strict cardiac salt-restricted diet (< 2g sodium/day)',
      'Daily 12-lead ECG at 07:00 AM',
      'Graduated cardiac rehabilitation ambulation program'
    ],
    'Cardiology outpatient clinic visit in 2 weeks',
    'Cardiology'
  ),
  new TreatmentPlanTemplate(
    'proto_diabetes',
    'Intensive Glycemic Control & Diabetic Foot Protection Protocol',
    'Type 2 Diabetes Mellitus with Hyperglycemia',
    [
      'Metformin HCl 1000mg PO BID with meals',
      'Insulin Glargine (Lantus) 18 units SubQ at bedtime',
      'Empagliflozin (Jardiance) 10mg PO QAM'
    ],
    [
      'Four-point capillary blood glucose testing (AC & QHS)',
      'Daily diabetic foot skin inspection',
      'Nutritional consultation for carbohydrate counting',
      'Microalbuminuria urine screen in 48 hours'
    ],
    'Endocrinology and diabetes educator in 10 days',
    'Internal Medicine'
  ),
  new TreatmentPlanTemplate(
    'proto_pulmonary',
    'Acute Pulmonary Embolism & Anticoagulation Protocol',
    'Acute Pulmonary Embolism with Respiratory Compromise',
    [
      'Enoxaparin (Lovenox) 1mg/kg SubQ Q12H',
      'Warfarin 5mg PO Daily (target INR 2.0-3.0)',
      'Supplemental O2 via nasal cannula to maintain SpO2 > 94%'
    ],
    [
      'Strict bedrest for initial 24 hours',
      'Continuous pulse oximetry and vitals telemetry',
      'Daily PT/INR coagulation blood monitoring',
      'Bilateral lower extremity venous duplex ultrasound'
    ],
    'Pulmonology & hematology review in 1 week',
    'Emergency & Trauma'
  ),
  new TreatmentPlanTemplate(
    'proto_postop',
    'Enhanced Recovery After Surgery (ERAS) Laparoscopic Protocol',
    'Post-Operative Laparoscopic Abdominal Surgery',
    [
      'Acetaminophen 1000mg IV/PO Q6H PRN pain',
      'Ketorolac 15mg IV Q6H (max 48 hours)',
      'Cefazolin 2g IV Q8H (first 24h prophylactic)'
    ],
    [
      'Early mobilization within 4 hours post-op',
      'Incentive spirometry 10 breaths every hour while awake',
      'Advance diet from clear liquids to regular as tolerated',
      'Monitor surgical dressing and Jackson-Pratt drain output'
    ],
    'Surgical follow-up in 10-14 days for wound evaluation',
    'General Surgery'
  )
];
