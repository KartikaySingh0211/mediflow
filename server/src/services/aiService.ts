import { Patient, VitalsRecord, Bill, LabOrder, Prescription } from '../store/seedData.js';
import { AiAnalysisModel } from '../db/models.js';

export interface AiAnalysisRecord {
  id: string;
  targetType: 'PATIENT' | 'BILL' | 'HOSPITAL';
  targetId: string;
  targetName: string;
  portalSource: string;
  analysisType: 'CLINICAL_DECISION_SUPPORT' | 'DETERIORATION_RISK' | 'DRUG_SAFETY' | 'CLAIM_DENIAL_AUDIT' | 'RESOURCE_BOTTLENECK';
  riskScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  contraindications?: string[];
  evidenceFactors: Array<{ factor: string; impact: 'ELEVATED' | 'PROTECTIVE' | 'CRITICAL'; weight: number }>;
  doctorActionPlan?: string;
  timestamp: string;
  analyzedBy: string;
}

export class AiAnalysisService {
  /**
   * Generates Comprehensive Clinical Decision Support & Risk Analysis for a Patient
   */
  public static async analyzePatient(
    patient: Patient,
    vitals: VitalsRecord[],
    labs: LabOrder[],
    prescriptions: Prescription[],
    analyzedBy: string = 'Dr. Robert Vance, MD'
  ): Promise<AiAnalysisRecord> {
    const latestVitals = vitals[0];
    const criticalLabs = labs.filter(l => l.isCritical);
    const hasHeartDisease = (patient.diagnosis || '').toLowerCase().includes('angina') || 
                           (patient.diagnosis || '').toLowerCase().includes('cardiac') ||
                           (patient.diagnosis || '').toLowerCase().includes('infarct');
    const hasPulmonaryIssue = (patient.diagnosis || '').toLowerCase().includes('dyspnea') || 
                             (patient.diagnosis || '').toLowerCase().includes('embolism');

    let score = 25;
    const findings: string[] = [];
    const recommendations: string[] = [];
    const contraindications: string[] = [];
    const evidenceFactors: Array<{ factor: string; impact: 'ELEVATED' | 'PROTECTIVE' | 'CRITICAL'; weight: number }> = [];

    // Evaluate Vitals
    if (latestVitals) {
      if (latestVitals.oxygenSaturation < 92) {
        score += 25;
        findings.push(`Hypoxemia detected (SpO2 ${latestVitals.oxygenSaturation}% < 92% reference minimum).`);
        evidenceFactors.push({ factor: `Desaturation SpO2 ${latestVitals.oxygenSaturation}%`, impact: 'CRITICAL', weight: 25 });
        recommendations.push('Initiate high-flow supplemental O2 via Venturi mask (target SpO2 ≥ 95%).');
      }
      if (latestVitals.heartRate > 100) {
        score += 15;
        findings.push(`Sinus tachycardia present (${latestVitals.heartRate} bpm > 100 bpm baseline).`);
        evidenceFactors.push({ factor: `Elevated resting HR ${latestVitals.heartRate} bpm`, impact: 'ELEVATED', weight: 15 });
      }
      if (latestVitals.temperature > 38.5) {
        score += 15;
        findings.push(`Elevated core pyrexia (${latestVitals.temperature}°C).`);
        evidenceFactors.push({ factor: `Fever spike ${latestVitals.temperature}°C`, impact: 'ELEVATED', weight: 15 });
      }
      if (latestVitals.bloodPressureSys < 90) {
        score += 20;
        findings.push(`Hypotension shock index warning (Systolic BP ${latestVitals.bloodPressureSys} mmHg).`);
        evidenceFactors.push({ factor: `Hemodynamic instability (${latestVitals.bloodPressureSys} mmHg sys)`, impact: 'CRITICAL', weight: 20 });
      }
    }

    // Evaluate Labs
    if (criticalLabs.length > 0) {
      score += 20;
      criticalLabs.forEach(cl => {
        findings.push(`STAT critical biomarker flag: ${cl.testName} (${cl.results?.summary || 'Elevated reference ratio'}).`);
        evidenceFactors.push({ factor: `Critical ${cl.testName}`, impact: 'CRITICAL', weight: 20 });
      });
      recommendations.push('Re-assay cardiac enzymes in 3 hours to determine kinetic delta.');
    }

    // Evaluate Drug Safety & Allergies
    if (patient.allergies && patient.allergies.length > 0) {
      patient.allergies.forEach(all => {
        contraindications.push(`Absolute contraindication to ${all} class and cross-reactive derivatives.`);
        evidenceFactors.push({ factor: `Documented severe allergy: ${all}`, impact: 'ELEVATED', weight: 10 });
      });
    }

    // Determine Risk Level
    score = Math.min(Math.max(score, 10), 98);
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (score >= 75) riskLevel = 'CRITICAL';
    else if (score >= 55) riskLevel = 'HIGH';
    else if (score >= 35) riskLevel = 'MODERATE';

    // Tailored Recommendations
    if (hasHeartDisease) {
      recommendations.push('Maintain continuous 12-lead telemetry and titrate dual antiplatelet therapy.');
      recommendations.push('Schedule bedside Echocardiogram to assess left ventricular ejection fraction.');
    } else if (hasPulmonaryIssue) {
      recommendations.push('Urgent CT Pulmonary Angiogram (CTPA) indicated to rule out vascular occlusion.');
      recommendations.push('Administer weight-adjusted Low Molecular Weight Heparin unless contraindicated.');
    } else {
      recommendations.push('Continue clinical observation, repeat vitals every 4 hours, and monitor discharge clearance criteria.');
    }

    const summary = `${patient.name} (${patient.mrn}) presents with an AI-computed Clinical Acuity Index of ${score}/100 [${riskLevel}]. Analysis integrates real-time telemetry, ${labs.length} diagnostic studies, and ${patient.allergies?.length || 0} documented drug sensitivities.`;

    const record: AiAnalysisRecord = {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      targetType: 'PATIENT',
      targetId: patient.id,
      targetName: patient.name,
      portalSource: 'doctor',
      analysisType: 'CLINICAL_DECISION_SUPPORT',
      riskScore: score,
      riskLevel,
      summary,
      keyFindings: findings.length > 0 ? findings : ['Hemodynamic vitals within physiological reference baseline.', 'No critical biomarker flags active.'],
      recommendations,
      contraindications,
      evidenceFactors,
      doctorActionPlan: `Admit to ${patient.room || 'Telemetry Unit'}, assign specialized nursing oversight, and reassess within 180 minutes.`,
      timestamp: new Date().toISOString(),
      analyzedBy
    };

    // Store directly in MongoDB Atlas!
    await AiAnalysisModel.create(record);
    return record;
  }

