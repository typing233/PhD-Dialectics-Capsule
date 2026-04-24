import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { crossDisciplinaryApi, projectApi } from '../api';
import type { CrossDisciplinaryInsight } from '../types';

const CrossDisciplinaryPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject, messages } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [insights, setInsights] = useState<CrossDisciplinaryInsight[]>([]);
  const [researchField, setResearchField] = useState('');
  const [selectedInsight, setSelectedInsight] = useState<CrossDisciplinaryInsight | null>(null);

  useEffect(() => {
    if (projectId) {
      loadData(projectId);
    }
  }, [projectId]);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const [project, insightsData] = await Promise.all([
        projectApi.get(id),
        crossDisciplinaryApi.get(id),
      ]);
      
      setCurrentProject(project);
      setInsights(insightsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!projectId) return;
    try {
      setGenerating(true);
      const context = messages.map(m => m.content).join('\n');
      const result = await crossDisciplinaryApi.generate(projectId, context, researchField || undefined);
      setInsights(prev => [...prev, ...result]);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.7) return '#43e97b';
    if (relevance >= 0.5) return '#f093fb';
    return '#4facfe';
  };

  const getFieldIcon = (field: string) => {
    const icons: Record<string, string> = {
      '物理学': '⚛️',
      '生物学': '🧬',
      '计算机科学': '💻',
      '经济学': '📊',
      '心理学': '🧠',
      '社会学': '👥',
      '数学': '🔢',
      '语言学': '📚',
    };
    return icons[field] || '🔬';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>跨学科嫁接器</h1>
          <p style={styles.subtitle}>从其他领域获取范式灵感</p>
        </div>
        <div style={styles.headerActions}>
          <input
            style={styles.fieldInput}
            type="text"
            value={researchField}
            onChange={(e) => setResearchField(e.target.value)}
            placeholder="你的研究领域（可选）"
          />
          <button 
            style={styles.generateButton} 
            onClick={handleGenerateInsights}
            disabled={generating}
          >
            {generating ? '🔍 探索中...' : '🔬 探索灵感'}
          </button>
        </div>
      </div>

      <div style={styles.features}>
        {[
          { icon: '⚛️', title: '物理学', desc: '热力学、动力学、系统论' },
          { icon: '🧬', title: '生物学', desc: '进化论、生态学、遗传学' },
          { icon: '💻', title: '计算机科学', desc: '算法、机器学习、网络理论' },
          { icon: '📊', title: '经济学', desc: '博弈论、激励机制、市场分析' },
          { icon: '🧠', title: '心理学', desc: '认知偏差、行为模式、决策科学' },
          { icon: '👥', title: '社会学', desc: '网络分析、社会资本、扩散理论' },
          { icon: '🔢', title: '数学', desc: '动力系统、混沌理论、拓扑学' },
          { icon: '📚', title: '语言学', desc: '话语分析、框架理论、叙事结构' },
        ].map((feature, i) => (
          <div key={i} style={styles.featureCard}>
            <span style={styles.featureIcon}>{feature.icon}</span>
            <h3 style={styles.featureTitle}>{feature.title}</h3>
            <p style={styles.featureDesc}>{feature.desc}</p>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>已获取的灵感</h2>
        
        {insights.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🔬</span>
            <h3>还没有跨学科灵感</h3>
            <p>点击"探索灵感"让AI从其他学科中寻找可嫁接的范式</p>
          </div>
        ) : (
          <div style={styles.insightsGrid}>
            {insights.map((insight) => (
              <div 
                key={insight.id}
                style={{
                  ...styles.insightCard,
                  ...(selectedInsight?.id === insight.id ? styles.insightCardSelected : {}),
                }}
                onClick={() => setSelectedInsight(selectedInsight?.id === insight.id ? null : insight)}
              >
                <div style={styles.insightHeader}>
                  <div style={styles.insightSource}>
                    <span style={styles.fieldIcon}>{getFieldIcon(insight.sourceField)}</span>
                    <span style={styles.fieldName}>{insight.sourceField}</span>
                  </div>
                  <div style={styles.relevance}>
                    <span style={{ 
                      ...styles.relevanceBar,
                      width: `${insight.relevance * 100}%`,
                      background: getRelevanceColor(insight.relevance),
                    }}></span>
                    <span style={styles.relevanceText}>
                      {Math.round(insight.relevance * 100)}% 相关
                    </span>
                  </div>
                </div>
                
                <h3 style={styles.paradigmTitle}>{insight.paradigm}</h3>
                <p style={styles.methodology}>{insight.methodology}</p>
                
                {selectedInsight?.id === insight.id && (
                  <div style={styles.expandedContent}>
                    <div style={styles.applicationSection}>
                      <span style={styles.applicationLabel}>💡 可能的应用</span>
                      <p style={styles.applicationText}>{insight.targetApplication}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.guideSection}>
        <h2 style={styles.sectionTitle}>如何使用跨学科嫁接器</h2>
        <div style={styles.steps}>
          {[
            { step: 1, title: '探索灵感', desc: '点击"探索灵感"按钮，让AI从8个不同学科中寻找与你的研究相关的范式和方法。' },
            { step: 2, title: '评估相关性', desc: '查看每个灵感的相关度评分，优先考虑高相关性的跨学科视角。' },
            { step: 3, title: '深入理解', desc: '点击灵感卡片展开详情，了解该学科范式的具体方法论和潜在应用。' },
            { step: 4, title: '嫁接融合', desc: '思考如何将其他学科的理论框架或研究方法应用到你的研究中，创造独特的研究视角。' },
          ].map((item, i) => (
            <div key={i} style={styles.stepCard}>
              <div style={styles.stepNumber}>{item.step}</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>{item.title}</h3>
                <p style={styles.stepDesc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: 24,
    maxWidth: 1400,
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 'calc(100vh - 60px)',
  },
  loading: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    flexWrap: 'wrap' as const,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1a1a2e',
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  fieldInput: {
    padding: '10px 16px',
    fontSize: 14,
    border: '2px solid #e5e5e5',
    borderRadius: 8,
    outline: 'none',
    width: 200,
    transition: 'border-color 0.2s',
  },
  generateButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 40,
  },
  featureCard: {
    background: 'white',
    borderRadius: 12,
    padding: 20,
    textAlign: 'center' as const,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
    display: 'block',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 6px',
  },
  featureDesc: {
    fontSize: 12,
    color: '#666',
    margin: 0,
    lineHeight: 1.4,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 20px',
  },
  emptyState: {
    background: 'white',
    borderRadius: 16,
    padding: 60,
    textAlign: 'center' as const,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    display: 'block',
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  },
  insightCard: {
    background: 'white',
    borderRadius: 12,
    padding: 20,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '2px solid transparent',
  },
  insightCardSelected: {
    borderColor: '#4facfe',
    boxShadow: '0 4px 16px rgba(79, 172, 254, 0.15)',
  },
  insightHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightSource: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  fieldIcon: {
    fontSize: 20,
  },
  fieldName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1a1a2e',
  },
  relevance: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: 4,
  },
  relevanceBar: {
    height: 4,
    borderRadius: 2,
    transition: 'width 0.3s',
  },
  relevanceText: {
    fontSize: 11,
    color: '#999',
  },
  paradigmTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 8px',
  },
  methodology: {
    fontSize: 13,
    color: '#666',
    lineHeight: 1.5,
    margin: 0,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid #f0f0f0',
  },
  applicationSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  applicationLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#4facfe',
  },
  applicationText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 1.5,
    margin: 0,
    padding: 12,
    background: '#f0f9ff',
    borderRadius: 8,
  },
  guideSection: {
    marginTop: 40,
  },
  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
  },
  stepCard: {
    display: 'flex',
    gap: 16,
    background: 'white',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 6px',
  },
  stepDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 1.5,
    margin: 0,
  },
};

export default CrossDisciplinaryPage;
