import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import { 
  DialecticalTriad, 
  DialecticalNode, 
  DialecticalEdge, 
  DialecticalGraph,
  PromptTemplate
} from '../types';
import { DEFAULT_PROMPT_TEMPLATES } from './deepseekService';

export class DialecticsService {
  async createTriad(
    projectId: string,
    thesis: DialecticalTriad['thesis'],
    antithesis: DialecticalTriad['antithesis'],
    synthesis: DialecticalTriad['synthesis'],
    context: string
  ): Promise<DialecticalTriad> {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO dialectical_triads (
        id, project_id, 
        thesis_content, thesis_key_points, thesis_citations,
        antithesis_content, antithesis_key_points, antithesis_citations,
        synthesis_content, synthesis_key_points, synthesis_reconciled_points, synthesis_citations,
        context, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, projectId,
        thesis.content, JSON.stringify(thesis.keyPoints), thesis.citations ? JSON.stringify(thesis.citations) : null,
        antithesis.content, JSON.stringify(antithesis.keyPoints), antithesis.citations ? JSON.stringify(antithesis.citations) : null,
        synthesis.content, JSON.stringify(synthesis.keyPoints), JSON.stringify(synthesis.reconciledPoints), synthesis.citations ? JSON.stringify(synthesis.citations) : null,
        context, now
      ]
    );

