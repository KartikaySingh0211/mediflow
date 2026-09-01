import { LabOrder } from '../../types';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface ProviderResponse {
  providerRef: string;
  normalizedStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED';
  message: string;
  vendorPayload: Record<string, any>;
}

export interface LabProviderAdapter {
  submitOrder(order: LabOrder): Promise<ProviderResponse>;
  normalizeResult(vendorResultPayload: any): LabOrder['results'];
}

// 1. Internal Hospital Core Lab (Cobas e411 analyzer format)
export class InternalLabAdapter implements LabProviderAdapter {
  async submitOrder(order: LabOrder): Promise<ProviderResponse> {
    PatternTraceService.emit({
      pattern: 'Adapter',
      category: 'Structural',
      module: 'Laboratory Integration',
      step: 1,
      message: `InternalLabAdapter: translating order ${order.orderNumber} to Cobas LIS protocol`
    });

    const vendorPayload = {
      specimen_barcode: `LIS-${order.id}`,
      instrument_id: 'ROCHE_COBAS_E411_BAY1',
      test_code: order.testCode,
      patient_mrn: order.patientId,
      stat_priority: order.priority === 'STAT'
    };

    return {
      providerRef: `INT-LIS-${order.orderNumber}`,
      normalizedStatus: 'PROCESSING',
      message: 'Order normalized for hospital core automation track.',
      vendorPayload
    };
  }

  normalizeResult(vendorResultPayload: any): LabOrder['results'] {
    PatternTraceService.emit({
      pattern: 'Adapter',
      category: 'Structural',
      module: 'Laboratory Integration',
      step: 2,
      message: 'InternalLabAdapter: normalized Cobas LIS sensor readings to MediFlow schema'
    });

    return {
      summary: vendorResultPayload?.summary || 'Internal lab automated analyzer analysis complete.',
      parameters: vendorResultPayload?.parameters || [
        { name: 'Analyzer Reading', value: '45.2', unit: 'U/L', referenceRange: '10 - 50', status: 'NORMAL' }
      ],
      technicianNotes: 'Verified by Internal Pathology LIS Adapter.'
    };
  }
}

// 2. External Diagnostic Partner (HL7 v2.5 / JSON API format)
export class ExternalLabAdapter implements LabProviderAdapter {
  async submitOrder(order: LabOrder): Promise<ProviderResponse> {
    PatternTraceService.emit({
      pattern: 'Adapter',
      category: 'Structural',
      module: 'Laboratory Integration',
      step: 1,
      message: `ExternalLabAdapter: transforming ${order.orderNumber} to Quest Diagnostics HL7 ORM message`
    });

    // Transforms internal field names to third-party vendor field names
    const vendorPayload = {
      MSH: 'MSH|^~\\&|MEDIFLOW|HOSPITAL|QUEST|DIAGNOSTICS',
      PID: {
        patient_identifier: order.patientId,
        patient_full_name: order.patientName
      },
      OBR: {
        placer_order_num: order.orderNumber,
        universal_service_id: order.testCode,
        requested_test_description: order.testName,
        ordering_provider: order.doctorName
      }
    };

    return {
      providerRef: `QUEST-HL7-${order.orderNumber}`,
      normalizedStatus: 'PROCESSING',
      message: 'MediFlow order converted to HL7 ORM^O01 and acknowledged by external lab partner.',
      vendorPayload
    };
  }

  normalizeResult(vendorResultPayload: any): LabOrder['results'] {
    PatternTraceService.emit({
      pattern: 'Adapter',
      category: 'Structural',
      module: 'Laboratory Integration',
      step: 2,
      message: 'ExternalLabAdapter: translated HL7 OBX result segments into MediFlow format'
    });

    return {
      summary: vendorResultPayload?.summary || 'Third-party reference laboratory report validated.',
      parameters: vendorResultPayload?.parameters || [
        { name: 'Reference Lab Assay', value: 'Negative', unit: '', referenceRange: 'Negative', status: 'NORMAL' }
      ],
      technicianNotes: 'Electronic interface transmission verified by ExternalLabAdapter.'
    };
  }
}

// 3. Radiology Imaging Center (DICOM Modality Worklist format)
export class RadiologyAdapter implements LabProviderAdapter {
  async submitOrder(order: LabOrder): Promise<ProviderResponse> {
    PatternTraceService.emit({
      pattern: 'Adapter',
      category: 'Structural',
      module: 'Laboratory Integration',
      step: 1,
      message: `RadiologyAdapter: mapping ${order.orderNumber} to DICOM Modality Worklist (MWL)`
    });

    const vendorPayload = {
      RequestedProcedureID: order.orderNumber,
      AccessionNumber: `ACC-${order.orderNumber}`,
      Modality: order.testCode.includes('CT') ? 'CT' : (order.testCode.includes('MRI') ? 'MR' : 'CR'),
      ScheduledStationAETitle: 'MEDIFLOW_PACS_A',
      PatientID: order.patientId,
      PatientName: order.patientName
    };

    return {
      providerRef: `DICOM-MWL-${order.orderNumber}`,
      normalizedStatus: 'PROCESSING',
      message: 'Dispatched to hospital PACS / DICOM imaging modality queue.',
      vendorPayload
    };
  }

  normalizeResult(vendorResultPayload: any): LabOrder['results'] {
    PatternTraceService.emit({
      pattern: 'Adapter',
      category: 'Structural',
      module: 'Laboratory Integration',
      step: 2,
      message: 'RadiologyAdapter: converted DICOM Structured Report (SR) into clinical text'
    });

    return {
      summary: vendorResultPayload?.summary || 'Imaging completed; PACS scan report available.',
      parameters: vendorResultPayload?.parameters || [
        { name: 'Slice Thickness', value: '1.25', unit: 'mm', referenceRange: 'N/A', status: 'NORMAL' }
      ],
      technicianNotes: 'Radiology modality workflow handled through RadiologyAdapter.'
    };
  }
}

export class LabAdapterFactory {
  static getAdapter(provider: 'INTERNAL' | 'EXTERNAL' | 'RADIOLOGY_CENTER'): LabProviderAdapter {
    switch (provider) {
      case 'EXTERNAL':
        return new ExternalLabAdapter();
      case 'RADIOLOGY_CENTER':
        return new RadiologyAdapter();
      case 'INTERNAL':
      default:
        return new InternalLabAdapter();
    }
  }
}
