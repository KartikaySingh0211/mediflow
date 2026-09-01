import { LabOrder } from '../../types';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface FormattedResult {
  formattedText: string;
  isNormal: boolean;
  criticalParameters: string[];
}

export interface DiagnosticProcessor {
  process(order: LabOrder): Promise<{ status: string; queueTime: string; trackingId: string }>;
}

export interface DiagnosticResultFormatter {
  format(raw: any): FormattedResult;
}

export interface DiagnosticFactory {
  createProcessor(): DiagnosticProcessor;
  createFormatter(): DiagnosticResultFormatter;
}

// 1. Internal Laboratory Family
export class InternalLabProcessor implements DiagnosticProcessor {
  async process(order: LabOrder) {
    PatternTraceService.emit({
      pattern: 'Abstract Factory',
      category: 'Creational',
      module: 'Laboratory & Diagnostics',
      step: 3,
      message: `InternalLabProcessor queued sample for on-site Roche Analyzer [${order.testName}]`
    });
    return { status: 'PROCESSING_ON_SITE', queueTime: '15 mins', trackingId: `INT-${order.orderNumber}` };
  }
}

export class InternalLabFormatter implements DiagnosticResultFormatter {
  format(raw: any): FormattedResult {
    PatternTraceService.emit({
      pattern: 'Abstract Factory',
      category: 'Creational',
      module: 'Laboratory & Diagnostics',
      step: 4,
      message: 'InternalLabFormatter structured on-site chemical analyzer telemetry'
    });
    const params = raw?.parameters || [];
    const criticals = params.filter((p: any) => p.status === 'CRITICAL' || p.status === 'HIGH').map((p: any) => p.name);
    return {
      formattedText: `INTERNAL CLINICAL LAB REPORT: ${raw?.summary || 'Analysis Complete'}`,
      isNormal: criticals.length === 0,
      criticalParameters: criticals
    };
  }
}

export class InternalLabFactory implements DiagnosticFactory {
  createProcessor(): DiagnosticProcessor {
    PatternTraceService.emit({
      pattern: 'Abstract Factory',
      category: 'Creational',
      module: 'Laboratory & Diagnostics',
      step: 2,
      message: 'InternalLabFactory created InternalLabProcessor'
    });
    return new InternalLabProcessor();
  }
  createFormatter(): DiagnosticResultFormatter {
    return new InternalLabFormatter();
  }
}

// 2. External Laboratory Family
export class ExternalLabProcessor implements DiagnosticProcessor {
  async process(order: LabOrder) {
    PatternTraceService.emit({
      pattern: 'Abstract Factory',
      category: 'Creational',
      module: 'Laboratory & Diagnostics',
      step: 3,
      message: `ExternalLabProcessor dispatched sample to Quest Diagnostics partner API [${order.testName}]`
    });
    return { status: 'DISPATCHED_TO_EXTERNAL', queueTime: '4 hours', trackingId: `QUEST-${order.orderNumber}` };
  }
}

export class ExternalLabFormatter implements DiagnosticResultFormatter {
  format(raw: any): FormattedResult {
    PatternTraceService.emit({
      pattern: 'Abstract Factory',
      category: 'Creational',
      module: 'Laboratory & Diagnostics',
      step: 4,
      message: 'ExternalLabFormatter parsed HL7 external laboratory response format'
    });
    const params = raw?.parameters || [];
    const criticals = params.filter((p: any) => p.status === 'CRITICAL').map((p: any) => p.name);
    return {
      formattedText: `EXTERNAL LAB PARTNER REPORT (HL7 v2.5): ${raw?.summary || 'External Analysis Ready'}`,
      isNormal: criticals.length === 0,
      criticalParameters: criticals
    };
  }
}

export class ExternalLabFactory implements DiagnosticFactory {
  createProcessor(): DiagnosticProcessor {
    PatternTraceService.emit({
      pattern: 'Abstract Factory',
      category: 'Creational',
      module: 'Laboratory & Diagnostics',
      step: 2,
      message: 'ExternalLabFactory created ExternalLabProcessor'
    });
    return new ExternalLabProcessor();
  }
  createFormatter(): DiagnosticResultFormatter {
    return new ExternalLabFormatter();
  }
}

// 3. Radiology Center Family
export class RadiologyProcessor implements DiagnosticProcessor {
  async process(order: LabOrder) {
    PatternTraceService.emit({
      pattern: 'Abstract Factory',
      category: 'Creational',
      module: 'Laboratory & Diagnostics',
      step: 3,
      message: `RadiologyProcessor reserved 64-Slice CT/MRI Imaging Bay [${order.testName}]`
    });
    return { status: 'IMAGING_IN_PROGRESS', queueTime: 'STAT (Immediate)', trackingId: `DICOM-${order.orderNumber}` };
  }
}

export class RadiologyFormatter implements DiagnosticResultFormatter {
  format(raw: any): FormattedResult {
    PatternTraceService.emit({
      pattern: 'Abstract Factory',
      category: 'Creational',
      module: 'Laboratory & Diagnostics',
      step: 4,
      message: 'RadiologyFormatter rendered PACS / DICOM imaging diagnostic report'
    });
    return {
      formattedText: `RADIOLOGY & IMAGING PACS REPORT: ${raw?.summary || 'Scan verified by Radiologist'}`,
      isNormal: !raw?.isCritical,
      criticalParameters: raw?.isCritical ? ['STAT Imaging Findings'] : []
    };
  }
}

export class RadiologyFactory implements DiagnosticFactory {
  createProcessor(): DiagnosticProcessor {
    PatternTraceService.emit({
      pattern: 'Abstract Factory',
      category: 'Creational',
      module: 'Laboratory & Diagnostics',
      step: 2,
      message: 'RadiologyFactory created RadiologyProcessor'
    });
    return new RadiologyProcessor();
  }
  createFormatter(): DiagnosticResultFormatter {
    return new RadiologyFormatter();
  }
}

export class DiagnosticFactoryProvider {
  static getFactory(provider: 'INTERNAL' | 'EXTERNAL' | 'RADIOLOGY_CENTER'): DiagnosticFactory {
    PatternTraceService.emit({
      pattern: 'Abstract Factory',
      category: 'Creational',
      module: 'Laboratory & Diagnostics',
      step: 1,
      message: `DiagnosticFactoryProvider resolved family for ${provider}`
    });

    switch (provider) {
      case 'EXTERNAL':
        return new ExternalLabFactory();
      case 'RADIOLOGY_CENTER':
        return new RadiologyFactory();
      case 'INTERNAL':
      default:
        return new InternalLabFactory();
    }
  }
}
