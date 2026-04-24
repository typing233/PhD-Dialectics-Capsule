import { SocraticQuestion, ArgumentNode, Attack, DefenseQuestion, CrossDisciplinaryInsight } from '../types';

const SOCRATIC_QUESTION_TEMPLATES: Record<string, SocraticQuestion[]> = {
  clarification: [
    { question: '你能否更清晰地阐述这个假设？核心变量之间的因果关系是什么？', purpose: '澄清核心概念', category: 'clarification' },
    { question: '这个研究试图解决的核心问题是什么？请用一句话概括。', purpose: '明确研究问题', category: 'clarification' },
    { question: '你所使用的关键术语（如X、Y）的操作定义是什么？', purpose: '定义关键术语', category: 'clarification' },
  ],
  assumption: [
    { question: '你的假设基于哪些核心假设？这些假设是否可检验？', purpose: '识别潜在假设', category: 'assumption' },
    { question: '如果这些假设不成立，你的结论会受到什么影响？', purpose: '评估假设重要性', category: 'assumption' },
    { question: '你是否考虑过相反的假设？为什么选择当前方向？', purpose: '考虑替代假设', category: 'assumption' },
  ],
  evidence: [
    { question: '目前有哪些实证证据支持你的假设？证据的强度如何？', purpose: '评估证据基础', category: 'evidence' },
    { question: '你计划如何收集数据？样本量、测量工具、分析方法是什么？', purpose: '明确研究设计', category: 'evidence' },
    { question: '什么样的结果会证伪你的假设？', purpose: '考虑证伪标准', category: 'evidence' },
  ],
  implication: [
    { question: '如果你的假设得到证实，理论意义和实践意义是什么？', purpose: '探讨研究意义', category: 'implication' },
    { question: '这个研究可能的局限性有哪些？如何减轻这些局限？', purpose: '识别潜在局限', category: 'implication' },
    { question: '你的发现如何与现有文献相联系？填补了什么空白？', purpose: '定位文献贡献', category: 'implication' },
  ],
  perspective: [
    { question: '从不同理论视角（如XX学派）来看，你的假设会如何被解读？', purpose: '考虑多元视角', category: 'perspective' },
    { question: '批评者可能会对你的研究提出什么质疑？你如何回应？', purpose: '预判批评意见', category: 'perspective' },
    { question: '如果让另一位研究者重做这个研究，他们可能会采取什么不同的方法？', purpose: '考虑替代方法', category: 'perspective' },
  ],
};

const ATTACK_TYPES = {
  logical_fallacy: [
    { description: '存在因果关系推断的逻辑跳跃，可能混淆相关性与因果性', severity: 'high' as const, suggestion: '建议明确因果机制，考虑反向因果或第三方变量' },
    { description: '推理链条中存在循环论证或偷换概念', severity: 'high' as const, suggestion: '建议重新审视每个推论步骤，确保概念一致性' },
  ],
  evidence_gap: [
    { description: '关键假设缺乏直接的实证支持', severity: 'high' as const, suggestion: '建议补充预实验数据或引用更直接的文献支持' },
    { description: '依赖的证据来源单一或研究设计存在局限', severity: 'medium' as const, suggestion: '建议寻找多元证据来源，考虑荟萃分析或系统综述' },
  ],
  assumption_weakness: [
    { description: '隐藏假设过于理想化，与实际情况存在差距', severity: 'medium' as const, suggestion: '建议明确列出所有假设，并评估其合理性范围' },
    { description: '边界条件未明确界定，结论可能不具有普适性', severity: 'medium' as const, suggestion: '建议明确定义适用范围和边界条件' },
  ],
  methodological_flaw: [
    { description: '研究设计可能无法有效检验研究假设', severity: 'high' as const, suggestion: '建议重新考虑研究设计，考虑使用更强的因果推断方法' },
    { description: '测量工具的信效度未得到充分验证', severity: 'medium' as const, suggestion: '建议在预实验中验证测量工具，或采用已验证的量表' },
  ],
  alternative_explanation: [
    { description: '存在未考虑的竞争性解释或混淆变量', severity: 'high' as const, suggestion: '建议进行敏感性分析，或在研究设计中控制这些变量' },
    { description: '调节变量或中介变量的作用未被充分考虑', severity: 'medium' as const, suggestion: '建议构建更完整的理论模型，考虑过程机制' },
  ],
};

