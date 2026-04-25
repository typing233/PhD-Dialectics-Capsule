import type {
  ResearchProject,
  DialogueMessage,
  EvolutionTree,
  ArgumentNode,
  Attack,
  DefenseQuestion,
  CrossDisciplinaryInsight,
  PromptTemplate,
  DialecticalTriad,
  DialecticalGraph,
  DialecticalNode,
  DialecticalEdge,
  ExportConfig,
  ExportResult,
  ThesisContent,
  AntithesisContent,
  SynthesisContent,
} from './types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export const projectApi = {
  getAll: () => fetchJSON<ResearchProject[]>(`${API_BASE}/projects`),
  
  get: (id: string) => fetchJSON<ResearchProject>(`${API_BASE}/projects/${id}`),
  
  create: (title: string, description?: string) =>
    fetchJSON<ResearchProject>(`${API_BASE}/projects`, {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),
  
  update: (id: string, updates: { title?: string; description?: string }) =>
    fetchJSON<ResearchProject>(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  delete: (id: string) =>
    fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' }),
};

export const dialogueApi = {
  get: (projectId: string) =>
    fetchJSON<DialogueMessage[]>(`${API_BASE}/projects/${projectId}/dialogue`),
  
  send: (projectId: string, content: string) =>
    fetchJSON<{ userMessage: string; assistantMessage: DialogueMessage; treeUpdated: boolean }>(
      `${API_BASE}/projects/${projectId}/dialogue`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      }
    ),
};

export const treeApi = {
  get: (projectId: string) =>
    fetchJSON<EvolutionTree>(`${API_BASE}/projects/${projectId}/tree`),
  
  addNode: (projectId: string, node: Partial<ArgumentNode>) =>
    fetchJSON<ArgumentNode>(`${API_BASE}/projects/${projectId}/nodes`, {
      method: 'POST',
      body: JSON.stringify(node),
    }),
  
  updateNode: (nodeId: string, updates: Partial<ArgumentNode>) =>
    fetchJSON<ArgumentNode>(`${API_BASE}/nodes/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  syncTree: (projectId: string) =>
    fetchJSON<{ tree: EvolutionTree; newNodes: number }>(
      `${API_BASE}/projects/${projectId}/sync-tree`,
      { method: 'POST' }
    ),
};

export const devilAdvocateApi = {
  attackProject: (projectId: string) =>
    fetchJSON<{ attacks: Attack[]; count: number }>(
      `${API_BASE}/projects/${projectId}/attack`,
      { method: 'POST' }
    ),
  
  attackNode: (nodeId: string) =>
    fetchJSON<{ attacks: Attack[]; count: number }>(`${API_BASE}/nodes/${nodeId}/attack`, {
      method: 'POST',
    }),
  
  getForNode: (nodeId: string) =>
    fetchJSON<Attack[]>(`${API_BASE}/nodes/${nodeId}/attacks`),
  
  getForProject: (projectId: string) =>
    fetchJSON<Attack[]>(`${API_BASE}/projects/${projectId}/attacks`),
};

export const defenseApi = {
  generate: (projectId: string, context?: string, categories?: string[]) =>
    fetchJSON<DefenseQuestion[]>(`${API_BASE}/projects/${projectId}/defense/generate`, {
      method: 'POST',
      body: JSON.stringify({ context, categories }),
    }),
  
  get: (projectId: string) =>
    fetchJSON<DefenseQuestion[]>(`${API_BASE}/projects/${projectId}/defense`),
  
  answer: (questionId: string, answer: string, context?: string) =>
    fetchJSON<DefenseQuestion>(`${API_BASE}/defense/${questionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer, context }),
    }),
};

export const crossDisciplinaryApi = {
  generate: (projectId: string, context?: string, researchField?: string) =>
    fetchJSON<CrossDisciplinaryInsight[]>(`${API_BASE}/projects/${projectId}/cross-disciplinary`, {
      method: 'POST',
      body: JSON.stringify({ context, researchField }),
    }),
  
  get: (projectId: string) =>
    fetchJSON<CrossDisciplinaryInsight[]>(`${API_BASE}/projects/${projectId}/cross-disciplinary`),
};

