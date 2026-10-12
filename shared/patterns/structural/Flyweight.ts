import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

// Intrinsic State (Immutable, shared across thousands of prescriptions)
export interface MedicationMetadata {
  readonly id: string;
  readonly tradeName: string;
  readonly genericName: string;
  readonly therapeuticClass: string;
  readonly manufacturer: string;
  readonly defaultUnit: string;
  readonly standardWarnings: string[];
  readonly pregnancyCategory: 'A' | 'B' | 'C' | 'D' | 'X';
}

// Extrinsic Context (Unique to individual patient prescription instances)
export interface PrescriptionContext {
  prescriptionId: string;
  patientId: string;
  patientName: string;
  dosage: string;
  frequency: string;
  duration: string;
  customInstructions: string[];
  dispensed: boolean;
}

// Flyweight Factory
export class MedicationFlyweightFactory {
  private static formularyPool = new Map<string, MedicationMetadata>();

  // Pre-seed core formulary
  static {
    MedicationFlyweightFactory.seedFormulary();
  }

  private static seedFormulary() {
    const drugs: MedicationMetadata[] = [
      {
        id: 'med_atorvastatin',
        tradeName: 'Lipitor',
        genericName: 'Atorvastatin Calcium',
        therapeuticClass: 'HMG-CoA Reductase Inhibitor (Statin)',
        manufacturer: 'Pfizer Inc.',
        defaultUnit: 'mg',
        standardWarnings: [
          'Avoid consuming grapefruit or grapefruit juice',
          'Report unexplained muscle tenderness, pain or weakness (Rhabdomyolysis risk)'
        ],
        pregnancyCategory: 'X'
      },
      {
        id: 'med_metoprolol',
        tradeName: 'Toprol-XL',
        genericName: 'Metoprolol Succinate ER',
        therapeuticClass: 'Beta-1 Selective Adrenergic Blocker',
        manufacturer: 'AstraZeneca Pharmaceuticals',
        defaultUnit: 'mg',
        standardWarnings: [
          'Do not discontinue abruptly; taper gradually under supervision',
          'May mask symptoms of acute hypoglycemia in diabetic patients'
        ],
        pregnancyCategory: 'C'
      },
      {
        id: 'med_enoxaparin',
        tradeName: 'Lovenox',
        genericName: 'Enoxaparin Sodium',
        therapeuticClass: 'Low-Molecular-Weight Heparin (LMWH)',
        manufacturer: 'Sanofi-Aventis',
        defaultUnit: 'mg/mL',
        standardWarnings: [
          'Monitor for overt and occult bleeding episodes',
          'Contraindicated with active major hemorrhage or severe thrombocytopenia'
        ],
        pregnancyCategory: 'B'
      },
      {
        id: 'med_metformin',
        tradeName: 'Glucophage',
        genericName: 'Metformin Hydrochloride',
        therapeuticClass: 'Biguanide Antidiabetic Agent',
        manufacturer: 'Bristol-Myers Squibb',
        defaultUnit: 'mg',
        standardWarnings: [
          'Take with meals to minimize gastrointestinal discomfort',
          'Hold 48 hours before and after radiologic iodinated contrast procedures'
        ],
        pregnancyCategory: 'B'
      },
      {
        id: 'med_aspirin',
        tradeName: 'Bayer Low Dose',
        genericName: 'Aspirin (Acetylsalicylic Acid)',
        therapeuticClass: 'Antiplatelet & NSAID',
        manufacturer: 'Bayer HealthCare',
        defaultUnit: 'mg',
        standardWarnings: [
          'Risk of gastrointestinal ulceration and bleeding',
          'Contraindicated in pediatric viral infections (Reye syndrome)'
        ],
        pregnancyCategory: 'D'
      },
      {
        id: 'med_nitroglycerin',
        tradeName: 'Nitrostat',
        genericName: 'Nitroglycerin Sublingual',
        therapeuticClass: 'Vasodilator / Organic Nitrate',
        manufacturer: 'Pfizer Inc.',
        defaultUnit: 'mg',
        standardWarnings: [
          'Do not use concurrently with PDE-5 inhibitors (e.g. Sildenafil)',
          'May produce transient severe headache and orthostatic hypotension'
        ],
        pregnancyCategory: 'C'
      }
    ];

    drugs.forEach(d => MedicationFlyweightFactory.formularyPool.set(d.id, d));
  }

  public static getMedication(medicationId: string): MedicationMetadata {
    const existing = MedicationFlyweightFactory.formularyPool.get(medicationId);
    if (existing) {
      PatternTraceService.emit({
        pattern: 'Flyweight',
        category: 'Structural',
        module: 'Pharmacy & Formulary',
        step: 1,
        message: `Flyweight: Reused shared intrinsic metadata instance for "${existing.tradeName} (${existing.genericName})"`
      });
      return existing;
    }

    // Dynamic registration of new formulary entity
    const newDrug: MedicationMetadata = {
      id: medicationId,
      tradeName: medicationId.replace('med_', '').toUpperCase(),
      genericName: medicationId.replace('med_', ''),
      therapeuticClass: 'General Formulary Medication',
      manufacturer: 'Global Hospital Pharmacopeia',
      defaultUnit: 'mg',
      standardWarnings: ['Follow standard clinical drug administration guidelines'],
      pregnancyCategory: 'C'
    };

    MedicationFlyweightFactory.formularyPool.set(medicationId, newDrug);

    PatternTraceService.emit({
      pattern: 'Flyweight',
      category: 'Structural',
      module: 'Pharmacy & Formulary',
      step: 1,
      message: `Flyweight: Created and cached new shared metadata for "${newDrug.tradeName}" in formulary pool`
    });

    return newDrug;
  }

  public static getPoolSize(): number {
    return MedicationFlyweightFactory.formularyPool.size;
  }

  public static getAllMedications(): MedicationMetadata[] {
    return Array.from(MedicationFlyweightFactory.formularyPool.values());
  }
}
