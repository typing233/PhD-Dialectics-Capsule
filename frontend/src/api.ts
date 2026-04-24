import type {
  ResearchProject,
  DialogueMessage,
  EvolutionTree,
  ArgumentNode,
  Attack,
  DefenseQuestion,
  CrossDisciplinaryInsight,
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
