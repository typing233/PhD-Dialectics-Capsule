import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import { ResearchProject, DialogueMessage, ArgumentNode, Attack, DefenseQuestion, CrossDisciplinaryInsight, EvolutionTree, HeatmapData } from '../types';
import { aiService } from './aiService';

export class ProjectService {
  async createProject(title: string, description: string): Promise<ResearchProject> {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      'INSERT INTO projects (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, title, description || '', now, now]
    );

    return {
      id,
      title,
      description: description || '',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  async getProject(id: string): Promise<ResearchProject | null> {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM projects WHERE id = ?', [id]);
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async getAllProjects(): Promise<ResearchProject[]> {
    const db = getDatabase();
    const rows = await db.all('SELECT * FROM projects ORDER BY updated_at DESC');
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async updateProject(id: string, title?: string, description?: string): Promise<ResearchProject | null> {
    const db = getDatabase();
    const project = await this.getProject(id);
    if (!project) return null;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    updates.push('updated_at = ?');
    values.push(now, id);

    await db.run(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.getProject(id);
  }

  async deleteProject(id: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.run('DELETE FROM projects WHERE id = ?', [id]);
    return (result.changes || 0) > 0;
  }
}

export class DialogueService {
  async addMessage(
    projectId: string,
    role: 'user' | 'assistant',
    content: string,
    round?: number
  ): Promise<DialogueMessage> {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    if (round === undefined) {
      const maxRound = await db.get(
        'SELECT MAX(round) as max_round FROM dialogue_messages WHERE project_id = ?',
        [projectId]
      );
      round = (maxRound?.max_round || 0) + 1;
    }

    await db.run(
      'INSERT INTO dialogue_messages (id, project_id, role, content, timestamp, round) VALUES (?, ?, ?, ?, ?, ?)',
      [id, projectId, role, content, now, round]
    );

    return {
      id,
      projectId,
      role,
      content,
      timestamp: new Date(now),
      round,
    };
  }

  async getMessages(projectId: string): Promise<DialogueMessage[]> {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM dialogue_messages WHERE project_id = ? ORDER BY timestamp ASC',
      [projectId]
    );
    return rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      timestamp: new Date(row.timestamp),
      round: row.round,
    }));
  }

  async generateSocraticResponse(
    projectId: string,
    userMessage: string
  ): Promise<{ message: DialogueMessage; shouldUpdateTree: boolean }> {
    const messages = await this.getMessages(projectId);
    const previousQuestions = messages
      .filter(m => m.role === 'assistant')
      .map(m => m.content);

    const totalMessages = messages.length;
    let stage: 'initial' | 'deepening' | 'refining' = 'initial';
    if (totalMessages > 8) stage = 'refining';
    else if (totalMessages > 4) stage = 'deepening';

    const question = aiService.generateSocraticQuestion(
      userMessage,
      previousQuestions,
      stage
    );

    let response = question.question;
    if (stage === 'refining') {
      response += '\n\n💡 提示：你的论证已经逐步成型。考虑总结一下：' +
        '\n1. 核心假设是什么？' +
        '\n2. 关键证据有哪些？' +
        '\n3. 潜在的弱点在哪里？';
    }

    const shouldUpdateTree = totalMessages >= 2 && (totalMessages % 2 === 0);

    const message = await this.addMessage(projectId, 'assistant', response);
    return { message, shouldUpdateTree };
  }
}

export class ArgumentTreeService {
  async addNode(node: Omit<ArgumentNode, 'id' | 'createdAt' | 'version'>): Promise<ArgumentNode> {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const version = 1;

    await db.run(
      'INSERT INTO argument_nodes (id, project_id, parent_id, type, content, strength, vulnerability_score, created_at, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, node.projectId, node.parentId, node.type, node.content, node.strength, node.vulnerabilityScore, now, version]
    );

    return {
      id,
      projectId: node.projectId,
      parentId: node.parentId,
      type: node.type,
      content: node.content,
      strength: node.strength,
      vulnerabilityScore: node.vulnerabilityScore,
      createdAt: new Date(now),
      version,
    };
  }

