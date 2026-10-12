import { Doctor } from '../../types';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface SchedulingStrategy {
  getStrategyName(): string;
  selectDoctor(doctors: Doctor[], department: string, requestedDoctorId?: string): Doctor | null;
}

// Strategy 1: Manual Doctor Selection
export class ManualSchedulingStrategy implements SchedulingStrategy {
  getStrategyName(): string { return 'Manual Physician Selection'; }

  selectDoctor(doctors: Doctor[], _department: string, requestedDoctorId?: string): Doctor | null {
    if (!requestedDoctorId) return null;
    const found = doctors.find(d => d.id === requestedDoctorId) || null;
    if (found) {
      PatternTraceService.emit({
        pattern: 'Strategy',
        category: 'Behavioral',
        module: 'Doctor Scheduling',
        step: 1,
        message: `ManualSchedulingStrategy: Explicitly assigned ${found.name} (${found.specialization})`
      });
    }
    return found;
  }
}

// Strategy 2: First Available Doctor
export class FirstAvailableStrategy implements SchedulingStrategy {
  getStrategyName(): string { return 'First Available Active Physician'; }

  selectDoctor(doctors: Doctor[], department: string): Doctor | null {
    const candidates = doctors.filter(d => 
      d.department.toLowerCase().includes(department.toLowerCase()) && 
      (d.availability === 'AVAILABLE' || d.availability === 'EMERGENCY_DUTY')
    );

    const chosen = candidates[0] || null;
    if (chosen) {
      PatternTraceService.emit({
        pattern: 'Strategy',
        category: 'Behavioral',
        module: 'Doctor Scheduling',
        step: 1,
        message: `FirstAvailableStrategy: Selected next open clinician ${chosen.name} in ${department}`
      });
    }
    return chosen;
  }
}

// Strategy 3: Least Busy Doctor (Load-Balancing Algorithm)
export class LeastBusyStrategy implements SchedulingStrategy {
  getStrategyName(): string { return 'Least Busy Physician (Load Balancing)'; }

  selectDoctor(doctors: Doctor[], department: string): Doctor | null {
    const eligible = doctors.filter(d => 
      d.department.toLowerCase().includes(department.toLowerCase()) && 
      d.availability !== 'ON_LEAVE'
    );

    if (eligible.length === 0) return null;

    // Sort by active patient load ascending, then experience descending
    const sorted = [...eligible].sort((a, b) => {
      if (a.currentActivePatients !== b.currentActivePatients) {
        return a.currentActivePatients - b.currentActivePatients;
      }
      return b.experienceYears - a.experienceYears;
    });

    const optimalDoctor = sorted[0];

    PatternTraceService.emit({
      pattern: 'Strategy',
      category: 'Behavioral',
      module: 'Doctor Scheduling',
      step: 1,
      message: `LeastBusyStrategy: Assigned ${optimalDoctor.name} (Lowest load: ${optimalDoctor.currentActivePatients} active patients, ${optimalDoctor.experienceYears}y exp)`
    });

    return optimalDoctor;
  }
}

export class SchedulingStrategyContext {
  private strategy: SchedulingStrategy;

  constructor(initialStrategy: SchedulingStrategy = new LeastBusyStrategy()) {
    this.strategy = initialStrategy;
  }

  public setStrategy(strategy: SchedulingStrategy): void {
    this.strategy = strategy;
    PatternTraceService.emit({
      pattern: 'Strategy',
      category: 'Behavioral',
      module: 'Doctor Scheduling',
      step: 0,
      message: `SchedulingStrategyContext: Switched active doctor assignment strategy to "${strategy.getStrategyName()}"`
    });
  }

  public executeStrategy(doctors: Doctor[], department: string, doctorId?: string): Doctor | null {
    return this.strategy.selectDoctor(doctors, department, doctorId);
  }
}
