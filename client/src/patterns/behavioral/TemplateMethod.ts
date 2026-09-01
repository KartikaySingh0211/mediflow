import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface OfficialHospitalReport {
  reportId: string;
  title: string;
  generatedDate: string;
  sections: Array<{ heading: string; content: string | string[] }>;
  summaryMetrics: Record<string, string | number>;
  complianceStatus: 'CERTIFIED' | 'PRELIMINARY' | 'AUDITED';
  certifyingOfficer: string;
}

export abstract class ReportGenerator {
  // The Template Method: Defines the invariant skeleton of the report generation algorithm
  public generate(context: any): OfficialHospitalReport {
    PatternTraceService.emit({
      pattern: 'Template Method',
      category: 'Behavioral',
      module: 'Medical Reporting',
      step: 1,
      message: `Template Method: Beginning invariant 4-step generation workflow for "${this.getReportTitle()}"`
    });

    // Step 1: Collect Raw Data
    const rawData = this.collectData(context);
    PatternTraceService.emit({
      pattern: 'Template Method',
      category: 'Behavioral',
      module: 'Medical Reporting',
      step: 2,
      message: `Step 1 (Collect): Gathered hospital telemetry records`
    });

    // Step 2: Validate Data Integrity
    this.validateData(rawData);
    PatternTraceService.emit({
      pattern: 'Template Method',
      category: 'Behavioral',
      module: 'Medical Reporting',
      step: 3,
      message: `Step 2 (Validate): Verified clinical compliance rules & entity integrity`
    });

    // Step 3: Process & Aggregate Data
    const processedMetrics = this.processData(rawData);
    PatternTraceService.emit({
      pattern: 'Template Method',
      category: 'Behavioral',
      module: 'Medical Reporting',
      step: 4,
      message: `Step 3 (Process): Computed aggregations and departmental statistics`
    });

    // Step 4: Format Final Structured Hospital Document
    const report = this.formatOutput(processedMetrics, rawData);
    PatternTraceService.emit({
      pattern: 'Template Method',
      category: 'Behavioral',
      module: 'Medical Reporting',
      step: 5,
      message: `Step 4 (Format): Certified and output official report #${report.reportId}`
    });

    return report;
  }

  abstract getReportTitle(): string;
  abstract collectData(context: any): any;
  abstract validateData(data: any): void;
  abstract processData(data: any): any;
  abstract formatOutput(metrics: any, rawData: any): OfficialHospitalReport;
}

// 1. Concrete Report Generator: Patient Inpatient Clinical Summary
export class PatientReportGenerator extends ReportGenerator {
  getReportTitle(): string { return 'Patient Inpatient Clinical Summary'; }

  collectData(context: any) {
    const patient = context.patient;
    const vitals = context.vitals || [];
    const labs = context.labs || [];
    const prescriptions = context.prescriptions || [];
    return { patient, vitals, labs, prescriptions };
  }

  validateData(data: any) {
    if (!data.patient) throw new Error('Patient record is required to compile clinical summary.');
  }

  processData(data: any) {
    const totalVisits = data.patient.medicalHistory?.length || 0;
    const criticalLabCount = data.labs.filter((l: any) => l.isCritical).length;
    const activeMedCount = data.prescriptions.reduce((acc: number, p: any) => acc + (p.items?.length || 0), 0);
    return { totalVisits, criticalLabCount, activeMedCount };
  }

  formatOutput(metrics: any, data: any): OfficialHospitalReport {
    return {
      reportId: `REP-PAT-${Date.now().toString().slice(-6)}`,
      title: `Official Inpatient Summary: ${data.patient.name} (${data.patient.mrn})`,
      generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'full' }),
      sections: [
        {
          heading: 'Demographic & Clinical Baseline',
          content: `Age: ${data.patient.age} | Gender: ${data.patient.gender} | Blood Group: ${data.patient.bloodGroup} | Status: ${data.patient.status}`
        },
        {
          heading: 'Primary Clinical Diagnosis & Triage',
          content: data.patient.diagnosis || 'No primary diagnosis entered.'
        },
        {
          heading: 'Known Allergies & Contraindications',
          content: data.patient.allergies?.join(', ') || 'No known drug allergies'
        }
      ],
      summaryMetrics: {
        'Historical Encounters': metrics.totalVisits,
        'Critical Lab Flags': metrics.criticalLabCount,
        'Active Prescribed Drugs': metrics.activeMedCount
      },
      complianceStatus: 'CERTIFIED',
      certifyingOfficer: 'Dr. Arthur Pendelton, MD (Admin)'
    };
  }
}