  async getNodes(projectId: string): Promise<ArgumentNode[]> {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM argument_nodes WHERE project_id = ? ORDER BY created_at ASC',
      [projectId]
    );
    return rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      parentId: row.parent_id,
      type: row.type as ArgumentNode['type'],
      content: row.content,
      strength: row.strength,
      vulnerabilityScore: row.vulnerability_score,
      createdAt: new Date(row.created_at),
      version: row.version,
    }));
  }

  async updateNode(
    id: string,
    updates: Partial<Pick<ArgumentNode, 'content' | 'strength' | 'vulnerabilityScore' | 'type'>>
  ): Promise<ArgumentNode | null> {
    const db = getDatabase();
    const node = await this.getNodeById(id);
    if (!node) return null;

    const now = new Date().toISOString();
    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.content !== undefined) {
      updateFields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.strength !== undefined) {
      updateFields.push('strength = ?');
      values.push(updates.strength);
    }
    if (updates.vulnerabilityScore !== undefined) {
      updateFields.push('vulnerability_score = ?');
      values.push(updates.vulnerabilityScore);
    }
    if (updates.type !== undefined) {
      updateFields.push('type = ?');
      values.push(updates.type);
    }
    
    updateFields.push('version = version + 1');
    values.push(id);

    await db.run(`UPDATE argument_nodes SET ${updateFields.join(', ')} WHERE id = ?`, values);
    return this.getNodeById(id);
  }

  async getNodeById(id: string): Promise<ArgumentNode | null> {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM argument_nodes WHERE id = ?', [id]);
    if (!row) return null;

    return {
      id: row.id,
      projectId: row.project_id,
      parentId: row.parent_id,
      type: row.type as ArgumentNode['type'],
      content: row.content,
      strength: row.strength,
      vulnerabilityScore: row.vulnerability_score,
      createdAt: new Date(row.created_at),
      version: row.version,
    };
  }

  async buildEvolutionTree(projectId: string): Promise<EvolutionTree> {
    const nodes = await this.getNodes(projectId);
    
    const edges: EvolutionTree['edges'] = [];
    for (const node of nodes) {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) {
          edges.push({
            source: node.parentId,
            target: node.id,
            relation: this.getEdgeRelation(parent.type, node.type),
          });
        }
      }
    }

    const heatmap: HeatmapData[] = nodes.map((node, index) => ({
      nodeId: node.id,
      x: index % 5,
      y: Math.floor(index / 5),
      intensity: node.vulnerabilityScore,
    }));

    return {
      projectId,
      nodes,
      edges,
      heatmap,
    };
  }

  private getEdgeRelation(parentType: string, childType: string): string {
    const relations: Record<string, Record<string, string>> = {
      hypothesis: {
        assumption: '基于假设',
        evidence: '需要证据',
        counterargument: '受到质疑',
        refinement: '演变为',
      },
      assumption: {
        evidence: '需要验证',
        counterargument: '被挑战',
      },
      evidence: {
        refinement: '支持',
      },
      counterargument: {
        refinement: '促使修正',
      },
    };
    return relations[parentType]?.[childType] || '关联';
  }

  async updateTreeFromDialogue(projectId: string, messages: { role: string; content: string }[]): Promise<ArgumentNode[]> {
    const existingNodes = await this.getNodes(projectId);
    const extractedNodes = aiService.extractArgumentNodesFromDialogue(messages, projectId);
    
    const newNodes: ArgumentNode[] = [];
    
    for (const extracted of extractedNodes) {
      const exists = existingNodes.some(
        n => n.content.substring(0, 50) === extracted.content.substring(0, 50)
      );
      
      if (!exists) {
        if (newNodes.length > 0) {
          extracted.parentId = newNodes[newNodes.length - 1].id;
        }
        const node = await this.addNode(extracted);
        newNodes.push(node);
      }
    }

    return newNodes;
  }
}

export class DevilAdvocateService {
  async attackNode(nodeId: string): Promise<Attack[]> {
    const db = getDatabase();
    const treeService = new ArgumentTreeService();
    
    const node = await treeService.getNodeById(nodeId);
    if (!node) return [];

    const siblingNodes = await treeService.getNodes(node.projectId);
    
    const attacks = aiService.analyzeNodeForAttack(node, siblingNodes);
    const createdAttacks: Attack[] = [];

    for (const attack of attacks) {
      const id = uuidv4();
      const now = new Date().toISOString();

      await db.run(
        'INSERT INTO attacks (id, project_id, node_id, type, description, severity, suggestion, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, node.projectId, nodeId, attack.type, attack.description, attack.severity, attack.suggestion, now]
      );

      createdAttacks.push({
        ...attack,
        id,
        createdAt: new Date(now),
      });
    }

    return createdAttacks;
  }

  async attackProject(projectId: string): Promise<Attack[]> {
    const treeService = new ArgumentTreeService();
    const nodes = await treeService.getNodes(projectId);
    
    const allAttacks: Attack[] = [];
    for (const node of nodes) {
      const attacks = await this.attackNode(node.id);
      allAttacks.push(...attacks);
    }

    return allAttacks;
  }

