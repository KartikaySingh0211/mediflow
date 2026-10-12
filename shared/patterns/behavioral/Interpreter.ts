import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export type RuleContext = Record<string, number | string>;

export interface Expression {
  interpret(context: RuleContext): boolean;
  explain(): string;
}

// Terminal Expression 1: Greater Than
export class GreaterThanExpression implements Expression {
  constructor(private field: string, private threshold: number) {}

  interpret(context: RuleContext): boolean {
    const val = Number(context[this.field]) || 0;
    const match = val > this.threshold;
    if (match) {
      PatternTraceService.emit({
        pattern: 'Interpreter',
        category: 'Behavioral',
        module: 'Clinical Rule Engine',
        step: 1,
        message: `Interpreter: Condition (${this.field}=${val} > ${this.threshold}) evaluated TRUE`
      });
    }
    return match;
  }

  explain(): string {
    return `${this.field} > ${this.threshold}`;
  }
}

// Terminal Expression 2: Less Than
export class LessThanExpression implements Expression {
  constructor(private field: string, private threshold: number) {}

  interpret(context: RuleContext): boolean {
    const val = Number(context[this.field]) || 0;
    const match = val < this.threshold;
    if (match) {
      PatternTraceService.emit({
        pattern: 'Interpreter',
        category: 'Behavioral',
        module: 'Clinical Rule Engine',
        step: 1,
        message: `Interpreter: Condition (${this.field}=${val} < ${this.threshold}) evaluated TRUE`
      });
    }
    return match;
  }

  explain(): string {
    return `${this.field} < ${this.threshold}`;
  }
}

// Terminal Expression 3: Equals
export class EqualsExpression implements Expression {
  constructor(private field: string, private targetValue: string | number) {}

  interpret(context: RuleContext): boolean {
    const val = context[this.field];
    const match = String(val).toLowerCase() === String(this.targetValue).toLowerCase();
    if (match) {
      PatternTraceService.emit({
        pattern: 'Interpreter',
        category: 'Behavioral',
        module: 'Clinical Rule Engine',
        step: 1,
        message: `Interpreter: Condition (${this.field}=${val} == ${this.targetValue}) evaluated TRUE`
      });
    }
    return match;
  }

  explain(): string {
    return `${this.field} == ${this.targetValue}`;
  }
}

// Non-Terminal Expression: AND Expression
export class AndExpression implements Expression {
  constructor(private expr1: Expression, private expr2: Expression) {}

  interpret(context: RuleContext): boolean {
    const res1 = this.expr1.interpret(context);
    const res2 = this.expr2.interpret(context);
    const match = res1 && res2;
    if (match) {
      PatternTraceService.emit({
        pattern: 'Interpreter',
        category: 'Behavioral',
        module: 'Clinical Rule Engine',
        step: 2,
        message: `Interpreter: Compound AND expression (${this.explain()}) satisfied`
      });
    }
    return match;
  }

  explain(): string {
    return `(${this.expr1.explain()} AND ${this.expr2.explain()})`;
  }
}

// Non-Terminal Expression: OR Expression
export class OrExpression implements Expression {
  constructor(private expr1: Expression, private expr2: Expression) {}

  interpret(context: RuleContext): boolean {
    const res1 = this.expr1.interpret(context);
    const res2 = this.expr2.interpret(context);
    return res1 || res2;
  }

  explain(): string {
    return `(${this.expr1.explain()} OR ${this.expr2.explain()})`;
  }
}

// Expression Parser Helper
export class ClinicalRuleParser {
  static parse(field: string, operator: string, value: number | string): Expression {
    switch (operator) {
      case '>':
        return new GreaterThanExpression(field, Number(value));
      case '<':
        return new LessThanExpression(field, Number(value));
      case '>=':
        return new OrExpression(
          new GreaterThanExpression(field, Number(value)),
          new EqualsExpression(field, value)
        );
      case '<=':
        return new OrExpression(
          new LessThanExpression(field, Number(value)),
          new EqualsExpression(field, value)
        );
      case '==':
      default:
        return new EqualsExpression(field, value);
    }
  }
}