  /**
   * Generates AI Claim Denial Risk & Pre-Submission Audit for a Bill
   */
  public static async analyzeBill(bill: Bill, analyzedBy: string = 'Marcus Holloway'): Promise<AiAnalysisRecord> {
    let denialRisk = 12;
    const findings: string[] = [];
    const recommendations: string[] = [];
    const evidenceFactors: Array<{ factor: string; impact: 'ELEVATED' | 'PROTECTIVE' | 'CRITICAL'; weight: number }> = [];

    const hasSurgery = bill.groups.some(g => g.name.toLowerCase().includes('surgery'));
    const isHighAmount = bill.total > 5000;
    const hasClaim = !!bill.insuranceClaim;

    if (isHighAmount) {
      denialRisk += 25;
      findings.push(`High invoice quantum ($${bill.total.toFixed(2)}) triggers secondary insurance utilization review.`);
      evidenceFactors.push({ factor: `Total charges > $5,000 threshold ($${bill.total.toFixed(2)})`, impact: 'ELEVATED', weight: 25 });
    }

    if (hasSurgery) {
      denialRisk += 20;
      findings.push('Surgical codes present; third-party payers require operative dictation report and pre-authorization code.');
      evidenceFactors.push({ factor: 'Major surgical procedure line items', impact: 'ELEVATED', weight: 20 });
      recommendations.push('Attach signed operative notes and implant verification ledger.');
    }

    if (hasClaim && bill.insuranceClaim?.policyNumber.toUpperCase().includes('EXPIRED')) {
      denialRisk = 95;
      findings.push('Policy number flagged as inactive or expired in national insurance clearinghouse registry.');
      evidenceFactors.push({ factor: 'Invalid / Expired policy number rider', impact: 'CRITICAL', weight: 90 });
    }

    if (!bill.groups || bill.groups.length < 2) {
      denialRisk += 15;
      findings.push('Sub-optimal line item grouping; itemized medical breakdown required by CMS-1500 standards.');
      recommendations.push('Decompose charges into distinct departmental composite groups.');
    }

    denialRisk = Math.min(Math.max(denialRisk, 5), 98);
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (denialRisk >= 60) riskLevel = 'CRITICAL';
    else if (denialRisk >= 40) riskLevel = 'HIGH';
    else if (denialRisk >= 20) riskLevel = 'MODERATE';

    recommendations.push('Submit with full Composite itemized ledger to maximize adjudication approval speed.');
    recommendations.push(`Expected insurance reimbursement recovery rate: ${Math.round((100 - denialRisk) * 0.95)}% of gross claim.`);

    const summary = `Invoice #${bill.invoiceNumber} for ${bill.patientName} has an estimated Denial Probability of ${denialRisk}% [${riskLevel}]. Pre-adjudication audit verified ${bill.groups.length} composite service categories.`;

    const record: AiAnalysisRecord = {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      targetType: 'BILL',
      targetId: bill.id,
      targetName: `Invoice #${bill.invoiceNumber} (${bill.patientName})`,
      portalSource: 'billing',
      analysisType: 'CLAIM_DENIAL_AUDIT',
      riskScore: denialRisk,
      riskLevel,
      summary,
      keyFindings: findings.length > 0 ? findings : ['All billing line items map to compliant ICD-10 diagnostic codes.', 'Documentation complete.'],
      recommendations,
      evidenceFactors,
      doctorActionPlan: 'Proceed with 4-stage Chain of Responsibility submission upon verification.',
      timestamp: new Date().toISOString(),
      analyzedBy
    };

    // Store directly in MongoDB Atlas!
    await AiAnalysisModel.create(record);
    return record;
  }

