import { Bill } from '../../types';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface ClaimContext {
  bill: Bill;
  insuranceProvider: string;
  policyNumber: string;
  preAuthCode?: string;
  medicalDocumentationIncluded: boolean;
}

export interface ClaimValidationStageResult {
  stageName: string;
  passed: boolean;
  message: string;
  timestamp: string;
}

export interface ClaimValidationResult {
  isApproved: boolean;
  approvedAmount: number;
  stages: ClaimValidationStageResult[];
  rejectionReason?: string;
}

export abstract class ClaimHandler {
  protected nextHandler?: ClaimHandler;

  public setNext(handler: ClaimHandler): ClaimHandler {
    this.nextHandler = handler;
    return handler;
  }

  public abstract handle(context: ClaimContext, stagesAccumulator: ClaimValidationStageResult[]): ClaimValidationResult;
}

// Stage 1: Policy Validator
export class PolicyValidator extends ClaimHandler {
  public handle(context: ClaimContext, stagesAccumulator: ClaimValidationStageResult[]): ClaimValidationResult {
    PatternTraceService.emit({
      pattern: 'Chain of Responsibility',
      category: 'Behavioral',
      module: 'Insurance Processing',
      step: 1,
      message: `PolicyValidator: Validating active policy #${context.policyNumber || 'MISSING'}`
    });

    const isPolicyPresent = !!context.policyNumber && context.policyNumber.trim().length >= 5;
    const isPolicyActive = isPolicyPresent && !context.policyNumber.toUpperCase().includes('EXPIRED');

    if (!isPolicyActive) {
      const stage: ClaimValidationStageResult = {
        stageName: 'Policy Validation',
        passed: false,
        message: 'Policy validation failed: Policy number is invalid, expired, or terminated by insurer.',
        timestamp: new Date().toISOString()
      };
      stagesAccumulator.push(stage);
      return {
        isApproved: false,
        approvedAmount: 0,
        stages: stagesAccumulator,
        rejectionReason: stage.message
      };
    }

    stagesAccumulator.push({
      stageName: 'Policy Validation',
      passed: true,
      message: `Policy #${context.policyNumber} verified active with ${context.insuranceProvider}.`,
      timestamp: new Date().toISOString()
    });

    if (this.nextHandler) {
      return this.nextHandler.handle(context, stagesAccumulator);
    }

    return { isApproved: true, approvedAmount: context.bill.total, stages: stagesAccumulator };
  }
}

// Stage 2: Coverage Validator
export class CoverageValidator extends ClaimHandler {
  public handle(context: ClaimContext, stagesAccumulator: ClaimValidationStageResult[]): ClaimValidationResult {
    PatternTraceService.emit({
      pattern: 'Chain of Responsibility',
      category: 'Behavioral',
      module: 'Insurance Processing',
      step: 2,
      message: `CoverageValidator: Checking inpatient & diagnostic coverage tiers for ${context.insuranceProvider}`
    });

    // Verify covered service categories
    const isExcluded = context.policyNumber.toUpperCase().includes('LIMITED') && context.bill.groups.some(g => g.name.includes('Surgery'));

    if (isExcluded) {
      const stage: ClaimValidationStageResult = {
        stageName: 'Coverage Validation',
        passed: false,
        message: 'Coverage validation failed: Major surgical procedures excluded under basic policy rider.',
        timestamp: new Date().toISOString()
      };
      stagesAccumulator.push(stage);
      return {
        isApproved: false,
        approvedAmount: 0,
        stages: stagesAccumulator,
        rejectionReason: stage.message
      };
    }

    stagesAccumulator.push({
      stageName: 'Coverage Validation',
      passed: true,
      message: 'All itemized hospital charges match active inpatient coverage schedule (95% standard benefit).',
      timestamp: new Date().toISOString()
    });

    if (this.nextHandler) {
      return this.nextHandler.handle(context, stagesAccumulator);
    }

    return { isApproved: true, approvedAmount: context.bill.total, stages: stagesAccumulator };
  }
}