const DEFENSE_QUESTIONS: Record<string, { question: string; difficulty: 'easy' | 'medium' | 'hard' }[]> = {
  methodology: [
    { question: '请简要介绍你的研究设计。', difficulty: 'easy' },
    { question: '为什么选择这种研究方法而不是其他方法？', difficulty: 'medium' },
    { question: '如果重做这个研究，你会在方法上做哪些改进？', difficulty: 'hard' },
  ],
  literature: [
    { question: '你的研究与哪些核心文献相关？', difficulty: 'easy' },
    { question: '你的研究如何区别于现有研究？', difficulty: 'medium' },
    { question: '最相关的三个研究有什么局限性，你的研究如何弥补？', difficulty: 'hard' },
  ],
  assumptions: [
    { question: '你的研究基于哪些基本假设？', difficulty: 'easy' },
    { question: '如果某个假设不成立，会如何影响你的结论？', difficulty: 'medium' },
    { question: '你如何检验这些假设的合理性？', difficulty: 'hard' },
  ],
  contribution: [
    { question: '你的研究的主要贡献是什么？', difficulty: 'easy' },
    { question: '这个贡献对理论和实践有什么意义？', difficulty: 'medium' },
    { question: '如果审稿人说你的贡献不够显著，你会如何回应？', difficulty: 'hard' },
  ],
  future_work: [
    { question: '你认为未来的研究可以沿着哪些方向继续？', difficulty: 'easy' },
    { question: '如果让你继续这个研究项目，你接下来会做什么？', difficulty: 'medium' },
    { question: '你这个研究方向的终极问题是什么？', difficulty: 'hard' },
  ],
};

const CROSS_DISCIPLINARY_PARADIGMS = [
  { 
    sourceField: '物理学', 
    paradigm: '热力学熵增原理',
    methodology: '将系统视为能量耗散结构，分析其演化趋势',
    targetApplication: '可以用于分析组织衰落、信息扩散衰减等现象'
  },
  { 
    sourceField: '生物学', 
    paradigm: '进化生态学',
    methodology: '将研究对象视为生态系统，分析竞争、共生、适应机制',
    targetApplication: '可以用于分析市场竞争、技术扩散、组织生态等'
  },
  { 
    sourceField: '计算机科学', 
    paradigm: '机器学习与模式识别',
    methodology: '将问题转化为特征提取与模式分类问题',
    targetApplication: '可以用于分析复杂数据中的隐藏规律、预测未来趋势'
  },
  { 
    sourceField: '经济学', 
    paradigm: '博弈论与激励机制',
    methodology: '分析参与者的策略互动与均衡状态',
    targetApplication: '可以用于分析多方决策、利益冲突、合作机制设计'
  },
  { 
    sourceField: '心理学', 
    paradigm: '认知偏差与启发式',
    methodology: '分析个体决策中的系统性偏差',
    targetApplication: '可以用于分析用户行为、组织决策、市场反应等'
  },
  { 
    sourceField: '社会学', 
    paradigm: '社会网络分析',
    methodology: '分析关系结构、中心性、传播路径',
    targetApplication: '可以用于分析信息传播、影响力扩散、社会资本等'
  },
  { 
    sourceField: '数学', 
    paradigm: '动力系统与混沌理论',
    methodology: '分析非线性系统的演化行为与临界点',
    targetApplication: '可以用于分析市场崩盘、技术突破、相变现象'
  },
  { 
    sourceField: '语言学', 
    paradigm: '话语分析与框架理论',
    methodology: '分析语言如何建构意义与影响认知',
    targetApplication: '可以用于分析媒体叙事、品牌传播、政策话语等'
  },
];

export class AIService {
  generateSocraticQuestion(
    context: string, 
    previousQuestions: string[],
    stage: 'initial' | 'deepening' | 'refining'
  ): SocraticQuestion {
    const usedCategories = new Set(
      previousQuestions.map(q => {
        for (const [cat, questions] of Object.entries(SOCRATIC_QUESTION_TEMPLATES)) {
          if (questions.some(template => q.includes(template.question.substring(0, 20)))) {
            return cat;
          }
        }
        return null;
      }).filter(Boolean)
    );

    let availableCategories = Object.keys(SOCRATIC_QUESTION_TEMPLATES).filter(
      cat => !usedCategories.has(cat)
    );

    if (availableCategories.length === 0) {
      availableCategories = Object.keys(SOCRATIC_QUESTION_TEMPLATES);
    }

    let selectedCategory: string;
    if (stage === 'initial') {
      selectedCategory = availableCategories.includes('clarification') ? 'clarification' : availableCategories[0];
    } else if (stage === 'deepening') {
      const deepCategories = availableCategories.filter(c => ['assumption', 'evidence'].includes(c));
      selectedCategory = deepCategories.length > 0 ? deepCategories[0] : availableCategories[0];
    } else {
      const refineCategories = availableCategories.filter(c => ['implication', 'perspective'].includes(c));
      selectedCategory = refineCategories.length > 0 ? refineCategories[0] : availableCategories[0];
    }

    const templates = SOCRATIC_QUESTION_TEMPLATES[selectedCategory];
    const template = templates[Math.floor(Math.random() * templates.length)];

    return { ...template };
  }

