import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { devilAdvocateApi, projectApi } from '../api';
import type { Attack, ArgumentNode } from '../types';

const AttackPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject, tree, attacks, setAttacks, refreshData } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [attacking, setAttacking] = useState(false);
  const [selectedAttack, setSelectedAttack] = useState<Attack | null>(null);

  useEffect(() => {
    if (projectId) {
      loadData(projectId);
    }
  }, [projectId]);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const [project, attacksData] = await Promise.all([
        projectApi.get(id),
        devilAdvocateApi.getForProject(id),
      ]);
      
      setCurrentProject(project);
      setAttacks(attacksData);
    } catch (error) {
      console.error('Failed to load data:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAttack = async () => {
    if (!projectId) return;
    try {
      setAttacking(true);
      const result = await devilAdvocateApi.attackProject(projectId);
      setAttacks(prev => [...prev, ...result.attacks]);
      await refreshData();
    } catch (error) {
      console.error('Failed to run attack:', error);
    } finally {
      setAttacking(false);
    }
  };

  const getNodeContent = (nodeId: string) => {
    const node = tree?.nodes.find(n => n.id === nodeId);
    return node?.content || '未知节点';
  };

  const getNodeType = (nodeId: string) => {
    const node = tree?.nodes.find(n => n.id === nodeId);
    return node?.type || 'hypothesis';
  };

  const getAttackTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      logical_fallacy: '逻辑谬误',
      evidence_gap: '证据缺口',
      assumption_weakness: '假设薄弱',
      methodological_flaw: '方法缺陷',
      alternative_explanation: '替代解释',
    };
    return labels[type] || type;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      high: '#fa709a',
      medium: '#f093fb',
      low: '#4facfe',
    };
    return colors[severity] || '#999';
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      high: '高',
      medium: '中',
      low: '低',
    };
    return labels[severity] || severity;
  };

  const getNodeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      hypothesis: '#667eea',
      assumption: '#f093fb',
      evidence: '#4facfe',
      counterargument: '#fa709a',
      refinement: '#43e97b',
    };
    return colors[type] || '#999';
  };

  const getNodeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hypothesis: '假设',
      assumption: '前提',
      evidence: '证据',
      counterargument: '反驳',
      refinement: '修正',
    };
    return labels[type] || type;
  };

  const stats = {
    total: attacks.length,
    high: attacks.filter(a => a.severity === 'high').length,
    medium: attacks.filter(a => a.severity === 'medium').length,
    low: attacks.filter(a => a.severity === 'low').length,
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
          <h1 style={styles.title}>魔鬼代言人</h1>
          <p style={styles.subtitle}>AI审查逻辑漏洞，生成热力图</p>
        </div>
        <button 
          style={styles.attackButton} 
          onClick={handleRunAttack}
          disabled={attacking}
        >
          {attacking ? '🔍 分析中...' : '👿 一键攻击'}
        </button>
      </div>

      <div style={styles.stats}>
        {[
          { label: '总计', value: stats.total, color: '#667eea' },
          { label: '高风险', value: stats.high, color: '#fa709a' },
          { label: '中风险', value: stats.medium, color: '#f093fb' },
          { label: '低风险', value: stats.low, color: '#4facfe' },
        ].map((stat, i) => (
          <div key={i} style={styles.statCard}>
            <span style={{ ...styles.statValue, color: stat.color }}>{stat.value}</span>
            <span style={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      <div style={styles.content}>
        <div style={styles.attacksList}>
          {attacks.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>👿</span>
              <h3>还没有攻击记录</h3>
              <p>点击"一键攻击"让AI审查你的论证逻辑漏洞</p>
            </div>
          ) : (
            attacks.map((attack) => (
              <div 
                key={attack.id}
                style={{
                  ...styles.attackCard,
                  ...(selectedAttack?.id === attack.id ? styles.attackCardSelected : {}),
                }}
                onClick={() => setSelectedAttack(attack)}
              >
                <div style={styles.attackHeader}>
                  <div style={styles.attackMeta}>
                    <span style={{ 
                      ...styles.attackType, 
                      background: getSeverityColor(attack.severity) + '20',
                      color: getSeverityColor(attack.severity),
                    }}>
                      {getAttackTypeLabel(attack.type)}
                    </span>
                    <span style={{ 
                      ...styles.severity,
                      color: getSeverityColor(attack.severity),
                    }}>
                      ● {getSeverityLabel(attack.severity)}风险
                    </span>
                  </div>
                </div>
                
                <p style={styles.attackDescription}>{attack.description}</p>
                
                <div style={styles.targetNode}>
                  <span style={{
                    ...styles.nodeType,
                    background: getNodeTypeColor(getNodeType(attack.nodeId)) + '20',
                    color: getNodeTypeColor(getNodeType(attack.nodeId)),
                  }}>
                    {getNodeTypeLabel(getNodeType(attack.nodeId))}
                  </span>
                  <span style={styles.nodeContent}>
                    {getNodeContent(attack.nodeId).substring(0, 50)}...
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedAttack && (
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>攻击详情</h3>
              <button 
                style={styles.closeButton}
                onClick={() => setSelectedAttack(null)}
              >
                ✕
              </button>
            </div>

            <div style={styles.sidebarContent}>
              <div style={styles.badgeRow}>
                <span style={{ 
                  ...styles.badge, 
                  background: getSeverityColor(selectedAttack.severity) + '20',
                  color: getSeverityColor(selectedAttack.severity),
                }}>
                  {getAttackTypeLabel(selectedAttack.type)}
                </span>
                <span style={{ 
                  ...styles.badge,
                  background: getSeverityColor(selectedAttack.severity) + '20',
                  color: getSeverityColor(selectedAttack.severity),
                }}>
                  {getSeverityLabel(selectedAttack.severity)}风险
                </span>
              </div>

              <div style={styles.section}>
                <label style={styles.label}>问题描述</label>
                <p style={styles.description}>{selectedAttack.description}</p>
              </div>

              <div style={styles.section}>
                <label style={styles.label}>改进建议</label>
                <div style={styles.suggestionBox}>
                  <span style={styles.suggestionIcon}>💡</span>
                  <p style={styles.suggestion}>{selectedAttack.suggestion}</p>
                </div>
              </div>

              <div style={styles.section}>
                <label style={styles.label}>目标节点</label>
                <div style={styles.targetNodeDetail}>
                  <span style={{
                    ...styles.nodeType,
                    background: getNodeTypeColor(getNodeType(selectedAttack.nodeId)) + '20',
                    color: getNodeTypeColor(getNodeType(selectedAttack.nodeId)),
                  }}>
                    {getNodeTypeLabel(getNodeType(selectedAttack.nodeId))}
                  </span>
                  <p style={styles.targetContent}>{getNodeContent(selectedAttack.nodeId)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {tree && tree.nodes.length > 0 && (
        <div style={styles.heatmapSection}>
          <h2 style={styles.sectionTitle}>漏洞热力图</h2>
          <div style={styles.heatmap}>
            {tree.nodes.map((node, index) => {
              const nodeAttacks = attacks.filter(a => a.nodeId === node.id);
              const hasHighRisk = nodeAttacks.some(a => a.severity === 'high');
              const hasMediumRisk = nodeAttacks.some(a => a.severity === 'medium');
              
              let intensity = node.vulnerabilityScore;
              if (hasHighRisk) intensity = Math.max(intensity, 0.8);
              else if (hasMediumRisk) intensity = Math.max(intensity, 0.5);

              return (
                <div 
                  key={node.id}
                  style={{
                    ...styles.heatmapCell,
                    background: `rgba(250, 112, 154, ${intensity})`,
                    gridColumn: (index % 5) + 1,
                    gridRow: Math.floor(index / 5) + 1,
                  }}
                  title={`${getNodeTypeLabel(node.type)}: ${node.content.substring(0, 30)}...\n脆弱度: ${Math.round(intensity * 100)}%\n攻击数: ${nodeAttacks.length}`}
                >
                  <span style={styles.cellType}>{getNodeTypeLabel(node.type)}</span>
                  {nodeAttacks.length > 0 && (
                    <span style={styles.attackCount}>{nodeAttacks.length}</span>
                  )}
                </div>
              );
            })}
          </div>
          <div style={styles.heatmapLegend}>
            <span style={styles.legendLabel}>低风险</span>
            <div style={styles.legendGradient}></div>
            <span style={styles.legendLabel}>高风险</span>
          </div>
        </div>
      )}
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
    alignItems: 'center',
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
  attackButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: 'white',
    borderRadius: 12,
    padding: 20,
    textAlign: 'center' as const,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 700,
    display: 'block',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  content: {
    display: 'flex',
    gap: 24,
  },
  attacksList: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
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
  attackCard: {
    background: 'white',
    borderRadius: 12,
    padding: 20,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '2px solid transparent',
  },
  attackCardSelected: {
    borderColor: '#667eea',
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.15)',
  },
  attackHeader: {
    marginBottom: 12,
  },
  attackMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  attackType: {
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
    fontSize: 12,
  },
  severity: {
    fontSize: 13,
    fontWeight: 500,
  },
  attackDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 1.5,
    margin: '0 0 12px',
  },
  targetNode: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  nodeType: {
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    flexShrink: 0,
  },
  nodeContent: {
    fontSize: 13,
    color: '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  sidebar: {
    width: 380,
    background: 'white',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottom: '1px solid #f0f0f0',
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight:  600,
    color: '#1a1a2e',
    margin: 0,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: 'none',
    background: '#f5f5f5',
    color: '#666',
    cursor: 'pointer',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarContent: {
    padding: 20,
  },
  badgeRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    padding: '4px 12px',
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: '#999',
    display: 'block',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 1.6,
    margin: 0,
  },
  suggestionBox: {
    display: 'flex',
    gap: 12,
    padding: 16,
    background: '#fefce8',
    borderRadius: 8,
  },
  suggestionIcon: {
    fontSize: 20,
  },
  suggestion: {
    fontSize: 13,
    color: '#854d0e',
    lineHeight: 1.6,
    margin: 0,
  },
  targetNodeDetail: {},
  targetContent: {
    fontSize: 13,
    color: '#666',
    lineHeight: 1.5,
    margin: '8px 0 0',
  },
  heatmapSection: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 20px',
  },
  heatmap: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gridTemplateRows: 'repeat(3, 1fr)',
    gap: 12,
    background: 'white',
    padding: 24,
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  heatmapCell: {
    aspectRatio: '1',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as const,
    cursor: 'pointer',
    transition: 'transform 0.2s',
    position: 'relative' as const,
  },
  cellType: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: 500,
  },
  attackCount: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    background: 'rgba(0,0,0,0.3)',
    color: 'white',
    fontSize: 11,
    fontWeight: 600,
    width: 20,
    height: 20,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapLegend: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  legendLabel: {
    fontSize: 12,
    color: '#666',
  },
  legendGradient: {
    width: 200,
    height: 8,
    borderRadius: 4,
    background: 'linear-gradient(to right, rgba(250, 112, 154, 0.1), rgba(250, 112, 154, 1))',
  },
};

export default AttackPage;
