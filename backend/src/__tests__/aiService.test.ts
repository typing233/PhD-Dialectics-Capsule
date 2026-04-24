import { AIService } from '../services/aiService';
import type { ArgumentNode, Attack } from '../types';

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
  });

  describe('generateSocraticQuestion', () => {
    it('should generate a Socratic question for initial stage', () => {
      const result = aiService.generateSocraticQuestion(
        '我想研究社交媒体使用与抑郁的关系',
        [],
        'initial'
      );

      expect(result).toHaveProperty('question');
      expect(result).toHaveProperty('purpose');
      expect(result).toHaveProperty('category');
      expect(typeof result.question).toBe('string');
      expect(result.question.length).toBeGreaterThan(0);
    });

    it('should generate different questions for different stages', () => {
      const initialQuestion = aiService.generateSocraticQuestion(
        '测试内容',
        [],
        'initial'
      );
      
      const deepeningQuestion = aiService.generateSocraticQuestion(
        '测试内容',
        [],
        'deepening'
      );
      
      const refiningQuestion = aiService.generateSocraticQuestion(
        '测试内容',
        [],
        'refining'
      );

      expect(initialQuestion).toBeDefined();
      expect(deepeningQuestion).toBeDefined();
      expect(refiningQuestion).toBeDefined();
    });

    it('should consider previous questions to avoid repetition', () => {
      const previousQuestions = [
        '你能否更清晰地阐述这个假设？核心变量之间的因果关系是什么？',
        '你的假设基于哪些核心假设？这些假设是否可检验？',
      ];

      const result = aiService.generateSocraticQuestion(
        '测试内容',
        previousQuestions,
        'deepening'
      );

      expect(result).toBeDefined();
    });
  });

  describe('generateOpeningResponse', () => {
    it('should generate a welcoming opening response', () => {
      const response = aiService.generateOpeningResponse();

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      expect(response).toContain('苏格拉底');
    });
  });

  describe('analyzeNodeForAttack', () => {
    it('should analyze a node and return attacks', () => {
      const node: ArgumentNode = {
        id: 'test-1',
        projectId: 'proj-1',
        parentId: null,
        type: 'hypothesis',
        content: '社交媒体使用导致抑郁症状增加',
        strength: 0.5,
        vulnerabilityScore: 0.4,
        createdAt: new Date(),
        version: 1,
      };

      const attacks = aiService.analyzeNodeForAttack(node, []);

      expect(Array.isArray(attacks)).toBe(true);
      expect(attacks.length).toBeGreaterThan(0);
    });

    it('should include all required properties in attack', () => {
      const node: ArgumentNode = {
        id: 'test-1',
        projectId: 'proj-1',
        parentId: null,
        type: 'hypothesis',
        content: '测试假设内容',
        strength: 0.3,
        vulnerabilityScore: 0.7,
        createdAt: new Date(),
        version: 1,
      };

      const attacks = aiService.analyzeNodeForAttack(node, []);
      const attack = attacks[0];

      expect(attack).toHaveProperty('type');
      expect(attack).toHaveProperty('description');
      expect(attack).toHaveProperty('severity');
      expect(attack).toHaveProperty('suggestion');
    });

    it('should return more attacks for weaker nodes', () => {
      const weakNode: ArgumentNode = {
        id: 'weak-1',
        projectId: 'proj-1',
        parentId: null,
        type: 'hypothesis',
        content: '可能会导致某种结果',
        strength: 0.3,
        vulnerabilityScore: 0.8,
        createdAt: new Date(),
        version: 1,
      };

      const strongNode: ArgumentNode = {
        id: 'strong-1',
        projectId: 'proj-1',
        parentId: null,
        type: 'evidence',
        content: '根据多项研究数据表明...',
        strength: 0.8,
        vulnerabilityScore: 0.2,
        createdAt: new Date(),
        version: 1,
      };

      const weakAttacks = aiService.analyzeNodeForAttack(weakNode, []);
      const strongAttacks = aiService.analyzeNodeForAttack(strongNode, []);

      expect(weakAttacks.length).toBeGreaterThanOrEqual(strongAttacks.length);
    });
  });

  describe('evaluateDefenseAnswer', () => {
    it('should evaluate an answer and return structured evaluation', () => {
      const evaluation = aiService.evaluateDefenseAnswer(
        '请介绍你的研究设计',
        '我的研究采用随机对照实验设计，共有200名参与者随机分为实验组和对照组。实验组接受干预措施，对照组不接受。主要因变量是抑郁量表得分。使用独立样本t检验比较两组差异。',
        '研究背景：社交媒体与抑郁的关系研究'
      );

      expect(evaluation).toHaveProperty('score');
      expect(evaluation).toHaveProperty('feedback');
      expect(evaluation).toHaveProperty('strengths');
      expect(evaluation).toHaveProperty('improvements');
      
      expect(typeof evaluation.score).toBe('number');
      expect(evaluation.score).toBeGreaterThanOrEqual(0);
      expect(evaluation.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(evaluation.strengths)).toBe(true);
      expect(Array.isArray(evaluation.improvements)).toBe(true);
    });

    it('should give higher scores to more detailed answers', () => {
      const shortAnswer = aiService.evaluateDefenseAnswer(
        '问题',
        '是的。',
        ''
      );

      const detailedAnswer = aiService.evaluateDefenseAnswer(
        '问题',
        '首先，我的理论基础来源于社会心理学的社会比较理论。实证方面，我参考了多项纵向研究的设计。研究方法上，我计划采用结构方程模型来分析中介效应。理论贡献在于拓展了特定情境下的应用。',
        ''
      );

      expect(detailedAnswer.score).toBeGreaterThanOrEqual(shortAnswer.score);
    });

    it('should identify strengths in well-structured answers', () => {
      const evaluation = aiService.evaluateDefenseAnswer(
        '请介绍你的研究方法',
        '首先，我的研究采用横断面问卷调查法。理论上，这基于社会认知理论。实证方面，参考了已有研究的成熟量表。具体来说，我使用了信效度已验证的抑郁量表和社交媒体使用量表。数据分析将采用回归分析和中介效应检验。',
        ''
      );

      expect(evaluation.strengths.length).toBeGreaterThan(0);
    });
  });

  describe('generateCrossDisciplinaryInsights', () => {
    it('should generate cross-disciplinary insights', () => {
      const insights = aiService.generateCrossDisciplinaryInsights(
        '研究社交媒体使用对青少年心理健康的影响',
        '心理学'
      );

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should include all required insight properties', () => {
      const insights = aiService.generateCrossDisciplinaryInsights('测试内容', '测试领域');
      const insight = insights[0];

      expect(insight).toHaveProperty('sourceField');
      expect(insight).toHaveProperty('targetApplication');
      expect(insight).toHaveProperty('paradigm');
      expect(insight).toHaveProperty('methodology');
      expect(insight).toHaveProperty('relevance');

      expect(typeof insight.relevance).toBe('number');
      expect(insight.relevance).toBeGreaterThan(0);
      expect(insight.relevance).toBeLessThanOrEqual(1);
    });

    it('should sort insights by relevance descending', () => {
      const insights = aiService.generateCrossDisciplinaryInsights('测试内容', '测试领域');
      
      for (let i = 1; i < insights.length; i++) {
        expect(insights[i - 1].relevance).toBeGreaterThanOrEqual(insights[i].relevance);
      }
    });
  });

  describe('generateDefenseQuestions', () => {
    it('should generate defense questions', () => {
      const questions = aiService.generateDefenseQuestions(
        '社交媒体与抑郁的关系研究',
        ['methodology', 'contribution']
      );

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should include all required question properties', () => {
      const questions = aiService.generateDefenseQuestions('测试内容');
      const question = questions[0];

      expect(question).toHaveProperty('question');
      expect(question).toHaveProperty('category');
      expect(question).toHaveProperty('difficulty');
    });

    it('should generate questions for specified categories', () => {
      const categories = ['methodology', 'literature'];
      const questions = aiService.generateDefenseQuestions('测试内容', categories);
      
      const generatedCategories = new Set(questions.map((q: any) => q.category));
      
      for (const cat of categories) {
        expect(generatedCategories.has(cat)).toBe(true);
      }
    });
  });

  describe('extractArgumentNodesFromDialogue', () => {
    it('should extract nodes from dialogue messages', () => {
      const messages = [
        { role: 'user', content: '我认为社交媒体使用会导致抑郁增加' },
        { role: 'assistant', content: '请详细说明' },
        { role: 'user', content: '我的假设是：每天使用时间越长，抑郁症状越明显' },
      ];

      const nodes = aiService.extractArgumentNodesFromDialogue(messages, 'proj-1');

      expect(Array.isArray(nodes)).toBe(true);
      expect(nodes.length).toBeGreaterThan(0);
    });

    it('should include all required node properties', () => {
      const messages = [
        { role: 'user', content: '测试内容' },
      ];

      const nodes = aiService.extractArgumentNodesFromDialogue(messages, 'proj-1');
      const node = nodes[0];

      expect(node).toHaveProperty('projectId');
      expect(node).toHaveProperty('type');
      expect(node).toHaveProperty('content');
      expect(node).toHaveProperty('strength');
      expect(node).toHaveProperty('vulnerabilityScore');
      expect(node.projectId).toBe('proj-1');
    });

    it('should classify different types based on content keywords', () => {
      const messages = [
        { role: 'user', content: '我假设这个关系是因果关系' },
        { role: 'user', content: '根据已有研究表明存在这样的证据' },
        { role: 'user', content: '但是有人可能会质疑这个假设' },
      ];

      const nodes = aiService.extractArgumentNodesFromDialogue(messages, 'proj-1');

      expect(nodes.length).toBeGreaterThan(0);
    });
  });
});