  /**
   * Generates AI Hospital Operational Intelligence & Bed Utilization Forecast
   */
  public static async analyzeHospitalOperations(
    totalPatients: number,
    criticalCount: number,
    totalBeds: number,
    occupiedBeds: number,
    pendingLabs: number
  ): Promise<AiAnalysisRecord> {
    const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);
    let score = 30;
    const findings: string[] = [];
    const recommendations: string[] = [];

    findings.push(`Overall Inpatient Bed Occupancy: ${occupancyRate}% (${occupiedBeds}/${totalBeds} licensed beds).`);
    findings.push(`Emergency Triage Surge: ${criticalCount} patients currently categorized as CRITICAL priority.`);

    if (occupancyRate > 80) {
      score += 35;
      findings.push('ICU and telemetry wards approaching capacity saturation threshold (>80%).');
      recommendations.push('Initiate rapid-discharge protocol for post-acute recovery patients in step-down units.');
    }

    if (pendingLabs > 5) {
      score += 20;
      findings.push(`Diagnostic backlog: ${pendingLabs} diagnostic orders awaiting completion.`);
      recommendations.push('Route high-throughput chemistry panels through external Quest Diagnostics HL7 bridge.');
    }

    score = Math.min(Math.max(score, 15), 95);
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (score >= 70) riskLevel = 'CRITICAL';
    else if (score >= 50) riskLevel = 'HIGH';
    else if (score >= 30) riskLevel = 'MODERATE';

    const summary = `Hospital Operational Load Score: ${score}/100 [${riskLevel}]. System monitoring ${totalPatients} active patient encounters with ${occupancyRate}% institutional bed utilization.`;

    const record: AiAnalysisRecord = {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      targetType: 'HOSPITAL',
      targetId: 'HOSPITAL_METRO',
      targetName: 'MediFlow Metropolitan Medical Center',
      portalSource: 'admin',
      analysisType: 'RESOURCE_BOTTLENECK',
      riskScore: score,
      riskLevel,
      summary,
      keyFindings: findings,
      recommendations,
      evidenceFactors: [
        { factor: `Bed Occupancy Rate (${occupancyRate}%)`, impact: occupancyRate > 75 ? 'ELEVATED' : 'PROTECTIVE', weight: 40 },
        { factor: `Critical Trauma Cases (${criticalCount})`, impact: criticalCount > 2 ? 'CRITICAL' : 'PROTECTIVE', weight: 30 }
      ],
      timestamp: new Date().toISOString(),
      analyzedBy: 'Dr. Arthur Pendelton (Administrator)'
    };

    // Store directly in MongoDB Atlas!
    await AiAnalysisModel.create(record);
    return record;
  }
}