  async getAttacks(nodeId: string): Promise<Attack[]> {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM attacks WHERE node_id = ? ORDER BY CASE severity WHEN "high" THEN 1 WHEN "medium" THEN 2 ELSE 3 END',
      [nodeId]
    );
    return rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      nodeId: row.node_id,
      type: row.type as Attack['type'],
      description: row.description,
      severity: row.severity as 'high' | 'medium' | 'low',
      suggestion: row.suggestion,
      createdAt: new Date(row.created_at),
    }));
  }

  async getAllProjectAttacks(projectId: string): Promise<Attack[]> {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM attacks WHERE project_id = ? ORDER BY CASE severity WHEN "high" THEN 1 WHEN "medium" THEN 2 ELSE 3 END',
      [projectId]
    );
    return rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      nodeId: row.node_id,
      type: row.type as Attack['type'],
      description: row.description,
      severity: row.severity as 'high' | 'medium' | 'low',
      suggestion: row.suggestion,
      createdAt: new Date(row.created_at),
    }));
  }
}

export class DefenseService {
  async generateQuestions(
    projectId: string,
    projectContext: string,
    categories?: string[]
  ): Promise<DefenseQuestion[]> {
    const db = getDatabase();
    
    const questionTemplates = aiService.generateDefenseQuestions(projectContext, categories);
    const questions: DefenseQuestion[] = [];

    for (const template of questionTemplates) {
      const id = uuidv4();
      const now = new Date().toISOString();

      await db.run(
        'INSERT INTO defense_questions (id, project_id, question, category, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, projectId, template.question, template.category, template.difficulty, now]
      );

      questions.push({
        id,
        projectId,
        question: template.question,
        category: template.category as DefenseQuestion['category'],
        difficulty: template.difficulty,
        createdAt: new Date(now),
      });
    }

    return questions;
  }

  async answerQuestion(
    questionId: string,
    answer: string,
    projectContext: string
  ): Promise<DefenseQuestion | null> {
    const db = getDatabase();
    
    const row = await db.get('SELECT * FROM defense_questions WHERE id = ?', [questionId]);
    if (!row) return null;

    const evaluation = aiService.evaluateDefenseAnswer(row.question, answer, projectContext);
    const evaluationJson = JSON.stringify(evaluation);

    await db.run(
      'UPDATE defense_questions SET user_answer = ?, evaluation = ? WHERE id = ?',
      [answer, evaluationJson, questionId]
    );

    return {
      id: row.id,
      projectId: row.project_id,
      question: row.question,
      category: row.category as DefenseQuestion['category'],
      difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
      userAnswer: answer,
      evaluation,
      createdAt: new Date(row.created_at),
    };
  }

  async getQuestions(projectId: string): Promise<DefenseQuestion[]> {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM defense_questions WHERE project_id = ? ORDER BY created_at ASC',
      [projectId]
    );
    return rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      question: row.question,
      category: row.category as DefenseQuestion['category'],
      difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
      userAnswer: row.user_answer || undefined,
      evaluation: row.evaluation ? JSON.parse(row.evaluation) : undefined,
      createdAt: new Date(row.created_at),
    }));
  }
}

export class CrossDisciplinaryService {
  async generateInsights(
    projectId: string,
    projectContext: string,
    researchField: string
  ): Promise<CrossDisciplinaryInsight[]> {
    const db = getDatabase();
    
    const insightTemplates = aiService.generateCrossDisciplinaryInsights(projectContext, researchField);
    const insights: CrossDisciplinaryInsight[] = [];

    for (const template of insightTemplates) {
      const id = uuidv4();
      const now = new Date().toISOString();

      await db.run(
        'INSERT INTO cross_disciplinary_insights (id, project_id, source_field, target_application, paradigm, methodology, relevance, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, projectId, template.sourceField, template.targetApplication, template.paradigm, template.methodology, template.relevance, now]
      );

      insights.push({
        id,
        projectId,
        sourceField: template.sourceField,
        targetApplication: template.targetApplication,
        paradigm: template.paradigm,
        methodology: template.methodology,
        relevance: template.relevance,
        createdAt: new Date(now),
      });
    }

    return insights;
  }

  async getInsights(projectId: string): Promise<CrossDisciplinaryInsight[]> {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM cross_disciplinary_insights WHERE project_id = ? ORDER BY relevance DESC',
      [projectId]
    );
    return rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      sourceField: row.source_field,
      targetApplication: row.target_application,
      paradigm: row.paradigm,
      methodology: row.methodology,
      relevance: row.relevance,
      createdAt: new Date(row.created_at),
    }));
  }
}
