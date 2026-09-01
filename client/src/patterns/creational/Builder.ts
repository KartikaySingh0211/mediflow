import { Admission } from '../../types';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export class AdmissionBuilder {
  private admission: Partial<Admission> = {
    status: 'ADMITTED',
    admissionDate: new Date().toISOString(),
    priority: 'NORMAL'
  };

  constructor() {
    PatternTraceService.emit({
      pattern: 'Builder',
      category: 'Creational',
      module: 'Patient Admission',
      step: 1,
      message: 'AdmissionBuilder initialized for inpatient workflow'
    });
  }

  public setPatient(patientId: string, patientName: string): this {
    this.admission.patientId = patientId;
    this.admission.patientName = patientName;
    PatternTraceService.emit({
      pattern: 'Builder',
      category: 'Creational',
      module: 'Patient Admission',
      step: 2,
      message: `AdmissionBuilder: linked patient ${patientName} (${patientId})`
    });
    return this;
  }

  public assignDoctor(doctorId: string, doctorName: string): this {
    this.admission.doctorId = doctorId;
    this.admission.doctorName = doctorName;
    PatternTraceService.emit({
      pattern: 'Builder',
      category: 'Creational',
      module: 'Patient Admission',
      step: 3,
      message: `AdmissionBuilder: assigned attending physician ${doctorName}`
    });
    return this;
  }

  public assignDepartment(department: string): this {
    this.admission.department = department;
    return this;
  }

  public setWard(ward: string): this {
    this.admission.ward = ward;
    return this;
  }

  public assignRoom(room: string): this {
    this.admission.room = room;
    return this;
  }

  public assignBed(bed: string): this {
    this.admission.bed = bed;
    PatternTraceService.emit({
      pattern: 'Builder',
      category: 'Creational',
      module: 'Patient Admission',
      step: 4,
      message: `AdmissionBuilder: reserved bed ${bed} in ${this.admission.room || 'Inpatient'}`
    });
    return this;
  }

  public setPriority(priority: 'NORMAL' | 'HIGH' | 'CRITICAL'): this {
    this.admission.priority = priority;
    return this;
  }

  public setAdmissionReason(reason: string): this {
    this.admission.reason = reason;
    return this;
  }

  public setTreatmentPlan(planId: string): this {
    this.admission.treatmentPlanId = planId;
    return this;
  }

  public setNotes(notes: string): this {
    this.admission.notes = notes;
    return this;
  }

  public getDraft(): Partial<Admission> {
    return { ...this.admission };
  }

  public build(): Admission {
    if (!this.admission.patientId || !this.admission.patientName) {
      throw new Error('AdmissionBuilder: Patient must be specified before building.');
    }
    if (!this.admission.doctorId || !this.admission.doctorName) {
      throw new Error('AdmissionBuilder: Attending doctor must be assigned.');
    }

    const fullAdmission: Admission = {
      id: this.admission.id || `adm_${Date.now()}`,
      patientId: this.admission.patientId,
      patientName: this.admission.patientName,
      doctorId: this.admission.doctorId,
      doctorName: this.admission.doctorName,
      department: this.admission.department || 'General Inpatient Medicine',
      ward: this.admission.ward || 'Main Inpatient Ward',
      room: this.admission.room || 'Room 101',
      bed: this.admission.bed || 'Bed 01',
      admissionDate: this.admission.admissionDate || new Date().toISOString(),
      reason: this.admission.reason || 'General clinical inpatient admission',
      priority: this.admission.priority || 'NORMAL',
      status: this.admission.status || 'ADMITTED',
      treatmentPlanId: this.admission.treatmentPlanId,
      notes: this.admission.notes
    };

    PatternTraceService.emit({
      pattern: 'Builder',
      category: 'Creational',
      module: 'Patient Admission',
      step: 5,
      message: `AdmissionBuilder: Successfully assembled Admission for ${fullAdmission.patientName}`
    });

    return fullAdmission;
  }
}
