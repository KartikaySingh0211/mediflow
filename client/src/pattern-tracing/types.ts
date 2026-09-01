export type PatternCategory = 'Creational' | 'Structural' | 'Behavioral';

export interface PatternTrace {
  id: string;
  pattern: string;
  category: PatternCategory;
  module: string;
  step: number;
  message: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export interface PatternDocumentation {
  id: string;
  name: string;
  category: PatternCategory;
  module: string;
  problem: string;
  solution: string;
  advantages: string[];
  filePath: string;
  trigger: string;
  participants: string[];
  codeExample: string;
  executionFlow: string[];
}