    return {
      id,
      projectId,
      thesis,
      antithesis,
      synthesis,
      context,
      createdAt: new Date(now),
    };
  }

  async getTriad(id: string): Promise<DialecticalTriad | null> {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM dialectical_triads WHERE id = ?', [id]);
    if (!row) return null;

    return this.parseTriadRow(row);
  }

  async getProjectTriads(projectId: string): Promise<DialecticalTriad[]> {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM dialectical_triads WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );

    return rows.map(row => this.parseTriadRow(row));
  }

  private parseTriadRow(row: any): DialecticalTriad {
    return {
      id: row.id,
      projectId: row.project_id,
      thesis: {
        content: row.thesis_content,
        keyPoints: JSON.parse(row.thesis_key_points || '[]'),
        citations: row.thesis_citations ? JSON.parse(row.thesis_citations) : undefined,
      },
      antithesis: {
        content: row.antithesis_content,
        keyPoints: JSON.parse(row.antithesis_key_points || '[]'),
        citations: row.antithesis_citations ? JSON.parse(row.antithesis_citations) : undefined,
      },
      synthesis: {
        content: row.synthesis_content,
        keyPoints: JSON.parse(row.synthesis_key_points || '[]'),
        reconciledPoints: JSON.parse(row.synthesis_reconciled_points || '[]'),
        citations: row.synthesis_citations ? JSON.parse(row.synthesis_citations) : undefined,
      },
      context: row.context,
      createdAt: new Date(row.created_at),
    };
  }

  async createNode(
    node: Omit<DialecticalNode, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DialecticalNode> {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO dialectical_nodes (
        id, project_id, triad_id, parent_id, type, content, key_points, citations,
        position_x, position_y, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, node.projectId, node.triadId || null, node.parentId, node.type,
        node.content, JSON.stringify(node.keyPoints),
        node.citations ? JSON.stringify(node.citations) : null,
        node.position.x, node.position.y, now, now
      ]
    );

    return {
      ...node,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  async updateNode(
    id: string,
    updates: Partial<Pick<DialecticalNode, 'content' | 'keyPoints' | 'citations' | 'position' | 'parentId' | 'type'>>
  ): Promise<DialecticalNode | null> {
    const db = getDatabase();
    const node = await this.getNode(id);
    if (!node) return null;

    const now = new Date().toISOString();
    const updateFields: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (updates.content !== undefined) {
      updateFields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.keyPoints !== undefined) {
      updateFields.push('key_points = ?');
      values.push(JSON.stringify(updates.keyPoints));
    }
    if (updates.citations !== undefined) {
      updateFields.push('citations = ?');
      values.push(updates.citations ? JSON.stringify(updates.citations) : null);
    }
    if (updates.position !== undefined) {
      updateFields.push('position_x = ?', 'position_y = ?');
      values.push(updates.position.x, updates.position.y);
    }
    if (updates.parentId !== undefined) {
      updateFields.push('parent_id = ?');
      values.push(updates.parentId);
    }
    if (updates.type !== undefined) {
      updateFields.push('type = ?');
      values.push(updates.type);
    }

    values.push(id);

    await db.run(`UPDATE dialectical_nodes SET ${updateFields.join(', ')} WHERE id = ?`, values);
    return this.getNode(id);
  }

  async getNode(id: string): Promise<DialecticalNode | null> {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM dialectical_nodes WHERE id = ?', [id]);
    if (!row) return null;

    return this.parseNodeRow(row);
  }

  async getProjectNodes(projectId: string): Promise<DialecticalNode[]> {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM dialectical_nodes WHERE project_id = ? ORDER BY created_at ASC',
      [projectId]
    );

    return rows.map(row => this.parseNodeRow(row));
  }

  private parseNodeRow(row: any): DialecticalNode {
    return {
      id: row.id,
      projectId: row.project_id,
      triadId: row.triad_id || undefined,
      parentId: row.parent_id,
      type: row.type as DialecticalNode['type'],
      content: row.content,
      keyPoints: JSON.parse(row.key_points || '[]'),
      citations: row.citations ? JSON.parse(row.citations) : undefined,
      position: { x: row.position_x, y: row.position_y },
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async createEdge(
    projectId: string,
    sourceId: string,
    targetId: string,
    relation: DialecticalEdge['relation']
  ): Promise<DialecticalEdge> {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      'INSERT INTO dialectical_edges (id, project_id, source_id, target_id, relation, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, projectId, sourceId, targetId, relation, now]
    );

    return {
      id,
      projectId,
      sourceId,
      targetId,
      relation,
      createdAt: new Date(now),
    };
  }

  async deleteEdge(id: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.run('DELETE FROM dialectical_edges WHERE id = ?', [id]);
    return (result.changes || 0) > 0;
  }

  async getProjectEdges(projectId: string): Promise<DialecticalEdge[]> {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM dialectical_edges WHERE project_id = ?',
      [projectId]
    );

    return rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      sourceId: row.source_id,
      targetId: row.target_id,
      relation: row.relation as DialecticalEdge['relation'],
      createdAt: new Date(row.created_at),
    }));
  }

  async getProjectGraph(projectId: string): Promise<DialecticalGraph> {
    const [nodes, edges, triads] = await Promise.all([
      this.getProjectNodes(projectId),
      this.getProjectEdges(projectId),
      this.getProjectTriads(projectId),
    ]);

    return {
      projectId,
      nodes,
      edges,
      triads,
    };
  }

  async mergeBranches(
    projectId: string,
    sourceNodeId: string,
    targetNodeId: string,
    mergeType: 'reconcile' | 'synthesize'
  ): Promise<DialecticalNode> {
    const sourceNode = await this.getNode(sourceNodeId);
    const targetNode = await this.getNode(targetNodeId);

    if (!sourceNode || !targetNode) {
      throw new Error('节点不存在');
    }

    const mergedContent = `合并自分支 "${sourceNode.content}" 和 "${targetNode.content}"`;
    const mergedKeyPoints = [...new Set([...sourceNode.keyPoints, ...targetNode.keyPoints])];
    const mergedCitations = [...new Set([
      ...(sourceNode.citations || []),
      ...(targetNode.citations || []),
    ])];

    const existingNodes = await this.getProjectNodes(projectId);
    const maxX = Math.max(...existingNodes.map(n => n.position.x), 0);
    const maxY = Math.max(...existingNodes.map(n => n.position.y), 0);

    const mergedNode = await this.createNode({
      projectId,
      parentId: targetNodeId,
      type: 'synthesis',
      content: mergedContent,
      keyPoints: mergedKeyPoints,
      citations: mergedCitations.length > 0 ? mergedCitations : undefined,
      position: { x: maxX + 200, y: (sourceNode.position.y + targetNode.position.y) / 2 },
    });

    await this.createEdge(projectId, sourceNodeId, mergedNode.id, mergeType === 'reconcile' ? 'reconciles' : 'evolves_from');
    await this.createEdge(projectId, targetNodeId, mergedNode.id, mergeType === 'reconcile' ? 'reconciles' : 'evolves_from');

    return mergedNode;
  }

  async createBranch(
    projectId: string,
    parentNodeId: string,
    branchContent: string,
    branchType: DialecticalNode['type']
  ): Promise<DialecticalNode> {
    const parentNode = await this.getNode(parentNodeId);
    if (!parentNode) {
      throw new Error('父节点不存在');
    }

    const branchNode = await this.createNode({
      projectId,
      triadId: parentNode.triadId,
      parentId: parentNodeId,
      type: branchType,
      content: branchContent,
      keyPoints: [],
      position: { x: parentNode.position.x + 150, y: parentNode.position.y + 100 },
    });

    await this.createEdge(projectId, parentNodeId, branchNode.id, 'branches');

    return branchNode;
  }
}

