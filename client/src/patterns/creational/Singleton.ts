import { HospitalConfigData } from '../../types';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export class HospitalConfig {
  private static instance: HospitalConfig;
  private config: HospitalConfigData;

  private constructor() {
    this.config = {
      hospitalName: 'MediFlow Metropolitan Medical Center',
      tagline: 'Precision Care & Advanced Architectural Clinical Intelligence',
      licenseNumber: 'HOSP-LIC-2026-MED-9941',
      emergencyHotline: '+1 (800) 555-FLOW (3569)',
      workingHours: '24/7 Continuous Clinical Operations',
      address: '450 Health Sciences Parkway, Innovation District, Suite 100',
      supportedRoles: ['admin', 'receptionist', 'doctor', 'nurse', 'lab_tech', 'pharmacist', 'billing_officer'],
      departments: [
        { id: 'dep_cardio', name: 'Cardiology & Vascular Center', head: 'Dr. Robert Vance, MD', totalBeds: 40, occupiedBeds: 28 },
        { id: 'dep_neuro', name: 'Neurology & Stroke Institute', head: 'Dr. Maya Lin, MD', totalBeds: 30, occupiedBeds: 18 },
        { id: 'dep_trauma', name: 'Emergency & Trauma Care', head: 'Dr. Julian Foster, MD', totalBeds: 25, occupiedBeds: 22 },
        { id: 'dep_surg', name: 'General & Minimally Invasive Surgery', head: 'Dr. Catherine Blake, MD', totalBeds: 35, occupiedBeds: 20 },
        { id: 'dep_icu', name: 'Intensive Critical Care Unit (ICU)', head: 'Dr. Arthur Pendelton', totalBeds: 20, occupiedBeds: 16 }
      ],
      wards: [
        { id: 'ward_c3', name: 'Cardiology Ward 3', department: 'Cardiology', capacity: 20, occupied: 15 },
        { id: 'ward_t1', name: 'Emergency Trauma Bays', department: 'Emergency & Trauma', capacity: 15, occupied: 12 },
        { id: 'ward_icu', name: 'Main ICU Wing', department: 'ICU', capacity: 20, occupied: 16 }
      ],
      systemPolicies: {
        emergencyAutoAdmit: true,
        telemetrySamplingRateSeconds: 5,
        autoClaimValidation: true,
        strictRoleAccessControl: true
      },
      lastUpdated: new Date().toISOString()
    };
  }

  public static getInstance(): HospitalConfig {
    if (!HospitalConfig.instance) {
      HospitalConfig.instance = new HospitalConfig();
      PatternTraceService.emit({
        pattern: 'Singleton',
        category: 'Creational',
        module: 'System Configuration',
        step: 1,
        message: 'Created HospitalConfig singleton instance'
      });
    } else {
      PatternTraceService.emit({
        pattern: 'Singleton',
        category: 'Creational',
        module: 'System Configuration',
        step: 1,
        message: 'Reusing existing HospitalConfig singleton instance'
      });
    }
    return HospitalConfig.instance;
  }

  public getConfig(): HospitalConfigData {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<HospitalConfigData>): HospitalConfigData {
    this.config = {
      ...this.config,
      ...partial,
      lastUpdated: new Date().toISOString()
    };
    PatternTraceService.emit({
      pattern: 'Singleton',
      category: 'Creational',
      module: 'System Configuration',
      step: 2,
      message: `HospitalConfig updated: "${this.config.hospitalName}"`
    });
    return this.config;
  }

  public getHospitalName(): string {
    return this.config.hospitalName;
  }

  public getSupportedRoles(): string[] {
    return [...this.config.supportedRoles];
  }
}