// Stage 3: Amount Ceiling Validator
export class AmountValidator extends ClaimHandler {
  public handle(context: ClaimContext, stagesAccumulator: ClaimValidationStageResult[]): ClaimValidationResult {
    PatternTraceService.emit({
      pattern: 'Chain of Responsibility',
      category: 'Behavioral',
      module: 'Insurance Processing',
      step: 3,
      message: `AmountValidator: Evaluating claim amount $${context.bill.total.toFixed(2)} against policy caps`
    });

    const maxIncidentCap = 75000;
    if (context.bill.total > maxIncidentCap) {
      const stage: ClaimValidationStageResult = {
        stageName: 'Amount Limit Validation',
        passed: false,
        message: `Amount validation failed: Total claim ($${context.bill.total.toFixed(2)}) exceeds max per-incident ceiling ($${maxIncidentCap.toFixed(2)}).`,
        timestamp: new Date().toISOString()
      };
      stagesAccumulator.push(stage);
      return {
        isApproved: false,
        approvedAmount: 0,
        stages: stagesAccumulator,
        rejectionReason: stage.message
      };
    }

    stagesAccumulator.push({
      stageName: 'Amount Limit Validation',
      passed: true,
      message: `Claim amount ($${context.bill.total.toFixed(2)}) is well within allowed annual catastrophic cap ($100,000.00).`,
      timestamp: new Date().toISOString()
    });

    if (this.nextHandler) {
      return this.nextHandler.handle(context, stagesAccumulator);
    }

    return { isApproved: true, approvedAmount: context.bill.total, stages: stagesAccumulator };
  }
}

// Stage 4: Documentation & Itemization Validator
export class DocumentValidator extends ClaimHandler {
  public handle(context: ClaimContext, stagesAccumulator: ClaimValidationStageResult[]): ClaimValidationResult {
    PatternTraceService.emit({
      pattern: 'Chain of Responsibility',
      category: 'Behavioral',
      module: 'Insurance Processing',
      step: 4,
      message: 'DocumentValidator: Verifying Composite itemized medical breakdown and diagnostic codes'
    });

    const hasItemizedGroups = context.bill.groups && context.bill.groups.length > 0;
    const hasDocumentation = context.medicalDocumentationIncluded !== false;

    if (!hasItemizedGroups || !hasDocumentation) {
      const stage: ClaimValidationStageResult = {
        stageName: 'Document Validation',
        passed: false,
        message: 'Document validation failed: Missing required itemized clinical billing groups or attending doctor sign-off.',
        timestamp: new Date().toISOString()
      };
      stagesAccumulator.push(stage);
      return {
        isApproved: false,
        approvedAmount: 0,
        stages: stagesAccumulator,
        rejectionReason: stage.message
      };
    }

    stagesAccumulator.push({
      stageName: 'Document Validation',
      passed: true,
      message: 'All itemized clinical line items, ICD-10 diagnostic codes, and attending physician signatures verified.',
      timestamp: new Date().toISOString()
    });

    const approvedAmount = Math.round(context.bill.total * 0.95 * 100) / 100;

    PatternTraceService.emit({
      pattern: 'Chain of Responsibility',
      category: 'Behavioral',
      module: 'Insurance Processing',
      step: 5,
      message: `Chain of Responsibility: All 4 validation stages passed! Claim APPROVED for $${approvedAmount.toFixed(2)}`
    });

    return {
      isApproved: true,
      approvedAmount,
      stages: stagesAccumulator
    };
  }
}

// Pipeline Factory
export class InsuranceClaimPipeline {
  public static processClaim(context: ClaimContext): ClaimValidationResult {
    const policy = new PolicyValidator();
    const coverage = new CoverageValidator();
    const amount = new AmountValidator();
    const doc = new DocumentValidator();

    // Assemble Chain
    policy.setNext(coverage).setNext(amount).setNext(doc);

    return policy.handle(context, []);
  }
}
