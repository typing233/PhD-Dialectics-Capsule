import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { dialecticsApi, projectApi } from '../api';
import type { DialecticalTriad, DeepSeekConfig } from '../types';

const DEFAULT_DEEPSEEK_CONFIG: DeepSeekConfig = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  maxTokens: 4096,
  temperature: 0.7,
};

const DialecticsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject, refreshData } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [triads, setTriads] = useState<DialecticalTriad[]>([]);
  const [selectedTriad, setSelectedTriad] = useState<DialecticalTriad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [config] = useState<DeepSeekConfig>(() => {
    const saved = localStorage.getItem('deepseek_config');
    return saved ? JSON.parse(saved) : DEFAULT_DEEPSEEK_CONFIG;
  });

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  const loadProject = async (id: string) => {
    try {
      setLoading(true);
      const [project, triadsData] = await Promise.all([
        projectApi.get(id),
        dialecticsApi.getTriads(id),
      ]);
      
      setCurrentProject(project);
      setTriads(triadsData);
      if (triadsData.length > 0) {
        setSelectedTriad(triadsData[0]);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTriad = async () => {
    if (!topic.trim()) {
      setError('请输入研究主题');
      return;
    }

    if (!config.apiKey) {
      setError('请先在设置中配置您的 DeepSeek API Key');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const result = await dialecticsApi.generateTriad(projectId!, topic.trim(), config.apiKey);
      
      setTriads([result.triad, ...triads]);
      setSelectedTriad(result.triad);
      setTopic('');
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成失败，请重试';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const getNodeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      thesis: '#667eea',
      antithesis: '#fa709a',
      synthesis: '#43e97b',
    };
    return colors[type] || '#667eea';
  };

  const getNodeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      thesis: '论点 (Thesis)',
      antithesis: '反论点 (Antithesis)',
      synthesis: '合题 (Synthesis)',
    };
    return labels[type] || type;
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
          <h1 style={styles.title}>⚖️ 辩证分析</h1>
          <p style={styles.subtitle}>
            基于辩证法的论点-反论点-合题分析，帮助您构建更严密的论证体系
          </p>
        </div>
      </div>

      {!config.apiKey && (
        <div style={styles.warningCard}>
          <span style={styles.warningIcon}>⚠️</span>
          <span>
            请先在 <a href="/settings" style={styles.link}>设置</a> 中配置您的 DeepSeek API Key 以启用 AI 生成功能
          </span>
        </div>
      )}

      <div style={styles.content}>
        <div style={styles.leftPanel}>
          <div style={styles.generateSection}>
            <h3 style={styles.sectionTitle}>生成新的辩证分析</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>研究主题</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：社交媒体使用与青少年抑郁之间的关系研究"
                style={styles.textarea}
                rows={4}
              />
            </div>

            {error && (
              <div style={styles.errorMessage}>
                {error}
              </div>
            )}

            <button
              onClick={handleGenerateTriad}
              disabled={generating || !config.apiKey}
              style={{ 
                ...styles.generateButton, 
                ...((generating || !config.apiKey) ? styles.disabledButton : {}) 
              }}
            >
              {generating ? '🔄 生成中...' : '✨ 生成辩证三要素'}
            </button>

            <div style={styles.tips}>
              <p style={styles.tipsTitle}>💡 提示：</p>
              <ul style={styles.tipsList}>
                <li>输入一个具体的研究问题或假设</li>
                <li>AI 将自动生成论点、反论点和合题</li>
                <li>生成的内容将添加到辩证图谱中</li>
              </ul>
            </div>
          </div>

          {triads.length > 0 && (
            <div style={styles.historySection}>
              <h3 style={styles.sectionTitle}>历史分析 ({triads.length})</h3>
              <div style={styles.triadList}>
                {triads.map((triad, index) => (
                  <div
                    key={triad.id}
                    onClick={() => setSelectedTriad(triad)}
                    style={{
                      ...styles.triadItem,
                      ...(selectedTriad?.id === triad.id ? styles.selectedTriad : {}),
                    }}
                  >
                    <div style={styles.triadHeader}>
                      <span style={styles.triadIndex}>#{index + 1}</span>
                      <span style={styles.triadDate}>
                        {new Date(triad.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <p style={styles.triadContext}>
                      {triad.context.length > 50 ? triad.context.substring(0, 50) + '...' : triad.context}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={styles.rightPanel}>
          {selectedTriad ? (
            <div style={styles.triadDetail}>
              <div style={styles.detailHeader}>
                <h2 style={styles.detailTitle}>辩证分析详情</h2>
                <p style={styles.detailContext}>{selectedTriad.context}</p>
              </div>

              <div style={styles.triadCards}>
                <div 
                  style={{ 
                    ...styles.elementCard, 
                    borderLeftColor: getNodeTypeColor('thesis') 
                  }}
                >
                  <div style={styles.elementHeader}>
                    <span style={{ ...styles.elementIcon, background: getNodeTypeColor('thesis') }}>
                      📜
                    </span>
                    <span style={styles.elementTitle}>{getNodeTypeLabel('thesis')}</span>
                  </div>
                  <p style={styles.elementContent}>{selectedTriad.thesis.content}</p>
                  
                  {selectedTriad.thesis.keyPoints.length > 0 && (
                    <div style={styles.keyPoints}>
                      <span style={styles.keyPointsTitle}>关键要点：</span>
                      <ul style={styles.keyPointsList}>
                        {selectedTriad.thesis.keyPoints.map((point, i) => (
                          <li key={i} style={styles.keyPointItem}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedTriad.thesis.citations && selectedTriad.thesis.citations.length > 0 && (
                    <div style={styles.citations}>
                      <span style={styles.citationsTitle}>参考文献建议：</span>
                      <ul style={styles.citationsList}>
                        {selectedTriad.thesis.citations.map((cit, i) => (
                          <li key={i} style={styles.citationItem}>{cit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div 
                  style={{ 
                    ...styles.elementCard, 
                    borderLeftColor: getNodeTypeColor('antithesis') 
                  }}
                >
                  <div style={styles.elementHeader}>
                    <span style={{ ...styles.elementIcon, background: getNodeTypeColor('antithesis') }}>
                      ⚔️
                    </span>
                    <span style={styles.elementTitle}>{getNodeTypeLabel('antithesis')}</span>
                  </div>
                  <p style={styles.elementContent}>{selectedTriad.antithesis.content}</p>
                  
                  {selectedTriad.antithesis.keyPoints.length > 0 && (
                    <div style={styles.keyPoints}>
                      <span style={styles.keyPointsTitle}>反驳要点：</span>
                      <ul style={styles.keyPointsList}>
                        {selectedTriad.antithesis.keyPoints.map((point, i) => (
                          <li key={i} style={styles.keyPointItem}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedTriad.antithesis.citations && selectedTriad.antithesis.citations.length > 0 && (
                    <div style={styles.citations}>
                      <span style={styles.citationsTitle}>参考文献建议：</span>
                      <ul style={styles.citationsList}>
                        {selectedTriad.antithesis.citations.map((cit, i) => (
                          <li key={i} style={styles.citationItem}>{cit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div 
                  style={{ 
                    ...styles.elementCard, 
                    ...styles.synthesisCard,
                    borderLeftColor: getNodeTypeColor('synthesis') 
                  }}
                >
                  <div style={styles.elementHeader}>
                    <span style={{ ...styles.elementIcon, background: getNodeTypeColor('synthesis') }}>
                      🔗
                    </span>
                    <span style={styles.elementTitle}>{getNodeTypeLabel('synthesis')}</span>
                  </div>
                  <p style={styles.elementContent}>{selectedTriad.synthesis.content}</p>
                  
                  {selectedTriad.synthesis.keyPoints.length > 0 && (
                    <div style={styles.keyPoints}>
                      <span style={styles.keyPointsTitle}>整合要点：</span>
                      <ul style={styles.keyPointsList}>
                        {selectedTriad.synthesis.keyPoints.map((point, i) => (
                          <li key={i} style={styles.keyPointItem}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedTriad.synthesis.reconciledPoints.length > 0 && (
                    <div style={styles.reconciledPoints}>
                      <span style={styles.reconciledTitle}>调和要点：</span>
                      <ul style={styles.reconciledList}>
                        {selectedTriad.synthesis.reconciledPoints.map((point, i) => (
                          <li key={i} style={styles.reconciledItem}>✓ {point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedTriad.synthesis.citations && selectedTriad.synthesis.citations.length > 0 && (
                    <div style={styles.citations}>
                      <span style={styles.citationsTitle}>参考文献建议：</span>
                      <ul style={styles.citationsList}>
                        {selectedTriad.synthesis.citations.map((cit, i) => (
                          <li key={i} style={styles.citationItem}>{cit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>⚖️</div>
              <h3 style={styles.emptyTitle}>暂无辩证分析</h3>
              <p style={styles.emptyDesc}>
                在左侧输入研究主题，点击"生成辩证三要素"按钮开始分析
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: 24,
    maxWidth: 1600,
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
    marginBottom: 24,
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
  warningCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    background: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: 8,
    marginBottom: 24,
  },
  warningIcon: {
    fontSize: 20,
  },
  link: {
    color: '#667eea',
    textDecoration: 'underline',
  },
  content: {
    display: 'flex',
    gap: 24,
  },
  leftPanel: {
    width: 420,
    flexShrink: 0,
  },
  rightPanel: {
    flex: 1,
  },
  generateSection: {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 16px',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    color: '#333',
    marginBottom: 8,
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  errorMessage: {
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 16,
  },
  generateButton: {
    width: '100%',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  tips: {
    marginTop: 20,
    padding: 16,
    background: '#f8f9fa',
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#667eea',
    margin: '0 0 8px',
  },
  tipsList: {
    margin: 0,
    paddingLeft: 20,
  },
  historySection: {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  triadList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  triadItem: {
    padding: 12,
    background: '#f8f9fa',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '2px solid transparent',
  },
  selectedTriad: {
    borderColor: '#667eea',
    background: 'rgba(102,126,234,0.05)',
  },
  triadHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  triadIndex: {
    fontSize: 12,
    fontWeight: 600,
    color: '#667eea',
  },
  triadDate: {
    fontSize: 12,
    color: '#999',
  },
  triadContext: {
    fontSize: 13,
    color: '#666',
    margin: 0,
    lineHeight: 1.5,
  },
  triadDetail: {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  detailHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1px solid #f0f0f0',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 8px',
  },
  detailContext: {
    fontSize: 14,
    color: '#666',
    margin: 0,
  },
  triadCards: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  elementCard: {
    padding: 20,
    background: '#fafbfc',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid' as const,
  },
  synthesisCard: {
    background: 'linear-gradient(135deg, rgba(67,233,123,0.1) 0%, rgba(56,249,215,0.1) 100%)',
  },
  elementHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  elementIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
  },
  elementTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a2e',
  },
  elementContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 1.7,
    margin: '0 0 16px',
  },
  keyPoints: {
    marginBottom: 12,
  },
  keyPointsTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#666',
    display: 'block',
    marginBottom: 8,
  },
  keyPointsList: {
    margin: 0,
    paddingLeft: 20,
  },
  keyPointItem: {
    fontSize: 13,
    color: '#555',
    lineHeight: 1.6,
    marginBottom: 4,
  },
  reconciledPoints: {
    marginBottom: 12,
    padding: 12,
    background: 'rgba(67,233,123,0.1)',
    borderRadius: 8,
  },
  reconciledTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#2d8659',
    display: 'block',
    marginBottom: 8,
  },
  reconciledList: {
    margin: 0,
    paddingLeft: 20,
  },
  reconciledItem: {
    fontSize: 13,
    color: '#2d8659',
    lineHeight: 1.6,
    marginBottom: 4,
  },
  citations: {
    padding: 12,
    background: 'rgba(102,126,234,0.05)',
    borderRadius: 8,
  },
  citationsTitle: {
    fontSize: 12,
    fontWeight: 500,
    color: '#667eea',
    display: 'block',
    marginBottom: 6,
  },
  citationsList: {
    margin: 0,
    paddingLeft: 16,
  },
  citationItem: {
    fontSize: 12,
    color: '#666',
    lineHeight: 1.5,
    fontFamily: 'monospace',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 80,
    background: 'white',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#333',
    margin: '0 0 8px',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#999',
    margin: 0,
    textAlign: 'center' as const,
    lineHeight: 1.6,
  },
};

export default DialecticsPage;