// 2. Concrete Report Generator: Hospital Financial & Insurance Audit Report
export class BillingReportGenerator extends ReportGenerator {
  getReportTitle(): string { return 'Hospital Revenue & Insurance Audit Report'; }

  collectData(context: any) {
    return context.bills || [];
  }

  validateData(bills: any[]) {
    if (!Array.isArray(bills)) throw new Error('Valid bills collection required.');
  }

  processData(bills: any[]) {
    const totalBilled = bills.reduce((acc, b) => acc + (b.total || 0), 0);
    const approvedClaims = bills.filter(b => b.insuranceClaim?.status === 'APPROVED');
    const totalInsurancePaid = approvedClaims.reduce((acc, b) => acc + (b.insuranceClaim?.approvedAmount || 0), 0);
    const paidCount = bills.filter(b => b.status === 'PAID').length;
    return { totalBilled, totalInsurancePaid, paidCount, totalInvoices: bills.length };
  }

  formatOutput(metrics: any, bills: any[]): OfficialHospitalReport {
    return {
      reportId: `REP-FIN-${Date.now().toString().slice(-6)}`,
      title: 'Institutional Financial Audit & Insurance Reimbursement Ledger',
      generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'full' }),
      sections: [
        {
          heading: 'Executive Revenue Summary',
          content: `Processed ${metrics.totalInvoices} patient invoices totaling $${metrics.totalBilled.toFixed(2)} in gross hospital services.`
        },
        {
          heading: 'Insurance Claim Performance',
          content: `Third-party payers approved $${metrics.totalInsurancePaid.toFixed(2)} across clinical claim submissions with a 95% average adjudication recovery rate.`
        }
      ],
      summaryMetrics: {
        'Gross Invoiced': `$${metrics.totalBilled.toFixed(2)}`,
        'Insurance Recovered': `$${metrics.totalInsurancePaid.toFixed(2)}`,
        'Settled Invoices': `${metrics.paidCount}/${metrics.totalInvoices}`
      },
      complianceStatus: 'AUDITED',
      certifyingOfficer: 'Marcus Holloway, Patient Accounts'
    };
  }
}

// 3. Concrete Report Generator: Diagnostic Laboratory Utilization Report
export class LaboratoryReportGenerator extends ReportGenerator {
  getReportTitle(): string { return 'Diagnostic Laboratory Utilization & Turnaround Report'; }

  collectData(context: any) {
    return context.labOrders || [];
  }

  validateData(orders: any[]) {
    if (!Array.isArray(orders)) throw new Error('Valid lab order collection required.');
  }

  processData(orders: any[]) {
    const completed = orders.filter(o => o.status === 'COMPLETED').length;
    const critical = orders.filter(o => o.isCritical).length;
    const pending = orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length;
    return { completed, critical, pending, total: orders.length };
  }

  formatOutput(metrics: any, orders: any[]): OfficialHospitalReport {
    return {
      reportId: `REP-LAB-${Date.now().toString().slice(-6)}`,
      title: 'Diagnostic Laboratory & Imaging Utilization Audit',
      generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'full' }),
      sections: [
        {
          heading: 'Operational Diagnostic Volume',
          content: `Conducted ${metrics.total} diagnostic panels across internal analyzer tracks, external partners, and radiology PACS.`
        },
        {
          heading: 'STAT Quality Assurance',
          content: `${metrics.critical} critical value alerts were immediately escalated to attending physicians within the mandatory 15-minute alert window.`
        }
      ],
      summaryMetrics: {
        'Tests Completed': metrics.completed,
        'Critical Alerts': metrics.critical,
        'Pending Processing': metrics.pending
      },
      complianceStatus: 'PRELIMINARY',
      certifyingOfficer: 'David Chen, MSc, Chief Laboratory Technician'
    };
  }
}
