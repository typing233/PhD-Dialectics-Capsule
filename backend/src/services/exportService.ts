import { 
  ExportConfig, 
  ExportResult, 
  DialecticalTriad, 
  DialecticalNode, 
  DialecticalEdge,
  ArgumentNode,
  EvolutionTree
} from '../types';

export class ExportService {
  exportToMarkdown(
    projectTitle: string,
    triads: DialecticalTriad[],
    tree?: EvolutionTree,
    config: ExportConfig
  ): ExportResult {
    let content = `# ${projectTitle}\n\n`;
    content += `## 辩证分析报告\n\n`;
    content += `> 生成时间: ${new Date().toISOString()}\n\n`;
    content += `---\n\n`;

    if (triads.length > 0) {
      content += `## 辩证三要素分析\n\n`;
      
      triads.forEach((triad, index) => {
        content += `### 分析 ${index + 1}: ${triad.context || '未命名主题'}\n\n`;
        
        content += `#### 论点 (Thesis)\n\n`;
        content += `${triad.thesis.content}\n\n`;
        
        if (triad.thesis.keyPoints.length > 0) {
          content += `**关键要点:**\n\n`;
          triad.thesis.keyPoints.forEach((point, i) => {
            content += `${i + 1}. ${point}\n`;
          });
          content += `\n`;
        }

        if (config.includeCitations && triad.thesis.citations && triad.thesis.citations.length > 0) {
          content += `**参考文献:**\n\n`;
          triad.thesis.citations.forEach((cit, i) => {
            content += `[${i + 1}] ${cit}\n`;
          });
          content += `\n`;
        }

        content += `#### 反论点 (Antithesis)\n\n`;
        content += `${triad.antithesis.content}\n\n`;
        
        if (triad.antithesis.keyPoints.length > 0) {
          content += `**关键要点:**\n\n`;
          triad.antithesis.keyPoints.forEach((point, i) => {
            content += `${i + 1}. ${point}\n`;
          });
          content += `\n`;
        }

        if (config.includeCitations && triad.antithesis.citations && triad.antithesis.citations.length > 0) {
          content += `**参考文献:**\n\n`;
          triad.antithesis.citations.forEach((cit, i) => {
            content += `[${i + 1}] ${cit}\n`;
          });
          content += `\n`;
        }

        content += `#### 合题 (Synthesis)\n\n`;
        content += `${triad.synthesis.content}\n\n`;
        
        if (triad.synthesis.keyPoints.length > 0) {
          content += `**整合要点:**\n\n`;
          triad.synthesis.keyPoints.forEach((point, i) => {
            content += `${i + 1}. ${point}\n`;
          });
          content += `\n`;
        }

        if (triad.synthesis.reconciledPoints.length > 0) {
          content += `**调和要点:**\n\n`;
          triad.synthesis.reconciledPoints.forEach((point, i) => {
            content += `${i + 1}. ${point}\n`;
          });
          content += `\n`;
        }

        if (config.includeCitations && triad.synthesis.citations && triad.synthesis.citations.length > 0) {
          content += `**参考文献:**\n\n`;
          triad.synthesis.citations.forEach((cit, i) => {
            content += `[${i + 1}] ${cit}\n`;
          });
          content += `\n`;
        }

        content += `---\n\n`;
      });
    }

    if (tree && tree.nodes.length > 0) {
      content += `## 论证树结构\n\n`;
      content += `共 ${tree.nodes.length} 个节点, ${tree.edges.length} 条边\n\n`;

      const nodeTypeLabels: Record<string, string> = {
        hypothesis: '假设',
        assumption: '前提',
        evidence: '证据',
        counterargument: '反驳',
        refinement: '修正',
      };

      content += `### 节点列表\n\n`;
      tree.nodes.forEach((node, index) => {
        content += `#### ${index + 1}. ${nodeTypeLabels[node.type] || node.type}\n\n`;
        content += `${node.content}\n\n`;
        content += `- 论证强度: ${Math.round(node.strength * 100)}%\n`;
        content += `- 脆弱度: ${Math.round(node.vulnerabilityScore * 100)}%\n`;
        content += `- 版本: v${node.version}\n\n`;
      });

      if (tree.edges.length > 0) {
        content += `### 节点关系\n\n`;
        const nodeMap = new Map(tree.nodes.map(n => [n.id, n]));
        
        tree.edges.forEach((edge, index) => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (source && target) {
            const sourceLabel = source.content.length > 30 ? source.content.substring(0, 30) + '...' : source.content;
            const targetLabel = target.content.length > 30 ? target.content.substring(0, 30) + '...' : target.content;
            content += `${index + 1}. "${sourceLabel}" ${edge.relation} "${targetLabel}"\n\n`;
          }
        });
      }

      content += `---\n\n`;
    }

