export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface DialogueMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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
  createdAt: string;
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
  createdAt: string;
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
  createdAt: string;
}

export interface CrossDisciplinaryInsight {
  id: string;
  projectId: string;
  sourceField: string;
  targetApplication: string;
  paradigm: string;
  methodology: string;
  relevance: number;
  createdAt: string;
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

export interface AppContext {
  currentProject: ResearchProject | null;
  setCurrentProject: (project: ResearchProject | null) => void;
  messages: DialogueMessage[];
  setMessages: React.Dispatch<React.SetStateAction<DialogueMessage[]>>;
  tree: EvolutionTree | null;
  setTree: React.Dispatch<React.SetStateAction<EvolutionTree | null>>;
  attacks: Attack[];
  setAttacks: React.Dispatch<React.SetStateAction<Attack[]>>;
  refreshData: () => Promise<void>;
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  systemPrompt: string;
  userPromptTemplate: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ThesisContent {
  content: string;
  keyPoints: string[];
  citations?: string[];
}

export interface AntithesisContent {
  content: string;
  keyPoints: string[];
  citations?: string[];
}

export interface SynthesisContent {
  content: string;
  keyPoints: string[];
  reconciledPoints: string[];
  citations?: string[];
}

export interface DialecticalTriad {
  id: string;
  projectId: string;
  thesis: ThesisContent;
  antithesis: AntithesisContent;
  synthesis: SynthesisContent;
  context: string;
  createdAt: string;
}

export interface DialecticalNode {
  id: string;
  projectId: string;
  triadId?: string;
  parentId: string | null;
  type: 'thesis' | 'antithesis' | 'synthesis' | 'branch';
  content: string;
  keyPoints: string[];
  citations?: string[];
  position: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
}

export interface DialecticalEdge {
  id: string;
  projectId: string;
  sourceId: string;
  targetId: string;
  relation: 'supports' | 'challenges' | 'evolves_from' | 'reconciles' | 'branches';
  createdAt: string;
}

export interface DialecticalGraph {
  projectId: string;
  nodes: DialecticalNode[];
  edges: DialecticalEdge[];
  triads: DialecticalTriad[];
}

export interface ExportConfig {
  format: 'markdown' | 'latex';
  includeCitations: boolean;
  includeGraphVisualization: boolean;
  includeConclusions: boolean;
}

export interface ExportResult {
  content: string;
  format: string;
  filename: string;
}

export interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}
