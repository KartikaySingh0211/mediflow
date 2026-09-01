import { TreatmentPlan } from '../../types';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface TreatmentPlanSnapshot {
  name: string;
  diagnosis: string;
  medications: string[];
  instructions: string[];
  followUpSchedule: string;
}

// Memento: Immutable state snapshot
export class TreatmentPlanMemento {
  constructor(
    public readonly snapshot: TreatmentPlanSnapshot,
    public readonly version: number,
    public readonly timestamp: string = new Date().toISOString(),
    public readonly note: string = 'Clinical plan snapshot'
  ) {}
}

// Originator: Manages active state, creates mementos and restores from them
export class TreatmentPlanOriginator {
  private currentState: TreatmentPlan;

  constructor(initialPlan: TreatmentPlan) {
    this.currentState = JSON.parse(JSON.stringify(initialPlan));
  }

  public getState(): TreatmentPlan {
    return JSON.parse(JSON.stringify(this.currentState));
  }

  public updateState(partial: Partial<TreatmentPlanSnapshot>): void {
    if (partial.name) this.currentState.name = partial.name;
    if (partial.diagnosis) this.currentState.diagnosis = partial.diagnosis;
    if (partial.medications) this.currentState.medications = [...partial.medications];
    if (partial.instructions) this.currentState.instructions = [...partial.instructions];
    if (partial.followUpSchedule) this.currentState.followUpSchedule = partial.followUpSchedule;
    this.currentState.updatedAt = new Date().toISOString();
  }

  public saveToMemento(note: string = 'Treatment snapshot captured'): TreatmentPlanMemento {
    const nextVer = (this.currentState.versions?.length || 0) + 1;
    const snapshot: TreatmentPlanSnapshot = {
      name: this.currentState.name,
      diagnosis: this.currentState.diagnosis,
      medications: [...this.currentState.medications],
      instructions: [...this.currentState.instructions],
      followUpSchedule: this.currentState.followUpSchedule
    };

    PatternTraceService.emit({
      pattern: 'Memento',
      category: 'Behavioral',
      module: 'Treatment Plans',
      step: 1,
      message: `TreatmentPlanOriginator: Captured Memento snapshot v${nextVer} for "${this.currentState.name}"`
    });

    const memento = new TreatmentPlanMemento(snapshot, nextVer, new Date().toISOString(), note);

    if (!this.currentState.versions) this.currentState.versions = [];
    this.currentState.versions.push({
      version: nextVer,
      timestamp: memento.timestamp,
      note,
      snapshot: { ...snapshot }
    });

    return memento;
  }

  public restoreFromMemento(memento: TreatmentPlanMemento): void {
    PatternTraceService.emit({
      pattern: 'Memento',
      category: 'Behavioral',
      module: 'Treatment Plans',
      step: 2,
      message: `TreatmentPlanOriginator: Restored clinical protocol state to Memento version ${memento.version}`
    });

    this.currentState.name = memento.snapshot.name;
    this.currentState.diagnosis = memento.snapshot.diagnosis;
    this.currentState.medications = [...memento.snapshot.medications];
    this.currentState.instructions = [...memento.snapshot.instructions];
    this.currentState.followUpSchedule = memento.snapshot.followUpSchedule;
    this.currentState.updatedAt = new Date().toISOString();
  }
}

// Caretaker: History Keeper
export class TreatmentPlanHistory {
  private mementos: TreatmentPlanMemento[] = [];

  public push(memento: TreatmentPlanMemento): void {
    this.mementos.push(memento);
  }

  public getByVersion(version: number): TreatmentPlanMemento | undefined {
    return this.mementos.find(m => m.version === version);
  }

  public getAll(): TreatmentPlanMemento[] {
    return [...this.mementos];
  }
}