    if (config.includeConclusions) {
      content += `## 综合结论\n\n`;
      content += `### 核心发现\n\n`;
      
      if (triads.length > 0) {
        content += `通过辩证分析，以下是主要发现：\n\n`;
        triads.forEach((triad, index) => {
          content += `${index + 1}. **主题**: ${triad.context || '未命名'}\n`;
          content += `   - 论点强调: ${triad.thesis.keyPoints[0] || '无明确要点'}\n`;
          content += `   - 反论点质疑: ${triad.antithesis.keyPoints[0] || '无明确反驳'}\n`;
          content += `   - 合题整合: ${triad.synthesis.keyPoints[0] || '无明确整合'}\n\n`;
        });
      }

      content += `### 研究建议\n\n`;
      content += `1. 进一步验证合题中提出的整合观点\n`;
      content += `2. 收集更多实证证据支持关键论点\n`;
      content += `3. 考虑更多元的视角和反论点\n`;
      content += `4. 持续迭代和精炼论证结构\n\n`;
    }

    const filename = `${projectTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_辩证分析报告.md`;

    return {
      content,
      format: 'markdown',
      filename,
    };
  }

  exportToLatex(
    projectTitle: string,
    triads: DialecticalTriad[],
    tree?: EvolutionTree,
    config: ExportConfig
  ): ExportResult {
    let content = `\\documentclass{article}\n`;
    content += `\\usepackage{ctex}\n`;
    content += `\\usepackage{geometry}\n`;
    content += `\\geometry{a4paper, margin=1in}\n`;
    content += `\\usepackage{enumitem}\n`;
    content += `\\usepackage{hyperref}\n`;
    content += `\\hypersetup{colorlinks=true, linkcolor=blue, urlcolor=blue}\n\n`;
    content += `\\title{${projectTitle}}\n`;
    content += `\\date{\\today}\n\n`;
    content += `\\begin{document}\n\n`;
    content += `\\maketitle\n\n`;
    content += `\\section{辩证分析报告}\n\n`;
    content += `\\textit{生成时间: ${new Date().toLocaleDateString('zh-CN')}}\n\n`;

    if (triads.length > 0) {
      content += `\\section{辩证三要素分析}\n\n`;
      
      triads.forEach((triad, index) => {
        content += `\\subsection{分析 ${index + 1}: ${triad.context || '未命名主题'}}\n\n`;
        
        content += `\\subsubsection{论点 (Thesis)}\n\n`;
        content += `${this.escapeLatex(triad.thesis.content)}\n\n`;
        
        if (triad.thesis.keyPoints.length > 0) {
          content += `\\textbf{关键要点:}\n\n`;
          content += `\\begin{enumerate}[label=\\arabic*.]\n`;
          triad.thesis.keyPoints.forEach(point => {
            content += `  \\item ${this.escapeLatex(point)}\n`;
          });
          content += `\\end{enumerate}\n\n`;
        }

        if (config.includeCitations && triad.thesis.citations && triad.thesis.citations.length > 0) {
          content += `\\textbf{参考文献:}\n\n`;
          content += `\\begin{enumerate}[label=[\\arabic*]]\n`;
          triad.thesis.citations.forEach(cit => {
            content += `  \\item ${this.escapeLatex(cit)}\n`;
          });
          content += `\\end{enumerate}\n\n`;
        }

        content += `\\subsubsection{反论点 (Antithesis)}\n\n`;
        content += `${this.escapeLatex(triad.antithesis.content)}\n\n`;
        
        if (triad.antithesis.keyPoints.length > 0) {
          content += `\\textbf{关键要点:}\n\n`;
          content += `\\begin{enumerate}[label=\\arabic*.]\n`;
          triad.antithesis.keyPoints.forEach(point => {
            content += `  \\item ${this.escapeLatex(point)}\n`;
          });
          content += `\\end{enumerate}\n\n`;
        }

        if (config.includeCitations && triad.antithesis.citations && triad.antithesis.citations.length > 0) {
          content += `\\textbf{参考文献:}\n\n`;
          content += `\\begin{enumerate}[label=[\\arabic*]]\n`;
          triad.antithesis.citations.forEach(cit => {
            content += `  \\item ${this.escapeLatex(cit)}\n`;
          });
          content += `\\end{enumerate}\n\n`;
        }

        content += `\\subsubsection{合题 (Synthesis)}\n\n`;
        content += `${this.escapeLatex(triad.synthesis.content)}\n\n`;
        
        if (triad.synthesis.keyPoints.length > 0) {
          content += `\\textbf{整合要点:}\n\n`;
          content += `\\begin{enumerate}[label=\\arabic*.]\n`;
          triad.synthesis.keyPoints.forEach(point => {
            content += `  \\item ${this.escapeLatex(point)}\n`;
          });
          content += `\\end{enumerate}\n\n`;
        }

        if (triad.synthesis.reconciledPoints.length > 0) {
          content += `\\textbf{调和要点:}\n\n`;
          content += `\\begin{enumerate}[label=\\arabic*.]\n`;
          triad.synthesis.reconciledPoints.forEach(point => {
            content += `  \\item ${this.escapeLatex(point)}\n`;
          });
          content += `\\end{enumerate}\n\n`;
        }

        if (config.includeCitations && triad.synthesis.citations && triad.synthesis.citations.length > 0) {
          content += `\\textbf{参考文献:}\n\n`;
          content += `\\begin{enumerate}[label=[\\arabic*]]\n`;
          triad.synthesis.citations.forEach(cit => {
            content += `  \\item ${this.escapeLatex(cit)}\n`;
          });
          content += `\\end{enumerate}\n\n`;
        }
      });
    }

    if (tree && tree.nodes.length > 0) {
      content += `\\section{论证树结构}\n\n`;
      content += `共 ${tree.nodes.length} 个节点, ${tree.edges.length} 条边\n\n`;

      const nodeTypeLabels: Record<string, string> = {
        hypothesis: '假设',
        assumption: '前提',
        evidence: '证据',
        counterargument: '反驳',
        refinement: '修正',
      };

      content += `\\subsection{节点列表}\n\n`;
      tree.nodes.forEach((node, index) => {
        content += `\\subsubsection{${index + 1}. ${nodeTypeLabels[node.type] || node.type}}\n\n`;
        content += `${this.escapeLatex(node.content)}\n\n`;
        content += `\\begin{itemize}\n`;
        content += `  \\item 论证强度: ${Math.round(node.strength * 100)}\\%\n`;
        content += `  \\item 脆弱度: ${Math.round(node.vulnerabilityScore * 100)}\\%\n`;
        content += `  \\item 版本: v${node.version}\n`;
        content += `\\end{itemize}\n\n`;
      });

      if (tree.edges.length > 0) {
        content += `\\subsection{节点关系}\n\n`;
        const nodeMap = new Map(tree.nodes.map(n => [n.id, n]));
        
        content += `\\begin{enumerate}[label=\\arabic*.]\n`;
        tree.edges.forEach(edge => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (source && target) {
            const sourceLabel = source.content.length > 40 ? source.content.substring(0, 40) + '...' : source.content;
            const targetLabel = target.content.length > 40 ? target.content.substring(0, 40) + '...' : target.content;
            content += `  \\item \\textit{${this.escapeLatex(sourceLabel)}} ${edge.relation} \\textit{${this.escapeLatex(targetLabel)}}\n`;
          }
        });
        content += `\\end{enumerate}\n\n`;
      }
    }

    if (config.includeConclusions) {
      content += `\\section{综合结论}\n\n`;
      content += `\\subsection{核心发现}\n\n`;
      
      if (triads.length > 0) {
        content += `通过辩证分析，以下是主要发现：\n\n`;
        content += `\\begin{enumerate}[label=\\arabic*.]\n`;
        triads.forEach(triad => {
          content += `  \\item \\textbf{主题}: ${this.escapeLatex(triad.context || '未命名')}\n`;
          content += `    \\begin{itemize}\n`;
          content += `      \\item 论点强调: ${this.escapeLatex(triad.thesis.keyPoints[0] || '无明确要点')}\n`;
          content += `      \\item 反论点质疑: ${this.escapeLatex(triad.antithesis.keyPoints[0] || '无明确反驳')}\n`;
          content += `      \\item 合题整合: ${this.escapeLatex(triad.synthesis.keyPoints[0] || '无明确整合')}\n`;
          content += `    \\end{itemize}\n`;
        });
        content += `\\end{enumerate}\n\n`;
      }

      content += `\\subsection{研究建议}\n\n`;
      content += `\\begin{enumerate}[label=\\arabic*.]\n`;
      content += `  \\item 进一步验证合题中提出的整合观点\n`;
      content += `  \\item 收集更多实证证据支持关键论点\n`;
      content += `  \\item 考虑更多元的视角和反论点\n`;
      content += `  \\item 持续迭代和精炼论证结构\n`;
      content += `\\end{enumerate}\n\n`;
    }

    content += `\\end{document}\n`;

    const filename = `${projectTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_辩证分析报告.tex`;

    return {
      content,
      format: 'latex',
      filename,
    };
  }

  private escapeLatex(text: string): string {
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\$/g, '\\$')
      .replace(/%/g, '\\%')
      .replace(/&/g, '\\&')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/~/g, '\\textasciitilde{}');
  }

  export(
    projectTitle: string,
    triads: DialecticalTriad[],
    tree: EvolutionTree | undefined,
    config: ExportConfig
  ): ExportResult {
    if (config.format === 'latex') {
      return this.exportToLatex(projectTitle, triads, tree, config);
    }
    return this.exportToMarkdown(projectTitle, triads, tree, config);
  }
}

export const exportService = new ExportService();
