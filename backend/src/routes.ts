import { Router, Request, Response } from 'express';
import { 
  ProjectService, 
  DialogueService, 
  ArgumentTreeService, 
  DevilAdvocateService,
  DefenseService,
  CrossDisciplinaryService
} from './services';
import { aiService } from './services/aiService';
import { deepseekService, DEFAULT_PROMPT_TEMPLATES } from './services/deepseekService';
import { DialecticsService, PromptTemplateService } from './services/dialecticsService';
import { exportService } from './services/exportService';
import type { ExportConfig } from './types';

const router = Router();
const projectService = new ProjectService();
const dialogueService = new DialogueService();
const treeService = new ArgumentTreeService();
const devilAdvocateService = new DevilAdvocateService();
const defenseService = new DefenseService();
const crossDisciplinaryService = new CrossDisciplinaryService();
const dialecticsService = new DialecticsService();
const promptTemplateService = new PromptTemplateService();

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/projects', async (req: Request, res: Response) => {
  try {
    const projects = await projectService.getAllProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/projects/:id', async (req: Request, res: Response) => {
  try {
    const project = await projectService.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.post('/projects', async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const project = await projectService.createProject(title, description || '');
    
    const openingMessage = aiService.generateOpeningResponse();
    await dialogueService.addMessage(project.id, 'assistant', openingMessage, 1);
    
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.put('/projects/:id', async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    const project = await projectService.updateProject(req.params.id, title, description);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/projects/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await projectService.deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

router.get('/projects/:id/dialogue', async (req: Request, res: Response) => {
  try {
    const messages = await dialogueService.getMessages(req.params.id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dialogue' });
  }
});

router.post('/projects/:id/dialogue', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const projectId = req.params.id;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    await dialogueService.addMessage(projectId, 'user', content);
    
    const { message: assistantMessage, shouldUpdateTree } = await dialogueService.generateSocraticResponse(
      projectId,
      content
    );

    if (shouldUpdateTree) {
      const messages = await dialogueService.getMessages(projectId);
      const formattedMessages = messages.map(m => ({ role: m.role, content: m.content }));
      await treeService.updateTreeFromDialogue(projectId, formattedMessages);
    }

    res.json({ 
      userMessage: content,
      assistantMessage,
      treeUpdated: shouldUpdateTree
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process message' });
  }
});

router.get('/projects/:id/tree', async (req: Request, res: Response) => {
  try {
    const tree = await treeService.buildEvolutionTree(req.params.id);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch argument tree' });
  }
});

router.post('/projects/:id/nodes', async (req: Request, res: Response) => {
  try {
    const { parentId, type, content, strength, vulnerabilityScore } = req.body;
    const projectId = req.params.id;
    
    if (!content || !type) {
      return res.status(400).json({ error: 'Content and type are required' });
    }
    
    const node = await treeService.addNode({
      projectId,
      parentId: parentId || null,
      type,
      content,
      strength: strength ?? 0.5,
      vulnerabilityScore: vulnerabilityScore ?? 0.3,
    });
    
    res.status(201).json(node);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create node' });
  }
});

router.put('/nodes/:id', async (req: Request, res: Response) => {
  try {
    const { content, strength, vulnerabilityScore, type } = req.body;
    const node = await treeService.updateNode(req.params.id, {
      content,
      strength,
      vulnerabilityScore,
      type,
    });
    
    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    res.json(node);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update node' });
  }
});

router.post('/projects/:id/attack', async (req: Request, res: Response) => {
  try {
    const attacks = await devilAdvocateService.attackProject(req.params.id);
    res.json({ attacks, count: attacks.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run devil advocate attack' });
  }
});

router.post('/nodes/:id/attack', async (req: Request, res: Response) => {
  try {
    const attacks = await devilAdvocateService.attackNode(req.params.id);
    res.json({ attacks, count: attacks.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to attack node' });
  }
});

router.get('/nodes/:id/attacks', async (req: Request, res: Response) => {
  try {
    const attacks = await devilAdvocateService.getAttacks(req.params.id);
    res.json(attacks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attacks' });
  }
});

router.get('/projects/:id/attacks', async (req: Request, res: Response) => {
  try {
    const attacks = await devilAdvocateService.getAllProjectAttacks(req.params.id);
    res.json(attacks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project attacks' });
  }
});

router.post('/projects/:id/defense/generate', async (req: Request, res: Response) => {
  try {
    const { context, categories } = req.body;
    const projectId = req.params.id;
    
    const questions = await defenseService.generateQuestions(
      projectId,
      context || '',
      categories
    );
    
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate defense questions' });
  }
});

router.get('/projects/:id/defense', async (req: Request, res: Response) => {
  try {
    const questions = await defenseService.getQuestions(req.params.id);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch defense questions' });
  }
});

router.post('/defense/:id/answer', async (req: Request, res: Response) => {
  try {
    const { answer, context } = req.body;
    
    if (!answer) {
      return res.status(400).json({ error: 'Answer is required' });
    }
    
    const question = await defenseService.answerQuestion(
      req.params.id,
      answer,
      context || ''
    );
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

router.post('/projects/:id/cross-disciplinary', async (req: Request, res: Response) => {
  try {
    const { context, researchField } = req.body;
    const projectId = req.params.id;
    
    const insights = await crossDisciplinaryService.generateInsights(
      projectId,
      context || '',
      researchField || 'general'
    );
    
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate cross-disciplinary insights' });
  }
});

router.get('/projects/:id/cross-disciplinary', async (req: Request, res: Response) => {
  try {
    const insights = await crossDisciplinaryService.getInsights(req.params.id);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

router.post('/projects/:id/sync-tree', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const messages = await dialogueService.getMessages(projectId);
    const formattedMessages = messages.map(m => ({ role: m.role, content: m.content }));
    
    const newNodes = await treeService.updateTreeFromDialogue(projectId, formattedMessages);
    const tree = await treeService.buildEvolutionTree(projectId);
    
    res.json({ tree, newNodes: newNodes.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync tree' });
  }
});

router.get('/prompt-templates', async (req: Request, res: Response) => {
  try {
    await promptTemplateService.initializeDefaultTemplates();
    const templates = await promptTemplateService.getAllTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prompt templates' });
  }
});

router.post('/prompt-templates', async (req: Request, res: Response) => {
  try {
    const { name, category, systemPrompt, userPromptTemplate, description } = req.body;
    
    if (!name || !systemPrompt || !userPromptTemplate) {
      return res.status(400).json({ error: 'Name, systemPrompt and userPromptTemplate are required' });
    }

    const template = await promptTemplateService.createTemplate({
      name,
      category: category || 'custom',
      systemPrompt,
      userPromptTemplate,
      description: description || '',
    });
    
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create prompt template' });
  }
});

router.put('/prompt-templates/:id', async (req: Request, res: Response) => {
  try {
    const { name, category, systemPrompt, userPromptTemplate, description } = req.body;
    const template = await promptTemplateService.updateTemplate(req.params.id, {
      name,
      category,
      systemPrompt,
      userPromptTemplate,
      description,
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found or cannot modify default template' });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update prompt template' });
  }
});

router.delete('/prompt-templates/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await promptTemplateService.deleteTemplate(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Template not found or cannot delete default template' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete prompt template' });
  }
});

router.post('/projects/:id/dialectics/generate', async (req: Request, res: Response) => {
  try {
    const { topic, apiKey, existingThesis } = req.body;
    const projectId = req.params.id;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'API Key is required. Please configure your DeepSeek API Key in settings.' });
    }

    const triadData = await deepseekService.generateDialecticalTriad(topic, apiKey, existingThesis);
    
    const triad = await dialecticsService.createTriad(
      projectId,
      triadData.thesis,
      triadData.antithesis,
      triadData.synthesis,
      topic
    );

    const existingNodes = await dialecticsService.getProjectNodes(projectId);
    const baseX = existingNodes.length > 0 ? Math.max(...existingNodes.map(n => n.position.x)) + 300 : 100;
    const baseY = 100;

    const thesisNode = await dialecticsService.createNode({
      projectId,
      triadId: triad.id,
      parentId: null,
      type: 'thesis',
      content: triad.thesis.content,
      keyPoints: triad.thesis.keyPoints,
      citations: triad.thesis.citations,
      position: { x: baseX, y: baseY },
    });

    const antithesisNode = await dialecticsService.createNode({
      projectId,
      triadId: triad.id,
      parentId: null,
      type: 'antithesis',
      content: triad.antithesis.content,
      keyPoints: triad.antithesis.keyPoints,
      citations: triad.antithesis.citations,
      position: { x: baseX, y: baseY + 150 },
    });

    const synthesisNode = await dialecticsService.createNode({
      projectId,
      triadId: triad.id,
      parentId: null,
      type: 'synthesis',
      content: triad.synthesis.content,
      keyPoints: triad.synthesis.keyPoints,
      citations: triad.synthesis.citations,
      position: { x: baseX + 250, y: baseY + 75 },
    });

    await dialecticsService.createEdge(projectId, thesisNode.id, synthesisNode.id, 'evolves_from');
    await dialecticsService.createEdge(projectId, antithesisNode.id, synthesisNode.id, 'reconciles');

    const graph = await dialecticsService.getProjectGraph(projectId);
    
    res.json({ triad, graph });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate dialectical triad';
    res.status(500).json({ error: message });
  }
});

router.post('/projects/:id/dialectics/thesis', async (req: Request, res: Response) => {
  try {
    const { topic, apiKey } = req.body;
    
    if (!topic || !apiKey) {
      return res.status(400).json({ error: 'Topic and API Key are required' });
    }

    const thesis = await deepseekService.generateThesis(topic, apiKey);
    res.json(thesis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate thesis';
    res.status(500).json({ error: message });
  }
});

router.post('/projects/:id/dialectics/antithesis', async (req: Request, res: Response) => {
  try {
    const { thesis, apiKey } = req.body;
    
    if (!thesis || !apiKey) {
      return res.status(400).json({ error: 'Thesis and API Key are required' });
    }

    const antithesis = await deepseekService.generateAntithesis(thesis, apiKey);
    res.json(antithesis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate antithesis';
    res.status(500).json({ error: message });
  }
});

router.post('/projects/:id/dialectics/synthesis', async (req: Request, res: Response) => {
  try {
    const { thesis, antithesis, apiKey } = req.body;
    
    if (!thesis || !antithesis || !apiKey) {
      return res.status(400).json({ error: 'Thesis, antithesis and API Key are required' });
    }

    const synthesis = await deepseekService.generateSynthesis(thesis, antithesis, apiKey);
    res.json(synthesis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate synthesis';
    res.status(500).json({ error: message });
  }
});

router.get('/projects/:id/dialectics/triads', async (req: Request, res: Response) => {
  try {
    const triads = await dialecticsService.getProjectTriads(req.params.id);
    res.json(triads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch triads' });
  }
});

router.get('/projects/:id/dialectics/graph', async (req: Request, res: Response) => {
  try {
    const graph = await dialecticsService.getProjectGraph(req.params.id);
    res.json(graph);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dialectical graph' });
  }
});

router.put('/dialectics/nodes/:id', async (req: Request, res: Response) => {
  try {
    const { content, keyPoints, citations, position, parentId, type } = req.body;
    
    const updates: any = {};
    if (content !== undefined) updates.content = content;
    if (keyPoints !== undefined) updates.keyPoints = keyPoints;
    if (citations !== undefined) updates.citations = citations;
    if (position !== undefined) updates.position = position;
    if (parentId !== undefined) updates.parentId = parentId;
    if (type !== undefined) updates.type = type;

    const node = await dialecticsService.updateNode(req.params.id, updates);
    
    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    res.json(node);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update node' });
  }
});

router.post('/projects/:id/dialectics/nodes', async (req: Request, res: Response) => {
  try {
    const { triadId, parentId, type, content, keyPoints, citations, position } = req.body;
    const projectId = req.params.id;
    
    if (!content || !type) {
      return res.status(400).json({ error: 'Content and type are required' });
    }

    const existingNodes = await dialecticsService.getProjectNodes(projectId);
    const defaultPosition = position || {
      x: existingNodes.length > 0 ? Math.max(...existingNodes.map(n => n.position.x)) + 150 : 100,
      y: 100 + existingNodes.length * 50,
    };

    const node = await dialecticsService.createNode({
      projectId,
      triadId: triadId || undefined,
      parentId: parentId || null,
      type,
      content,
      keyPoints: keyPoints || [],
      citations,
      position: defaultPosition,
    });
    
    res.status(201).json(node);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create node' });
  }
});

router.post('/projects/:id/dialectics/edges', async (req: Request, res: Response) => {
  try {
    const { sourceId, targetId, relation } = req.body;
    const projectId = req.params.id;
    
    if (!sourceId || !targetId || !relation) {
      return res.status(400).json({ error: 'SourceId, targetId and relation are required' });
    }

    const edge = await dialecticsService.createEdge(projectId, sourceId, targetId, relation);
    res.status(201).json(edge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create edge' });
  }
});

router.delete('/dialectics/edges/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await dialecticsService.deleteEdge(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Edge not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete edge' });
  }
});

router.post('/projects/:id/dialectics/merge', async (req: Request, res: Response) => {
  try {
    const { sourceNodeId, targetNodeId, mergeType } = req.body;
    const projectId = req.params.id;
    
    if (!sourceNodeId || !targetNodeId) {
      return res.status(400).json({ error: 'SourceNodeId and targetNodeId are required' });
    }

    const mergedNode = await dialecticsService.mergeBranches(
      projectId,
      sourceNodeId,
      targetNodeId,
      mergeType || 'synthesize'
    );
    
    res.json(mergedNode);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to merge branches';
    res.status(500).json({ error: message });
  }
});

router.post('/projects/:id/dialectics/branch', async (req: Request, res: Response) => {
  try {
    const { parentNodeId, branchContent, branchType } = req.body;
    const projectId = req.params.id;
    
    if (!parentNodeId || !branchContent) {
      return res.status(400).json({ error: 'ParentNodeId and branchContent are required' });
    }

    const branchNode = await dialecticsService.createBranch(
      projectId,
      parentNodeId,
      branchContent,
      branchType || 'branch'
    );
    
    res.status(201).json(branchNode);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create branch';
    res.status(500).json({ error: message });
  }
});

router.post('/projects/:id/export', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const config: ExportConfig = {
      format: req.body.format || 'markdown',
      includeCitations: req.body.includeCitations !== false,
      includeGraphVisualization: req.body.includeGraphVisualization !== false,
      includeConclusions: req.body.includeConclusions !== false,
    };

    const project = await projectService.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const [triads, tree] = await Promise.all([
      dialecticsService.getProjectTriads(projectId),
      treeService.buildEvolutionTree(projectId),
    ]);

    const result = exportService.export(project.title, triads, tree, config);
    
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export report';
    res.status(500).json({ error: message });
  }
});

export default router;
