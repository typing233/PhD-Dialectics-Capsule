export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  systemPrompt: string;
  userPromptTemplate: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DialecticalTriad {
  id: string;
  projectId: string;
  thesis: {
    content: string;
    keyPoints: string[];
    citations?: string[];
  };
  antithesis: {
    content: string;
    keyPoints: string[];
    citations?: string[];
  };
  synthesis: {
    content: string;
    keyPoints: string[];
    reconciledPoints: string[];
    citations?: string[];
  };
  context: string;
  createdAt: Date;
}

export interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

const DEFAULT_DEEPSEEK_CONFIG: DeepSeekConfig = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  maxTokens: 4096,
  temperature: 0.7,
};

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'thesis-generator',
    name: '论点生成器',
    category: 'dialectics',
    systemPrompt: `你是一位专业的学术论证专家，擅长生成清晰、严谨的学术论点。
请根据用户提供的研究主题或问题，生成一个结构清晰的论点（Thesis）。
论点应该：
1. 明确表达核心主张
2. 包含2-4个关键要点
3. 具有学术严谨性
4. 可检验、可论证

请以JSON格式输出，结构如下：
{
  "content": "论点的完整表述",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "citations": ["可选的文献引用建议"]
}`,
    userPromptTemplate: '研究主题：{{topic}}\n\n请根据上述主题生成一个学术论点。',
    description: '用于生成辩证分析的初始论点',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'antithesis-generator',
    name: '反论点生成器',
    category: 'dialectics',
    systemPrompt: `你是一位批判性思维专家，擅长从不同角度审视论点并提出有力的反论点。
请根据用户提供的论点，生成一个结构清晰的反论点（Antithesis）。
反论点应该：
1. 直接针对原论点的核心主张
2. 包含2-4个关键反驳要点
3. 具有逻辑一致性
4. 可以引入替代视角或竞争性理论

请以JSON格式输出，结构如下：
{
  "content": "反论点的完整表述",
  "keyPoints": ["反驳要点1", "反驳要点2", "反驳要点3"],
  "citations": ["可选的文献引用建议"]
}`,
    userPromptTemplate: '原论点：{{thesis}}\n\n请针对上述论点生成一个有力的反论点。',
    description: '用于生成辩证分析的反论点',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'synthesis-generator',
    name: '合题生成器',
    category: 'dialectics',
    systemPrompt: `你是一位综合分析专家，擅长调和对立观点并生成更高层次的综合结论。
请根据用户提供的论点和反论点，生成一个结构清晰的合题（Synthesis）。
合题应该：
1. 保留论点和反论点中的合理成分
2. 解决两者之间的核心矛盾
3. 提出一个更全面、更成熟的观点
4. 包含2-4个关键整合要点

请以JSON格式输出，结构如下：
{
  "content": "合题的完整表述",
  "keyPoints": ["整合要点1", "整合要点2", "整合要点3"],
  "reconciledPoints": ["从论点保留的要点", "从反论点保留的要点"],
  "citations": ["可选的文献引用建议"]
}`,
    userPromptTemplate: '论点：{{thesis}}\n\n反论点：{{antithesis}}\n\n请综合上述对立观点，生成一个合题。',
    description: '用于生成辩证分析的合题',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'full-dialectics-generator',
    name: '完整辩证三要素生成器',
    category: 'dialectics',
    systemPrompt: `你是一位精通辩证法的学术导师，能够帮助用户进行完整的辩证分析。
请根据用户提供的研究主题或问题，生成完整的辩证三要素：论点（Thesis）、反论点（Antithesis）和合题（Synthesis）。

要求：
1. 论点：明确表达核心主张，包含2-4个关键要点
2. 反论点：直接针对原论点，包含2-4个反驳要点
3. 合题：调和对立观点，提出更全面的结论

请以JSON格式输出，结构如下：
{
  "thesis": {
    "content": "论点的完整表述",
    "keyPoints": ["要点1", "要点2"],
    "citations": ["引用建议"]
  },
  "antithesis": {
    "content": "反论点的完整表述",
    "keyPoints": ["反驳要点1", "反驳要点2"],
    "citations": ["引用建议"]
  },
  "synthesis": {
    "content": "合题的完整表述",
    "keyPoints": ["整合要点1", "整合要点2"],
    "reconciledPoints": ["保留的合理要点"],
    "citations": ["引用建议"]
  }
}`,
    userPromptTemplate: '研究主题：{{topic}}\n\n请根据上述主题进行完整的辩证分析，生成论点、反论点和合题。',
    description: '一次性生成完整的辩证三要素',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export class DeepSeekService {
  private config: DeepSeekConfig;

  constructor(config?: Partial<DeepSeekConfig>) {
    this.config = { ...DEFAULT_DEEPSEEK_CONFIG, ...config };
  }

  updateConfig(updates: Partial<DeepSeekConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): DeepSeekConfig {
    return { ...this.config };
  }

  async callDeepSeek(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    configOverrides?: Partial<DeepSeekConfig>
  ): Promise<string> {
    const config = { ...this.config, ...configOverrides };
    
    if (!config.apiKey) {
      throw new Error('DeepSeek API Key 未配置，请在前端设置中配置您的API密钥');
    }

    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API 调用失败: ${error.error?.message || `HTTP ${response.status}`}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  renderPromptTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || '');
  }

  async generateUsingTemplate(
    template: PromptTemplate,
    variables: Record<string, string>,
    apiKey: string
  ): Promise<any> {
    const userPrompt = this.renderPromptTemplate(template.userPromptTemplate, variables);
    
    const messages = [
      { role: 'system' as const, content: template.systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const response = await this.callDeepSeek(messages, { apiKey });
    
    try {
      return JSON.parse(response);
    } catch (error) {
      throw new Error('AI响应解析失败，请重试');
    }
  }

  async generateDialecticalTriad(
    topic: string,
    apiKey: string,
    existingThesis?: string
  ): Promise<Omit<DialecticalTriad, 'id' | 'projectId' | 'createdAt'>> {
    const fullTemplate = DEFAULT_PROMPT_TEMPLATES.find(t => t.id === 'full-dialectics-generator');
    if (!fullTemplate) throw new Error('模板未找到');

    const variables: Record<string, string> = { topic };
    if (existingThesis) {
      variables.thesis = existingThesis;
    }

    const result = await this.generateUsingTemplate(fullTemplate, variables, apiKey);

    return {
      thesis: {
        content: result.thesis?.content || '',
        keyPoints: result.thesis?.keyPoints || [],
        citations: result.thesis?.citations || [],
      },
      antithesis: {
        content: result.antithesis?.content || '',
        keyPoints: result.antithesis?.keyPoints || [],
        citations: result.antithesis?.citations || [],
      },
      synthesis: {
        content: result.synthesis?.content || '',
        keyPoints: result.synthesis?.keyPoints || [],
        reconciledPoints: result.synthesis?.reconciledPoints || [],
        citations: result.synthesis?.citations || [],
      },
      context: topic,
    };
  }

  async generateThesis(
    topic: string,
    apiKey: string
  ): Promise<{ content: string; keyPoints: string[]; citations?: string[] }> {
    const template = DEFAULT_PROMPT_TEMPLATES.find(t => t.id === 'thesis-generator');
    if (!template) throw new Error('模板未找到');

    return this.generateUsingTemplate(template, { topic }, apiKey);
  }

  async generateAntithesis(
    thesis: string,
    apiKey: string
  ): Promise<{ content: string; keyPoints: string[]; citations?: string[] }> {
    const template = DEFAULT_PROMPT_TEMPLATES.find(t => t.id === 'antithesis-generator');
    if (!template) throw new Error('模板未找到');

    return this.generateUsingTemplate(template, { thesis }, apiKey);
  }

  async generateSynthesis(
    thesis: string,
    antithesis: string,
    apiKey: string
  ): Promise<{ content: string; keyPoints: string[]; reconciledPoints: string[]; citations?: string[] }> {
    const template = DEFAULT_PROMPT_TEMPLATES.find(t => t.id === 'synthesis-generator');
    if (!template) throw new Error('模板未找到');

    return this.generateUsingTemplate(template, { thesis, antithesis }, apiKey);
  }
}

export const deepseekService = new DeepSeekService();
