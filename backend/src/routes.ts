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

const router = Router();
const projectService = new ProjectService();
const dialogueService = new DialogueService();
const treeService = new ArgumentTreeService();
const devilAdvocateService = new DevilAdvocateService();
const defenseService = new DefenseService();
const crossDisciplinaryService = new CrossDisciplinaryService();

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

export default router;