export class PromptTemplateService {
  async initializeDefaultTemplates(): Promise<void> {
    const db = getDatabase();
    const existing = await db.get('SELECT COUNT(*) as count FROM prompt_templates WHERE is_default = 1');
    
    if (existing.count > 0) return;

    for (const template of DEFAULT_PROMPT_TEMPLATES) {
      const now = new Date().toISOString();
      await db.run(
        `INSERT INTO prompt_templates (
          id, name, category, system_prompt, user_prompt_template, 
          description, is_default, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          template.id, template.name, template.category,
          template.systemPrompt, template.userPromptTemplate,
          template.description, 1, now, now
        ]
      );
    }
  }

  async getAllTemplates(): Promise<PromptTemplate[]> {
    const db = getDatabase();
    const rows = await db.all('SELECT * FROM prompt_templates ORDER BY is_default DESC, created_at ASC');
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      systemPrompt: row.system_prompt,
      userPromptTemplate: row.user_prompt_template,
      description: row.description,
      isDefault: row.is_default === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async getTemplate(id: string): Promise<PromptTemplate | null> {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM prompt_templates WHERE id = ?', [id]);
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      category: row.category,
      systemPrompt: row.system_prompt,
      userPromptTemplate: row.user_prompt_template,
      description: row.description,
      isDefault: row.is_default === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async createTemplate(
    template: Omit<PromptTemplate, 'id' | 'isDefault' | 'createdAt' | 'updatedAt'>
  ): Promise<PromptTemplate> {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO prompt_templates (
        id, name, category, system_prompt, user_prompt_template, 
        description, is_default, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, template.name, template.category,
        template.systemPrompt, template.userPromptTemplate,
        template.description, 0, now, now
      ]
    );

    return {
      ...template,
      id,
      isDefault: false,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  async updateTemplate(
    id: string,
    updates: Partial<Pick<PromptTemplate, 'name' | 'category' | 'systemPrompt' | 'userPromptTemplate' | 'description'>>
  ): Promise<PromptTemplate | null> {
    const db = getDatabase();
    const template = await this.getTemplate(id);
    if (!template || template.isDefault) {
      return null;
    }

    const now = new Date().toISOString();
    const updateFields: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.category !== undefined) {
      updateFields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.systemPrompt !== undefined) {
      updateFields.push('system_prompt = ?');
      values.push(updates.systemPrompt);
    }
    if (updates.userPromptTemplate !== undefined) {
      updateFields.push('user_prompt_template = ?');
      values.push(updates.userPromptTemplate);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      values.push(updates.description);
    }

    values.push(id);

    await db.run(`UPDATE prompt_templates SET ${updateFields.join(', ')} WHERE id = ?`, values);
    return this.getTemplate(id);
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const db = getDatabase();
    const template = await this.getTemplate(id);
    if (!template || template.isDefault) {
      return false;
    }

    const result = await db.run('DELETE FROM prompt_templates WHERE id = ?', [id]);
    return (result.changes || 0) > 0;
  }
}
