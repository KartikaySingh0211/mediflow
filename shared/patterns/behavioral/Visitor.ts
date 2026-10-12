import { Patient, Admission, LabOrder, Prescription } from '../../types';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface HospitalVisitor {
  getVisitorName(): string;
  visitPatient(patient: Patient): void;
  visitAdmission(admission: Admission): void;
  visitLabOrder(order: LabOrder): void;
  visitPrescription(prescription: Prescription): void;
}

export interface VisitableHospitalEntity {
  accept(visitor: HospitalVisitor): void;
}

// 1. Concrete Visitor: Institutional Hospital Analytics Visitor
export class AnalyticsVisitor implements HospitalVisitor {
  public totalPatientsVisited = 0;
  public criticalPatientsCount = 0;
  public activeAdmissionsCount = 0;
  public totalBedsOccupied = 0;
  public pendingLabOrdersCount = 0;
  public criticalLabCount = 0;
  public totalPrescribedMedications = 0;

  getVisitorName(): string { return 'Executive Hospital Analytics Visitor'; }

  visitPatient(patient: Patient): void {
    this.totalPatientsVisited++;
    if (patient.priority === 'CRITICAL') {
      this.criticalPatientsCount++;
    }
  }

  visitAdmission(admission: Admission): void {
    if (admission.status === 'ADMITTED' || admission.status === 'UNDER_OBSERVATION') {
      this.activeAdmissionsCount++;
      this.totalBedsOccupied++;
    }
  }

  visitLabOrder(order: LabOrder): void {
    if (order.status === 'PENDING' || order.status === 'PROCESSING') {
      this.pendingLabOrdersCount++;
    }
    if (order.isCritical) {
      this.criticalLabCount++;
    }
  }

  visitPrescription(prescription: Prescription): void {
    this.totalPrescribedMedications += (prescription.items?.length || 0);
  }

  getMetricsSummary() {
    PatternTraceService.emit({
      pattern: 'Visitor',
      category: 'Behavioral',
      module: 'Analytics & Visitor Inspection',
      step: 1,
      message: `AnalyticsVisitor: Visited ${this.totalPatientsVisited} patients, ${this.activeAdmissionsCount} admissions, ${this.pendingLabOrdersCount} lab orders`
    });

    return {
      'Total Patients Monitored': this.totalPatientsVisited,
      'Critical Care Triage Patients': this.criticalPatientsCount,
      'Inpatient Wards Occupied': this.activeAdmissionsCount,
      'Pending Diagnostic Tests': this.pendingLabOrdersCount,
      'STAT / Critical Flags': this.criticalLabCount,
      'Active Medication Orders': this.totalPrescribedMedications
    };
  }
}

// 2. Concrete Visitor: High-Risk Clinical Patient Scoring Visitor
export class ClinicalRiskVisitor implements HospitalVisitor {
  public highRiskPatients: Array<{ name: string; score: number; factors: string[] }> = [];

  getVisitorName(): string { return 'Automated Clinical Risk Scoring Visitor'; }

  visitPatient(patient: Patient): void {
    let score = 0;
    const factors: string[] = [];

    if (patient.priority === 'CRITICAL') {
      score += 50;
      factors.push('Emergency Critical Triage Flag (+50)');
    }
    if (patient.age > 65) {
      score += 20;
      factors.push('Geriatric Vulnerability (+20)');
    }
    if (patient.allergies && patient.allergies.length > 1) {
      score += 10;
      factors.push('Multiple Drug Allergies (+10)');
    }

    if (score >= 30) {
      this.highRiskPatients.push({ name: patient.name, score, factors });
    }
  }

  visitAdmission(admission: Admission): void {
    if (admission.priority === 'CRITICAL' || admission.ward.includes('ICU')) {
      const match = this.highRiskPatients.find(p => p.name === admission.patientName);
      if (match) {
        match.score += 25;
        match.factors.push(`Inpatient High Acuity: ${admission.ward} (+25)`);
      }
    }
  }

  visitLabOrder(order: LabOrder): void {
    if (order.isCritical) {
      const match = this.highRiskPatients.find(p => p.name === order.patientName);
      if (match) {
        match.score += 30;
        match.factors.push(`Critical Lab Result: ${order.testName} (+30)`);
      }
    }
  }

  visitPrescription(): void {
    // Prescriptions risk factor inspection
  }

  getResults() {
    PatternTraceService.emit({
      pattern: 'Visitor',
      category: 'Behavioral',
      module: 'Analytics & Visitor Inspection',
      step: 1,
      message: `ClinicalRiskVisitor: Double-dispatched across entities; identified ${this.highRiskPatients.length} elevated risk patients`
    });

    return [...this.highRiskPatients].sort((a, b) => b.score - a.score);
  }
}
