import { Patient, UserRole } from '../../types';
import { api } from '../../services/api';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface PatientRecordService {
  getPatientRecord(patientId: string): Promise<Patient>;
  updatePatientRecord(patientId: string, data: Partial<Patient>): Promise<Patient>;
}

// Real Subject: Performs Direct API Calls
export class RealPatientRecordService implements PatientRecordService {
  async getPatientRecord(patientId: string): Promise<Patient> {
    return await api.getPatientById(patientId);
  }

  async updatePatientRecord(patientId: string, data: Partial<Patient>): Promise<Patient> {
    return await api.updatePatient(patientId, data);
  }
}

// Protection Proxy: Enforces Role-Based Access Control and Sensitive Data Redaction
export class SecurePatientRecordProxy implements PatientRecordService {
  constructor(
    private realService: RealPatientRecordService,
    private userRole: UserRole,
    private userName: string
  ) {}

  async getPatientRecord(patientId: string): Promise<Patient> {
    PatternTraceService.emit({
      pattern: 'Proxy',
      category: 'Structural',
      module: 'Patient Record Security',
      step: 1,
      message: `SecurePatientRecordProxy: Intercepted record request for Patient #${patientId} by ${this.userName} [${this.userRole}]`
    });

    // Check Authorization
    if (!this.userRole) {
      PatternTraceService.emit({
        pattern: 'Proxy',
        category: 'Structural',
        module: 'Patient Record Security',
        step: 2,
        message: 'SecurePatientRecordProxy: Access DENIED — Anonymous user lacks hospital credentials'
      });
      throw new Error('Access Denied: Unauthenticated access to Electronic Health Records.');
    }

    // Retrieve from Real Service
    const patient = await this.realService.getPatientRecord(patientId);

    // Apply Role-Specific Redaction / Projection
    if (this.userRole === 'billing_officer') {
      PatternTraceService.emit({
        pattern: 'Proxy',
        category: 'Structural',
        module: 'Patient Record Security',
        step: 3,
        message: 'SecurePatientRecordProxy: Redacted deep clinical diagnoses — Billing Officer granted demographic/account access'
      });

      return {
        ...patient,
        diagnosis: '[REDACTED FOR BILLING COMPLIANCE]',
        medicalHistory: patient.medicalHistory.map(h => ({
          ...h,
          description: '[CLINICAL DETAILS REDACTED]'
        }))
      };
    }

    if (this.userRole === 'receptionist') {
      PatternTraceService.emit({
        pattern: 'Proxy',
        category: 'Structural',
        module: 'Patient Record Security',
        step: 3,
        message: 'SecurePatientRecordProxy: Masked detailed physician surgery notes for Receptionist triage'
      });

      return {
        ...patient,
        medicalHistory: patient.medicalHistory.filter(h => h.type !== 'Surgery')
      };
    }

    // Doctors, Nurses, and Admins receive full authorized clinical payload
    PatternTraceService.emit({
      pattern: 'Proxy',
      category: 'Structural',
      module: 'Patient Record Security',
      step: 3,
      message: `SecurePatientRecordProxy: Full clinical access GRANTED to ${this.userName} (${this.userRole.toUpperCase()})`
    });

    return patient;
  }

  async updatePatientRecord(patientId: string, data: Partial<Patient>): Promise<Patient> {
    if (this.userRole === 'billing_officer' && (data.diagnosis || data.allergies)) {
      PatternTraceService.emit({
        pattern: 'Proxy',
        category: 'Structural',
        module: 'Patient Record Security',
        step: 2,
        message: 'SecurePatientRecordProxy: Mutate DENIED — Billing Officers cannot modify clinical diagnostic charts'
      });
      throw new Error('Unauthorized: Billing staff cannot modify medical diagnosis charts.');
    }

    return await this.realService.updatePatientRecord(patientId, data);
  }
}