export const promptTemplateApi = {
  getAll: () => fetchJSON<PromptTemplate[]>(`${API_BASE}/prompt-templates`),
  
  create: (template: Partial<PromptTemplate>) =>
    fetchJSON<PromptTemplate>(`${API_BASE}/prompt-templates`, {
      method: 'POST',
      body: JSON.stringify(template),
    }),
  
  update: (id: string, updates: Partial<PromptTemplate>) =>
    fetchJSON<PromptTemplate>(`${API_BASE}/prompt-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  delete: (id: string) =>
    fetch(`${API_BASE}/prompt-templates/${id}`, { method: 'DELETE' }),
};

export const dialecticsApi = {
  generateTriad: (projectId: string, topic: string, apiKey: string, existingThesis?: string) =>
    fetchJSON<{ triad: DialecticalTriad; graph: DialecticalGraph }>(
      `${API_BASE}/projects/${projectId}/dialectics/generate`,
      {
        method: 'POST',
        body: JSON.stringify({ topic, apiKey, existingThesis }),
      }
    ),
  
  generateThesis: (projectId: string, topic: string, apiKey: string) =>
    fetchJSON<ThesisContent>(`${API_BASE}/projects/${projectId}/dialectics/thesis`, {
      method: 'POST',
      body: JSON.stringify({ topic, apiKey }),
    }),
  
  generateAntithesis: (projectId: string, thesis: string, apiKey: string) =>
    fetchJSON<AntithesisContent>(`${API_BASE}/projects/${projectId}/dialectics/antithesis`, {
      method: 'POST',
      body: JSON.stringify({ thesis, apiKey }),
    }),
  
  generateSynthesis: (projectId: string, thesis: string, antithesis: string, apiKey: string) =>
    fetchJSON<SynthesisContent>(`${API_BASE}/projects/${projectId}/dialectics/synthesis`, {
      method: 'POST',
      body: JSON.stringify({ thesis, antithesis, apiKey }),
    }),
  
  getTriads: (projectId: string) =>
    fetchJSON<DialecticalTriad[]>(`${API_BASE}/projects/${projectId}/dialectics/triads`),
  
  getGraph: (projectId: string) =>
    fetchJSON<DialecticalGraph>(`${API_BASE}/projects/${projectId}/dialectics/graph`),
  
  updateNode: (nodeId: string, updates: Partial<DialecticalNode>) =>
    fetchJSON<DialecticalNode>(`${API_BASE}/dialectics/nodes/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  addNode: (projectId: string, node: Partial<DialecticalNode>) =>
    fetchJSON<DialecticalNode>(`${API_BASE}/projects/${projectId}/dialectics/nodes`, {
      method: 'POST',
      body: JSON.stringify(node),
    }),
  
  addEdge: (projectId: string, sourceId: string, targetId: string, relation: DialecticalEdge['relation']) =>
    fetchJSON<DialecticalEdge>(`${API_BASE}/projects/${projectId}/dialectics/edges`, {
      method: 'POST',
      body: JSON.stringify({ sourceId, targetId, relation }),
    }),
  
  deleteEdge: (edgeId: string) =>
    fetch(`${API_BASE}/dialectics/edges/${edgeId}`, { method: 'DELETE' }),
  
  mergeBranches: (projectId: string, sourceNodeId: string, targetNodeId: string, mergeType?: 'reconcile' | 'synthesize') =>
    fetchJSON<DialecticalNode>(`${API_BASE}/projects/${projectId}/dialectics/merge`, {
      method: 'POST',
      body: JSON.stringify({ sourceNodeId, targetNodeId, mergeType }),
    }),
  
  createBranch: (projectId: string, parentNodeId: string, branchContent: string, branchType?: DialecticalNode['type']) =>
    fetchJSON<DialecticalNode>(`${API_BASE}/projects/${projectId}/dialectics/branch`, {
      method: 'POST',
      body: JSON.stringify({ parentNodeId, branchContent, branchType }),
    }),
};

export const exportApi = {
  export: (projectId: string, config: ExportConfig) =>
    fetchJSON<ExportResult>(`${API_BASE}/projects/${projectId}/export`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),
};

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
