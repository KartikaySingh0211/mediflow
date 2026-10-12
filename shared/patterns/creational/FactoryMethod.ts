import { Patient } from '../../types';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface PatientInput {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  contactNumber: string;
  emergencyContact: string;
  referralSource?: string;
  allergies?: string[];
  diagnosis?: string;
  notes?: string;
}

export abstract class PatientCreator {
  abstract createPatient(data: PatientInput): Partial<Patient>;

  public register(data: PatientInput): Partial<Patient> {
    const draft = this.createPatient(data);
    PatternTraceService.emit({
      pattern: 'Factory Method',
      category: 'Creational',
      module: 'Patient Management',
      step: 3,
      message: `Patient draft prepared: ${draft.name} (Priority: ${draft.priority})`
    });
    return draft;
  }
}

export class RegularPatientCreator extends PatientCreator {
  createPatient(data: PatientInput): Partial<Patient> {
    PatternTraceService.emit({
      pattern: 'Factory Method',
      category: 'Creational',
      module: 'Patient Management',
      step: 1,
      message: 'RegularPatientCreator selected for standard outpatient admission'
    });
    return {
      ...data,
      registrationType: 'REGULAR',
      priority: 'NORMAL',
      status: 'REGISTERED',
      allergies: data.allergies || ['None known']
    };
  }
}

export class EmergencyPatientCreator extends PatientCreator {
  createPatient(data: PatientInput): Partial<Patient> {
    PatternTraceService.emit({
      pattern: 'Factory Method',
      category: 'Creational',
      module: 'Patient Management',
      step: 1,
      message: 'EmergencyPatientCreator selected -> Assigned STAT Priority: CRITICAL'
    });
    return {
      ...data,
      registrationType: 'EMERGENCY',
      priority: 'CRITICAL',
      status: 'IN_CONSULTATION',
      allergies: data.allergies || []
    };
  }
}

export class ReferredPatientCreator extends PatientCreator {
  createPatient(data: PatientInput): Partial<Patient> {
    PatternTraceService.emit({
      pattern: 'Factory Method',
      category: 'Creational',
      module: 'Patient Management',
      step: 1,
      message: `ReferredPatientCreator selected (Source: ${data.referralSource || 'External Clinic'})`
    });
    return {
      ...data,
      registrationType: 'REFERRED',
      priority: 'NORMAL',
      status: 'REGISTERED',
      referralSource: data.referralSource || 'External Specialist Clinic',
      allergies: data.allergies || []
    };
  }
}

export class PatientFactoryProvider {
  static getCreator(type: 'REGULAR' | 'EMERGENCY' | 'REFERRED'): PatientCreator {
    switch (type) {
      case 'EMERGENCY':
        return new EmergencyPatientCreator();
      case 'REFERRED':
        return new ReferredPatientCreator();
      case 'REGULAR':
      default:
        return new RegularPatientCreator();
    }
  }
}
