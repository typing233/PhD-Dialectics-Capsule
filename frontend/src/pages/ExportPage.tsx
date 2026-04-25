import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { exportApi, projectApi, dialecticsApi } from '../api';
import { downloadFile } from '../api';
import type { ExportConfig, DialecticalTriad, DeepSeekConfig } from '../types';

const DEFAULT_DEEPSEEK_CONFIG: DeepSeekConfig = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  maxTokens: 4096,
  temperature: 0.7,
};

const ExportPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [triads, setTriads] = useState<DialecticalTriad[]>([]);
  const [selectedTriads, setSelectedTriads] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<{ content: string; filename: string } | null>(null);
  
  const [config] = useState<DeepSeekConfig>(() => {
    const saved = localStorage.getItem('deepseek_config');
    return saved ? JSON.parse(saved) : DEFAULT_DEEPSEEK_CONFIG;
  });

  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'markdown',
    includeCitations: true,
    includeGraphVisualization: true,
    includeConclusions: true,
  });

  useEffect(() => {
    if (projectId) {
      loadData(projectId);
    }
  }, [projectId]);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const [project, triadsData] = await Promise.all([
        projectApi.get(id),
        dialecticsApi.getTriads(id),
      ]);
      
      setCurrentProject(project);
      setTriads(triadsData);
      if (triadsData.length > 0) {
        setSelectedTriads(triadsData.map(t => t.id));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const toggleTriadSelection = (triadId: string) => {
    setSelectedTriads(prev => {
      if (prev.includes(triadId)) {
        return prev.filter(id => id !== triadId);
      }
      return [...prev, triadId];
    });
  };

  const selectAllTriads = () => {
    setSelectedTriads(triads.map(t => t.id));
  };

  const deselectAllTriads = () => {
    setSelectedTriads([]);
  };

  const handleExport = async () => {
    if (!projectId || selectedTriads.length === 0) {
      setError('请选择至少一个辩证分析');
      return;
    }

    try {
      setExporting(true);
      setError(null);
      setExportResult(null);

      const result = await exportApi.export(projectId, {
        ...exportConfig,
        selectedTriadIds: selectedTriads,
      } as any);

      setExportResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败，请重试';
      setError(message);
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportResult) return;
    
    const mimeType = exportConfig.format === 'latex' ? 'application/x-latex' : 'text/markdown';
    downloadFile(exportResult.content, exportResult.filename, mimeType);
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
          <h1 style={styles.title}>📄 导出辩证分析报告</h1>
          <p style={styles.subtitle}>
            一键导出辩证分析报告为 LaTeX 或 Markdown 格式，自动包含引用关系与综合结论框架
          </p>
        </div>
      </div>

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      <div style={styles.content}>
        <div style={styles.leftPanel}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📊 选择要导出的辩证分析</h2>
            <p style={styles.sectionDesc}>选择需要包含在报告中的辩证分析三要素</p>
            
            {triads.length === 0 ? (
              <div style={styles.emptyTriads}>
                <div style={styles.emptyIcon}>📋</div>
                <p style={styles.emptyText}>暂无辩证分析记录</p>
                <p style={styles.emptyHint}>请先在"辩证分析"页面生成辩证三要素</p>
              </div>
            ) : (
              <>
                <div style={styles.selectionActions}>
                  <span style={styles.selectionCount}>
                    已选择 {selectedTriads.length}/{triads.length} 项
                  </span>
                  <div style={styles.selectionButtons}>
                    <button onClick={selectAllTriads} style={styles.smallButton}>
                      全选
                    </button>
                    <button onClick={deselectAllTriads} style={styles.smallButton}>
                      清空
                    </button>
                  </div>
                </div>

                <div style={styles.triadsList}>
                  {triads.map((triad, index) => (
                    <div
                      key={triad.id}
                      onClick={() => toggleTriadSelection(triad.id)}
                      style={{
                        ...styles.triadCard,
                        ...(selectedTriads.includes(triad.id) ? styles.selectedCard : {}),
                      }}
                    >
                      <div style={styles.triadHeader}>
                        <div style={styles.checkbox}>
                          <span style={styles.checkmark}>
                            {selectedTriads.includes(triad.id) ? '✓' : ''}
                          </span>
                        </div>
                        <div style={styles.triadInfo}>
                          <span style={styles.triadIndex}>#{index + 1}</span>
                          <span style={styles.triadDate}>
                            {new Date(triad.createdAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </div>
                      <p style={styles.triadContext}>
                        {triad.context.length > 80 
                          ? triad.context.substring(0, 80) + '...' 
                          : triad.context}
                      </p>
                      <div style={styles.triadSummary}>
                        <div style={styles.elementTag}>
                          <span style={{ ...styles.elementDot, background: getNodeTypeColor('thesis') }} />
                          <span style={styles.elementText}>论点</span>
                        </div>
                        <div style={styles.elementTag}>
                          <span style={{ ...styles.elementDot, background: getNodeTypeColor('antithesis') }} />
                          <span style={styles.elementText}>反论点</span>
                        </div>
                        <div style={styles.elementTag}>
                          <span style={{ ...styles.elementDot, background: getNodeTypeColor('synthesis') }} />
                          <span style={styles.elementText}>合题</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>⚙️ 导出配置</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>导出格式</label>
              <div style={styles.formatOptions}>
                <button
                  onClick={() => setExportConfig({ ...exportConfig, format: 'markdown' })}
                  style={{
                    ...styles.formatButton,
                    ...(exportConfig.format === 'markdown' ? styles.activeFormat : {}),
                  }}
                >
                  <span style={styles.formatIcon}>📝</span>
                  <div style={styles.formatInfo}>
                    <span style={styles.formatName}>Markdown</span>
                    <span style={styles.formatDesc}>通用格式，适合预览和分享</span>
                  </div>
                </button>
                <button
                  onClick={() => setExportConfig({ ...exportConfig, format: 'latex' })}
                  style={{
                    ...styles.formatButton,
                    ...(exportConfig.format === 'latex' ? styles.activeFormat : {}),
                  }}
                >
                  <span style={styles.formatIcon}>📄</span>
                  <div style={styles.formatInfo}>
                    <span style={styles.formatName}>LaTeX</span>
                    <span style={styles.formatDesc}>学术格式，适合论文发表</span>
                  </div>
                </button>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>包含内容</label>
              <div style={styles.optionsList}>
                <label style={styles.optionLabel}>
                  <input
                    type="checkbox"
                    checked={exportConfig.includeCitations}
                    onChange={(e) => setExportConfig({ ...exportConfig, includeCitations: e.target.checked })}
                    style={styles.checkboxInput}
                  />
                  <span style={styles.optionText}>
                    <strong>参考文献引用</strong>
                    <span style={styles.optionHint}>包含建议的参考文献列表</span>
                  </span>
                </label>
                <label style={styles.optionLabel}>
                  <input
                    type="checkbox"
                    checked={exportConfig.includeGraphVisualization}
                    onChange={(e) => setExportConfig({ ...exportConfig, includeGraphVisualization: e.target.checked })}
                    style={styles.checkboxInput}
                  />
                  <span style={styles.optionText}>
                    <strong>辩证图谱可视化</strong>
                    <span style={styles.optionHint}>包含节点关系描述</span>
                  </span>
                </label>
                <label style={styles.optionLabel}>
                  <input
                    type="checkbox"
                    checked={exportConfig.includeConclusions}
                    onChange={(e) => setExportConfig({ ...exportConfig, includeConclusions: e.target.checked })}
                    style={styles.checkboxInput}
                  />
                  <span style={styles.optionText}>
                    <strong>综合结论框架</strong>
                    <span style={styles.optionHint}>包含分析总结和未来研究方向</span>
                  </span>
                </label>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={exporting || selectedTriads.length === 0}
              style={{
                ...styles.exportButton,
                ...((exporting || selectedTriads.length === 0) ? styles.disabledButton : {}),
              }}
            >
              {exporting ? '🔄 生成报告中...' : '✨ 生成并导出报告'}
            </button>

            {selectedTriads.length === 0 && (
              <p style={styles.warningText}>请至少选择一个辩证分析</p>
            )}
          </div>

          {exportResult && (
            <div style={styles.resultSection}>
              <div style={styles.resultHeader}>
                <h3 style={styles.resultTitle}>✅ 报告生成成功！</h3>
                <span style={styles.resultFilename}>{exportResult.filename}</span>
              </div>

              <div style={styles.preview}>
                <div style={styles.previewHeader}>
                  <span style={styles.previewTitle}>内容预览</span>
                  <span style={styles.previewFormat}>
                    {exportConfig.format === 'markdown' ? 'Markdown' : 'LaTeX'} 格式
                  </span>
                </div>
                <pre style={styles.previewContent}>
                  {exportResult.content.length > 2000
                    ? exportResult.content.substring(0, 2000) + '\n\n... (内容已截断，请下载查看完整内容)'
                    : exportResult.content}
                </pre>
              </div>

              <button
                onClick={handleDownload}
                style={styles.downloadButton}
              >
                📥 下载报告
              </button>
            </div>
          )}

          <div style={styles.infoSection}>
            <h3 style={styles.infoTitle}>💡 导出说明</h3>
            <div style={styles.infoList}>
              <div style={styles.infoItem}>
                <span style={styles.infoIcon}>📝</span>
                <div>
                  <strong>Markdown 格式</strong>
                  <p style={styles.infoDesc}>适用于 GitHub、Notion 等平台，支持在线预览和复制</p>
                </div>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoIcon}>📄</span>
                <div>
                  <strong>LaTeX 格式</strong>
                  <p style={styles.infoDesc}>适用于 Overleaf 等 LaTeX 编辑器，可直接用于学术论文</p>
                </div>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoIcon}>📚</span>
                <div>
                  <strong>参考文献</strong>
                  <p style={styles.infoDesc}>包含建议的参考文献格式，可直接用于文献管理工具</p>
                </div>
              </div>
            </div>
          </div>
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
  errorMessage: {
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 16,
  },
  content: {
    display: 'flex',
    gap: 24,
  },
  leftPanel: {
    width: 500,
    flexShrink: 0,
  },
  rightPanel: {
    flex: 1,
    minWidth: 0,
  },
  section: {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 8px',
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    margin: '0 0 20px',
  },
  emptyTriads: {
    textAlign: 'center' as const,
    padding: 60,
    background: '#f8f9fa',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#666',
    margin: '0 0 8px',
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
    margin: 0,
  },
  selectionActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #f0f0f0',
  },
  selectionCount: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: 600,
  },
  selectionButtons: {
    display: 'flex',
    gap: 8,
  },
  smallButton: {
    padding: '6px 12px',
    background: 'transparent',
    color: '#667eea',
    border: '1px solid #667eea',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
  },
  triadsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    maxHeight: 600,
    overflowY: 'auto' as const,
    paddingRight: 4,
  },
  triadCard: {
    padding: 16,
    background: '#f8f9fa',
    borderRadius: 12,
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.2s',
  },
  selectedCard: {
    borderColor: '#667eea',
    background: 'rgba(102,126,234,0.05)',
  },
  triadHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    border: '2px solid #667eea',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'white',
    flexShrink: 0,
  },
  checkmark: {
    fontSize: 14,
    color: 'white',
    fontWeight: 700,
  },
  triadInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  triadIndex: {
    fontSize: 13,
    fontWeight: 600,
    color: '#667eea',
  },
  triadDate: {
    fontSize: 12,
    color: '#999',
  },
  triadContext: {
    fontSize: 14,
    color: '#333',
    margin: '0 0 12px',
    lineHeight: 1.6,
  },
  triadSummary: {
    display: 'flex',
    gap: 16,
  },
  elementTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  elementDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  elementText: {
    fontSize: 12,
    color: '#666',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
    marginBottom: 12,
  },
  formatOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  formatButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    background: '#f8f9fa',
    border: '2px solid #e0e0e0',
    borderRadius: 12,
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  activeFormat: {
    borderColor: '#667eea',
    background: 'rgba(102,126,234,0.05)',
  },
  formatIcon: {
    fontSize: 28,
  },
  formatInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  formatName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1a1a2e',
  },
  formatDesc: {
    fontSize: 12,
    color: '#666',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    background: '#f8f9fa',
    borderRadius: 8,
    cursor: 'pointer',
  },
  checkboxInput: {
    width: 18,
    height: 18,
    marginTop: 2,
    cursor: 'pointer',
  },
  optionText: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  optionHint: {
    fontSize: 12,
    color: '#999',
  },
  exportButton: {
    width: '100%',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  warningText: {
    fontSize: 13,
    color: '#fa709a',
    textAlign: 'center' as const,
    marginTop: 12,
  },
  resultSection: {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '2px solid #43e97b',
  },
  resultHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px solid #f0f0f0',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#2d8659',
    margin: '0 0 8px',
  },
  resultFilename: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  preview: {
    background: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden' as const,
    marginBottom: 20,
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#e9ecef',
    borderBottom: '1px solid #dee2e6',
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1a1a2e',
  },
  previewFormat: {
    fontSize: 12,
    color: '#666',
  },
  previewContent: {
    padding: 16,
    margin: 0,
    fontSize: 12,
    lineHeight: 1.6,
    color: '#333',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    maxHeight: 400,
    overflowY: 'auto' as const,
    fontFamily: 'monospace',
  },
  downloadButton: {
    width: '100%',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  infoSection: {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 16px',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  infoItem: {
    display: 'flex',
    gap: 12,
    padding: 12,
    background: '#f8f9fa',
    borderRadius: 8,
  },
  infoIcon: {
    fontSize: 24,
    flexShrink: 0,
  },
  infoDesc: {
    fontSize: 13,
    color: '#666',
    margin: '4px 0 0',
    lineHeight: 1.5,
  },
};

export default ExportPage;
