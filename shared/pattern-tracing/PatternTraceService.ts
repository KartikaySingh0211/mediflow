import { PatternTrace } from './types';

export class PatternTraceService {
  private static recentTraces: PatternTrace[] = [];

  static emit(trace: Omit<PatternTrace, 'id' | 'timestamp'> & { id?: string; timestamp?: Date }) {
    const fullTrace: PatternTrace = {
      id: trace.id || `trc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: trace.timestamp || new Date(),
      ...trace
    };

    PatternTraceService.recentTraces.unshift(fullTrace);
    if (PatternTraceService.recentTraces.length > 200) {
      PatternTraceService.recentTraces.pop();
    }

    if (typeof window !== 'undefined') {
      const event = new CustomEvent('pattern-trace', {
        detail: fullTrace
      });
      window.dispatchEvent(event);
    }

    console.log(`[Pattern Trace | ${fullTrace.category}] ${fullTrace.pattern} (Step ${fullTrace.step}): ${fullTrace.message}`);
    return fullTrace;
  }

  static getRecentTraces(): PatternTrace[] {
    return [...PatternTraceService.recentTraces];
  }

  static clearTraces() {
    PatternTraceService.recentTraces = [];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pattern-trace-clear'));
    }
  }
}
