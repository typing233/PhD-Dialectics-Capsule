export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DialogueMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  round: number;
}

export interface ArgumentNode {
  id: string;
  projectId: string;
  parentId: string | null;
  type: 'hypothesis' | 'assumption' | 'evidence' | 'counterargument' | 'refinement';
  content: string;
  strength: number;
  vulnerabilityScore: number;
  createdAt: Date;
  version: number;
}

export interface Attack {
  id: string;
  projectId: string;
  nodeId: string;
  type: 'logical_fallacy' | 'evidence_gap' | 'assumption_weakness' | 'methodological_flaw' | 'alternative_explanation';
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
  createdAt: Date;
}

export interface DefenseQuestion {
  id: string;
  projectId: string;
  question: string;
  category: 'methodology' | 'literature' | 'assumptions' | 'contribution' | 'future_work';
  difficulty: 'easy' | 'medium' | 'hard';
  userAnswer?: string;
  evaluation?: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  createdAt: Date;
}

export interface CrossDisciplinaryInsight {
  id: string;
  projectId: string;
  sourceField: string;
  targetApplication: string;
  paradigm: string;
  methodology: string;
  relevance: number;
  createdAt: Date;
}

export interface HeatmapData {
  nodeId: string;
  x: number;
  y: number;
  intensity: number;
}

export interface EvolutionTree {
  projectId: string;
  nodes: ArgumentNode[];
  edges: { source: string; target: string; relation: string }[];
  heatmap: HeatmapData[];
}

export interface SocraticQuestion {
  question: string;
  purpose: string;
  category: 'clarification' | 'assumption' | 'evidence' | 'implication' | 'perspective';
}