  generateOpeningResponse(): string {
    return `你好！我是你的苏格拉底式对话助手。让我们一起锻造一个严密的研究假设。

请告诉我：
1. 你的研究领域是什么？
2. 你想要研究什么问题？
3. 你最初的猜想或假设是什么？

越具体越好，让我们从模糊的想法开始，逐步构建成可检验的研究假设。`;
  }

  analyzeNodeForAttack(node: ArgumentNode, siblingNodes: ArgumentNode[]): Attack[] {
    const attacks: Attack[] = [];
    const content = node.content.toLowerCase();
    const nodeType = node.type;

    const attackOrder = ['logical_fallacy', 'evidence_gap', 'assumption_weakness', 'methodological_flaw', 'alternative_explanation'];
    
    let attackCount = 0;
    const maxAttacks = node.strength < 0.5 ? 3 : node.strength < 0.7 ? 2 : 1;

    for (const attackType of attackOrder) {
      if (attackCount >= maxAttacks) break;
      
      const templates = ATTACK_TYPES[attackType as keyof typeof ATTACK_TYPES];
      const relevantTemplate = this.findRelevantTemplate(content, nodeType, templates);
      
      if (relevantTemplate) {
        attacks.push({
          id: '',
          projectId: node.projectId,
          nodeId: node.id,
          type: attackType as Attack['type'],
          description: relevantTemplate.description,
          severity: relevantTemplate.severity,
          suggestion: relevantTemplate.suggestion,
          createdAt: new Date(),
        });
        attackCount++;
      }
    }

    return attacks;
  }

  private findRelevantTemplate(
    content: string, 
    nodeType: string, 
    templates: any
  ): any | null {
    const keywords = {
      logical_fallacy: ['导致', '引起', '使得', '因为', '所以', '因此', '于是'],
      evidence_gap: ['可能', '也许', '或许', '应该', '可能会', '应该会'],
      assumption_weakness: ['假设', '假定', '如果', '考虑到', '基于'],
      methodological_flaw: ['研究', '实验', '调查', '测量', '分析'],
      alternative_explanation: ['或者', '另一种', '可能是', '也可能'],
    };

    for (const template of templates) {
      const description = template.description.toLowerCase();
      for (const [, words] of Object.entries(keywords)) {
        for (const word of words) {
          if (content.includes(word) || description.includes(word)) {
            return template;
          }
        }
      }
    }

    return templates[Math.floor(Math.random() * templates.length)];
  }

  generateDefenseQuestions(
    projectContext: string,
    categories: string[] = Object.keys(DEFENSE_QUESTIONS)
  ): Omit<DefenseQuestion, 'id' | 'projectId' | 'createdAt' | 'userAnswer' | 'evaluation'>[] {
    const questions: Omit<DefenseQuestion, 'id' | 'projectId' | 'createdAt' | 'userAnswer' | 'evaluation'>[] = [];

    for (const category of categories) {
      const categoryQuestions = DEFENSE_QUESTIONS[category];
      if (categoryQuestions) {
        const selectedQuestions = categoryQuestions.slice(0, 2);
        for (const q of selectedQuestions) {
          questions.push({
            question: q.question,
            category: category as DefenseQuestion['category'],
            difficulty: q.difficulty,
          });
        }
      }
    }

    return questions;
  }

