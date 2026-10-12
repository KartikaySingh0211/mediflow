import { Patient } from '../../types';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface Iterator<T> {
  hasNext(): boolean;
  next(): T;
  reset(): void;
  getCurrentIndex(): number;
  getTotalCount(): number;
}

export interface MedicalHistoryEntry {
  id: string;
  date: string;
  type: 'Consultation' | 'Admission' | 'Lab Result' | 'Prescription' | 'Surgery';
  title: string;
  description: string;
  doctorName: string;
}

export class MedicalHistoryIterator implements Iterator<MedicalHistoryEntry> {
  private currentIndex = 0;
  private timelineItems: MedicalHistoryEntry[] = [];

  constructor(patient: Patient, sortOrder: 'DESC' | 'ASC' = 'DESC') {
    // Flatten and normalize medical history
    this.timelineItems = [...(patient.medicalHistory || [])].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
    });

    PatternTraceService.emit({
      pattern: 'Iterator',
      category: 'Behavioral',
      module: 'Medical History',
      step: 1,
      message: `MedicalHistoryIterator initialized for "${patient.name}" (${this.timelineItems.length} timeline events sorted ${sortOrder})`
    });
  }

  public hasNext(): boolean {
    return this.currentIndex < this.timelineItems.length;
  }

  public next(): MedicalHistoryEntry {
    if (!this.hasNext()) {
      throw new Error('MedicalHistoryIterator: No more historical records in collection.');
    }

    const item = this.timelineItems[this.currentIndex];
    this.currentIndex++;

    PatternTraceService.emit({
      pattern: 'Iterator',
      category: 'Behavioral',
      module: 'Medical History',
      step: 2,
      message: `Iterator fetched record ${this.currentIndex}/${this.timelineItems.length}: [${item.type}] ${item.title}`
    });

    return item;
  }

  public reset(): void {
    this.currentIndex = 0;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getTotalCount(): number {
    return this.timelineItems.length;
  }

  public getAllRemaining(): MedicalHistoryEntry[] {
    const remaining: MedicalHistoryEntry[] = [];
    while (this.hasNext()) {
      remaining.push(this.next());
    }
    return remaining;
  }
}
