import { AIService } from '../services/aiService';

describe('AIService Integration Tests', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
  });

  describe('Full Dialogue Flow', () => {
    it('should support a complete research dialogue flow', () => {
      const messages: { role: string; content: string }[] = [];

      const opening = aiService.generateOpeningResponse();
      messages.push({ role: 'assistant', content: opening });

      const userMessages = [
        '我想研究社交媒体使用与青少年抑郁之间的关系',
        '我的假设是：每天使用社交媒体超过2小时的青少年，抑郁症状得分显著更高',
        '我计划采用问卷调查法，使用CES-D量表测量抑郁，使用社交媒体使用时间量表',
        '可能的局限是这是横断面研究，无法确定因果关系',
        '我认为理论贡献在于拓展了社交媒体使用与心理健康关系的边界条件研究',
      ];

      for (let i = 0; i < userMessages.length; i++) {
        messages.push({ role: 'user', content: userMessages[i] });
        
        const previousQuestions = messages
          .filter(m => m.role === 'assistant')
          .map(m => m.content);
        
        const stage = i < 2 ? 'initial' : i < 4 ? 'deepening' : 'refining';
        
        const response = aiService.generateSocraticQuestion(
          userMessages[i],
          previousQuestions,
          stage
        );
        
        messages.push({ role: 'assistant', content: response.question });
      }

      const nodes = aiService.extractArgumentNodesFromDialogue(messages, 'test-project');
      
      expect(nodes.length).toBeGreaterThan(0);
      expect(nodes.some((n: any) => n.type === 'hypothesis')).toBe(true);
    });
  });

  describe('Devil Advocate Attack Flow', () => {
    it('should attack nodes from a dialogue and provide actionable suggestions', () => {
      const messages = [
        { role: 'user', content: '我的核心假设是社交媒体使用导致抑郁增加' },
        { role: 'user', content: '我认为原因在于社会比较理论，人们看到他人完美的生活感到自卑' },
        { role: 'user', content: '我计划用问卷调查法收集数据' },
      ];

      const nodes = aiService.extractArgumentNodesFromDialogue(messages, 'test-project');

      for (const node of nodes) {
        const fullNode = {
          ...node,
          id: `node-${Math.random()}`,
          createdAt: new Date(),
          version: 1,
        };

        const attacks = aiService.analyzeNodeForAttack(fullNode, []);
        
        expect(attacks.length).toBeGreaterThan(0);
        
        for (const attack of attacks) {
          expect(attack.description).toBeDefined();
          expect(attack.suggestion).toBeDefined();
          expect(['high', 'medium', 'low']).toContain(attack.severity);
        }
      }
    });
  });

  describe('Defense Evaluation Flow', () => {
    it('should evaluate answers across different question categories', () => {
      const testCases = [
        {
          category: 'methodology',
          question: '请介绍你的研究设计',
          goodAnswer: '我的研究采用纵向追踪设计，共追踪了500名青少年，历时6个月。使用多层线性模型分析时间维度上的变化。测量工具包括经过验证的抑郁量表和社交媒体使用频率问卷。',
          poorAnswer: '就是问卷调查。',
        },
        {
          category: 'contribution',
          question: '你的研究贡献是什么？',
          goodAnswer: '理论贡献在于首次检验了某一特定调节变量在社交媒体与抑郁关系中的作用。方法贡献在于采用了经验取样法，能够捕捉日常波动。实践贡献在于为干预方案提供了实证依据。',
          poorAnswer: '还没想清楚。',
        },
        {
          category: 'literature',
          question: '你的研究如何与现有文献相联系？',
          goodAnswer: '我的研究基于社会比较理论和自我决定理论框架。与现有研究不同的是，我关注了特定平台的差异效应，而非整体社交媒体使用。这回应了近期综述中提出的研究缺口。',
          poorAnswer: '看了一些文献。',
        },
      ];

      for (const testCase of testCases) {
        const goodEvaluation = aiService.evaluateDefenseAnswer(
          testCase.question,
          testCase.goodAnswer,
          '研究背景'
        );

        const poorEvaluation = aiService.evaluateDefenseAnswer(
          testCase.question,
          testCase.poorAnswer,
          '研究背景'
        );

        expect(goodEvaluation.score).toBeGreaterThanOrEqual(poorEvaluation.score);
        expect(goodEvaluation.feedback).toBeDefined();
        expect(poorEvaluation.feedback).toBeDefined();
      }
    });
  });

  describe('Cross-Disciplinary Insight Generation', () => {
    it('should generate relevant insights across different research contexts', () => {
      const testContexts = [
        {
          context: '研究社交媒体上的信息传播和扩散机制',
          field: '传播学',
        },
        {
          context: '研究消费者在电商平台上的决策行为',
          field: '市场营销',
        },
        {
          context: '研究城市社区的社会网络结构',
          field: '社会学',
        },
        {
          context: '研究教育游戏对学习动机的影响',
          field: '教育学',
        },
      ];

      for (const ctx of testContexts) {
        const insights = aiService.generateCrossDisciplinaryInsights(ctx.context, ctx.field);
        
        expect(insights.length).toBeGreaterThan(0);
        expect(insights.length).toBeLessThanOrEqual(4);

        for (const insight of insights) {
          expect(insight.sourceField).toBeDefined();
          expect(insight.paradigm).toBeDefined();
          expect(insight.methodology).toBeDefined();
          expect(insight.targetApplication).toBeDefined();
          expect(insight.relevance).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Socratic Question Categories', () => {
    it('should generate questions from all categories across dialogue stages', () => {
      const allCategories = new Set<string>();
      const categoryCounts: Record<string, number> = {};

      for (let stage of ['initial', 'deepening', 'refining'] as const) {
        for (let i = 0; i < 5; i++) {
          const previousQuestions: string[] = [];
          
          for (let j = 0; j < 3; j++) {
            const question = aiService.generateSocraticQuestion(
              '测试内容',
              previousQuestions,
              stage
            );
            
            allCategories.add(question.category);
            categoryCounts[question.category] = (categoryCounts[question.category] || 0) + 1;
            
            previousQuestions.push(question.question);
          }
        }
      }

      const expectedCategories = ['clarification', 'assumption', 'evidence', 'implication', 'perspective'];
      
      for (const cat of expectedCategories) {
        expect(allCategories.has(cat)).toBe(true);
      }
    });
  });
});
