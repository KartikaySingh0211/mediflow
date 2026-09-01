import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface PrescriptionComponent {
  getMedicationName(): string;
  getDescription(): string;
  getInstructions(): string[];
  getWarnings(): string[];
}

// Base Component: Core Unadorned Prescription
export class BasicPrescription implements PrescriptionComponent {
  constructor(
    public readonly medicationName: string,
    public readonly baseDirection: string = 'Take as clinically indicated by physician'
  ) {}

  getMedicationName(): string {
    return this.medicationName;
  }

  getDescription(): string {
    return `Rx: ${this.medicationName}`;
  }

  getInstructions(): string[] {
    return [this.baseDirection];
  }

  getWarnings(): string[] {
    return [];
  }
}

// Base Decorator
export abstract class PrescriptionDecorator implements PrescriptionComponent {
  constructor(protected readonly decorated: PrescriptionComponent) {}

  getMedicationName(): string {
    return this.decorated.getMedicationName();
  }

  getDescription(): string {
    return this.decorated.getDescription();
  }

  getInstructions(): string[] {
    return this.decorated.getInstructions();
  }

  getWarnings(): string[] {
    return this.decorated.getWarnings();
  }
}

// Concrete Decorator 1: Precise Dosage & Administration Route
export class DosageDecorator extends PrescriptionDecorator {
  constructor(
    decorated: PrescriptionComponent,
    private readonly dosage: string,
    private readonly route: string = 'Orally'
  ) {
    super(decorated);
  }

  getInstructions(): string[] {
    PatternTraceService.emit({
      pattern: 'Decorator',
      category: 'Structural',
      module: 'Prescription & Pharmacy',
      step: 1,
      message: `DosageDecorator: attached dosage specification "${this.dosage} ${this.route}"`
    });
    return [
      ...this.decorated.getInstructions(),
      `Administer: ${this.dosage} ${this.route}`
    ];
  }
}

// Concrete Decorator 2: Chrono-Therapeutic Timing Protocol
export class TimingDecorator extends PrescriptionDecorator {
  constructor(
    decorated: PrescriptionComponent,
    private readonly frequency: string,
    private readonly timingDetails: string
  ) {
    super(decorated);
  }

  getInstructions(): string[] {
    PatternTraceService.emit({
      pattern: 'Decorator',
      category: 'Structural',
      module: 'Prescription & Pharmacy',
      step: 2,
      message: `TimingDecorator: attached schedule "${this.frequency} (${this.timingDetails})"`
    });
    return [
      ...this.decorated.getInstructions(),
      `Schedule: ${this.frequency} — ${this.timingDetails}`
    ];
  }
}

// Concrete Decorator 3: Dietary & Gastro-Intestinal Instructions
export class FoodInstructionDecorator extends PrescriptionDecorator {
  constructor(
    decorated: PrescriptionComponent,
    private readonly foodCaveat: string
  ) {
    super(decorated);
  }

  getInstructions(): string[] {
    PatternTraceService.emit({
      pattern: 'Decorator',
      category: 'Structural',
      module: 'Prescription & Pharmacy',
      step: 3,
      message: `FoodInstructionDecorator: attached dietary direction "${this.foodCaveat}"`
    });
    return [
      ...this.decorated.getInstructions(),
      `Dietary Note: ${this.foodCaveat}`
    ];
  }
}

// Concrete Decorator 4: Critical Black-Box & Clinical Warnings
export class WarningDecorator extends PrescriptionDecorator {
  constructor(
    decorated: PrescriptionComponent,
    private readonly warningText: string,
    private readonly isBlackBox: boolean = false
  ) {
    super(decorated);
  }

  getWarnings(): string[] {
    PatternTraceService.emit({
      pattern: 'Decorator',
      category: 'Structural',
      module: 'Prescription & Pharmacy',
      step: 4,
      message: `WarningDecorator: attached critical caveat "${this.warningText}"`
    });
    return [
      ...this.decorated.getWarnings(),
      `${this.isBlackBox ? '🔴 BLACK BOX WARNING' : '⚠️ CAUTION'}: ${this.warningText}`
    ];
  }
}