  evaluateDefenseAnswer(
    question: string,
    answer: string,
    context: string
  ): { score: number; feedback: string; strengths: string[]; improvements: string[] } {
    const strengths: string[] = [];
    const improvements: string[] = [];
    
    const answerLength = answer.length;
    const hasKeyTerms = ['理论', '实证', '数据', '研究', '假设', '结论'].some(term => answer.includes(term));
    const hasStructure = answer.includes('首先') || answer.includes('第一') || answer.includes('1.') || answer.includes('\n');

    let score = 50;

    if (answerLength > 50) {
      score += 10;
      strengths.push('回答较为详细');
    } else {
      improvements.push('回答可以更详细一些');
    }

    if (hasKeyTerms) {
      score += 15;
      strengths.push('使用了学术术语');
    } else {
      improvements.push('可以使用更多学术术语来增强专业性');
    }

    if (hasStructure) {
      score += 15;
      strengths.push('回答结构清晰');
    } else {
      improvements.push('回答可以更有结构性，使用"首先"、"其次"等连接词');
    }

    if (answerLength > 100 && hasKeyTerms) {
      score += 10;
    }

    score = Math.min(100, Math.max(0, score));

    let feedback = '';
    if (score >= 80) {
      feedback = '优秀！你的回答展示了扎实的学术素养。结构清晰，术语使用恰当，论证充分。';
    } else if (score >= 60) {
      feedback = '良好。回答基本涵盖了关键点，但可以在某些方面进一步加强。';
    } else {
      feedback = '需要改进。建议更系统地组织你的回答，并确保使用适当的学术语言。';
    }

    if (strengths.length === 0) {
      strengths.push('回答直接回应了问题');
    }

    return { score, feedback, strengths, improvements };
  }

  generateCrossDisciplinaryInsights(
    projectContext: string,
    researchField: string
  ): Omit<CrossDisciplinaryInsight, 'id' | 'projectId' | 'createdAt'>[] {
    const insights: Omit<CrossDisciplinaryInsight, 'id' | 'projectId' | 'createdAt'>[] = [];
    const usedFields = new Set<string>();

    const shuffledParadigms = [...CROSS_DISCIPLINARY_PARADIGMS].sort(() => Math.random() - 0.5);

    for (const paradigm of shuffledParadigms.slice(0, 4)) {
      if (usedFields.has(paradigm.sourceField)) continue;
      usedFields.add(paradigm.sourceField);

      const relevance = 0.4 + Math.random() * 0.5;

      insights.push({
        sourceField: paradigm.sourceField,
        targetApplication: paradigm.targetApplication,
        paradigm: paradigm.paradigm,
        methodology: paradigm.methodology,
        relevance: Math.round(relevance * 100) / 100,
      });
    }

    return insights.sort((a, b) => b.relevance - a.relevance);
  }

  extractArgumentNodesFromDialogue(
    messages: { role: string; content: string }[],
    projectId: string
  ): Omit<ArgumentNode, 'id' | 'createdAt' | 'version'>[] {
    const nodes: Omit<ArgumentNode, 'id' | 'createdAt' | 'version'>[] = [];
    let parentId: string | null = null;

    const userMessages = messages.filter(m => m.role === 'user');

    for (let i = 0; i < userMessages.length; i++) {
      const message = userMessages[i];
      const content = message.content;
      
      let nodeType: ArgumentNode['type'] = 'hypothesis';
      let strength = 0.5 + Math.random() * 0.3;
      let vulnerability = 0.3 + Math.random() * 0.4;

      if (content.includes('假设') || content.includes('如果') || content.includes('认为')) {
        nodeType = 'assumption';
        strength -= 0.1;
        vulnerability += 0.1;
      } else if (content.includes('证据') || content.includes('数据') || content.includes('研究') || content.includes('实验')) {
        nodeType = 'evidence';
        strength += 0.1;
        vulnerability -= 0.1;
      } else if (content.includes('反驳') || content.includes('质疑') || content.includes('相反') || content.includes('但是')) {
        nodeType = 'counterargument';
        strength -= 0.05;
        vulnerability += 0.05;
      } else if (content.includes('改进') || content.includes('优化') || content.includes('调整') || content.includes('修改')) {
        nodeType = 'refinement';
        strength += 0.05;
        vulnerability -= 0.05;
      }

      const shortContent = content.length > 200 ? content.substring(0, 200) + '...' : content;

      nodes.push({
        projectId,
        parentId,
        type: nodeType,
        content: shortContent,
        strength: Math.min(1, Math.max(0, strength)),
        vulnerabilityScore: Math.min(1, Math.max(0, vulnerability)),
      });

      parentId = null;
    }

    if (nodes.length === 0) {
      nodes.push({
        projectId,
        parentId: null,
        type: 'hypothesis',
        content: '初始研究假设',
        strength: 0.5,
        vulnerabilityScore: 0.4,
      });
    }

    return nodes;
  }
}

export const aiService = new AIService();
