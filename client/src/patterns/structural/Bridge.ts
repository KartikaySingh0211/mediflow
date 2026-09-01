import { LabOrder } from '../../types';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

// Implementor Interface
export interface DiagnosticProviderBridge {
  getProviderName(): string;
  dispatch(order: LabOrder): Promise<{ trackingRef: string; estimatedTurnaround: string }>;
}

// Concrete Implementor 1: Internal Hospital Core Laboratory
export class InternalDiagnosticProvider implements DiagnosticProviderBridge {
  getProviderName(): string { return 'Internal Clinical Pathology Lab'; }

  async dispatch(order: LabOrder) {
    PatternTraceService.emit({
      pattern: 'Bridge',
      category: 'Structural',
      module: 'Diagnostics',
      step: 2,
      message: `Bridge Implementor: InternalDiagnosticProvider handling order ${order.orderNumber}`
    });
    return { trackingRef: `INT-${order.orderNumber}`, estimatedTurnaround: '30 mins' };
  }
}

// Concrete Implementor 2: External Commercial Diagnostic Partner
export class ExternalDiagnosticProvider implements DiagnosticProviderBridge {
  getProviderName(): string { return 'Quest Diagnostics External Network'; }

  async dispatch(order: LabOrder) {
    PatternTraceService.emit({
      pattern: 'Bridge',
      category: 'Structural',
      module: 'Diagnostics',
      step: 2,
      message: `Bridge Implementor: ExternalDiagnosticProvider handling order ${order.orderNumber}`
    });
    return { trackingRef: `QUEST-${order.orderNumber}`, estimatedTurnaround: '24 hours' };
  }
}

// Concrete Implementor 3: Advanced Radiology & Imaging Center
export class RadiologyCenterProvider implements DiagnosticProviderBridge {
  getProviderName(): string { return 'High-Field Radiology & Imaging Suite'; }

  async dispatch(order: LabOrder) {
    PatternTraceService.emit({
      pattern: 'Bridge',
      category: 'Structural',
      module: 'Diagnostics',
      step: 2,
      message: `Bridge Implementor: RadiologyCenterProvider handling order ${order.orderNumber}`
    });
    return { trackingRef: `RAD-${order.orderNumber}`, estimatedTurnaround: 'Immediate (STAT)' };
  }
}

// Abstraction
export abstract class DiagnosticRequest {
  constructor(protected provider: DiagnosticProviderBridge) {}

  public setProvider(provider: DiagnosticProviderBridge) {
    this.provider = provider;
  }

  public getProviderName(): string {
    return this.provider.getProviderName();
  }

  abstract processRequest(order: LabOrder): Promise<{ requestType: string; result: any }>;
}

// Refined Abstraction 1: Blood & Hematology Diagnostic Request
export class BloodTestRequest extends DiagnosticRequest {
  async processRequest(order: LabOrder) {
    PatternTraceService.emit({
      pattern: 'Bridge',
      category: 'Structural',
      module: 'Diagnostics',
      step: 1,
      message: `Bridge Abstraction: BloodTestRequest bridged to ${this.provider.getProviderName()}`
    });
    const dispatchInfo = await this.provider.dispatch(order);
    return {
      requestType: 'Hematology / Blood Chemistry',
      result: dispatchInfo
    };
  }
}

// Refined Abstraction 2: X-Ray Radiography Diagnostic Request
export class XRayRequest extends DiagnosticRequest {
  async processRequest(order: LabOrder) {
    PatternTraceService.emit({
      pattern: 'Bridge',
      category: 'Structural',
      module: 'Diagnostics',
      step: 1,
      message: `Bridge Abstraction: XRayRequest bridged to ${this.provider.getProviderName()}`
    });
    const dispatchInfo = await this.provider.dispatch(order);
    return {
      requestType: 'Digital Radiography (X-Ray)',
      result: dispatchInfo
    };
  }
}

// Refined Abstraction 3: MRI / CT Cross-Sectional Imaging Request
export class MRIRequest extends DiagnosticRequest {
  async processRequest(order: LabOrder) {
    PatternTraceService.emit({
      pattern: 'Bridge',
      category: 'Structural',
      module: 'Diagnostics',
      step: 1,
      message: `Bridge Abstraction: MRIRequest bridged to ${this.provider.getProviderName()}`
    });
    const dispatchInfo = await this.provider.dispatch(order);
    return {
      requestType: 'Magnetic Resonance Imaging (MRI 3.0T)',
      result: dispatchInfo
    };
  }
}
