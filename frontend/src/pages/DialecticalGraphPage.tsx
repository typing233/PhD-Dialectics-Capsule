import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { dialecticsApi, projectApi } from '../api';
import type { DialecticalGraph, DialecticalNode, DialecticalEdge, DialecticalTriad } from '../types';
import * as d3 from 'd3';

interface DraggedNode {
  id: string;
  x: number;
  y: number;
}

const DialecticalGraphPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [graph, setGraph] = useState<DialecticalGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<DialecticalNode | null>(null);
  const [selectedTriad, setSelectedTriad] = useState<DialecticalTriad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSource, setMergeSource] = useState<DialecticalNode | null>(null);
  const [mergeTarget, setMergeTarget] = useState<DialecticalNode | null>(null);
  const [mergeType, setMergeType] = useState<'reconcile' | 'synthesize'>('synthesize');
  const [merging, setMerging] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<DialecticalNode, undefined> | null>(null);

  useEffect(() => {
    if (projectId) {
      loadData(projectId);
    }
  }, [projectId]);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const [project, graphData] = await Promise.all([
        projectApi.get(id),
        dialecticsApi.getGraph(id),
      ]);
      
      setCurrentProject(project);
      setGraph(graphData);
      if (graphData.triads.length > 0) {
        setSelectedTriad(graphData.triads[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      thesis: '#667eea',
      antithesis: '#fa709a',
      synthesis: '#43e97b',
      branch: '#f093fb',
    };
    return colors[type] || '#667eea';
  };

  const getNodeLabel = (type: string) => {
    const labels: Record<string, string> = {
      thesis: '论点',
      antithesis: '反论点',
      synthesis: '合题',
      branch: '分支',
    };
    return labels[type] || type;
  };

  const getEdgeColor = (relation: string) => {
    const colors: Record<string, string> = {
      supports: '#43e97b',
      challenges: '#fa709a',
      evolves_from: '#667eea',
      reconciles: '#f093fb',
      branches: '#f5af19',
    };
    return colors[relation] || '#999';
  };

  const getEdgeArrow = (relation: string) => {
    const arrows: Record<string, string> = {
      supports: '支持',
      challenges: '挑战',
      evolves_from: '进化',
      reconciles: '调和',
      branches: '分支',
    };
    return arrows[relation] || relation;
  };

  const handleNodeDrag = useCallback((nodeId: string, x: number, y: number) => {
    if (!graph) return;
    
    setGraph(prev => {
      if (!prev) return prev;
      const updatedNodes = prev.nodes.map(n => 
        n.id === nodeId ? { ...n, position: { x, y } } : n
      );
      return { ...prev, nodes: updatedNodes };
    });
  }, [graph]);

  const handleNodeClick = (node: DialecticalNode) => {
    if (mergeMode) {
      if (!mergeSource) {
        setMergeSource(node);
      } else if (node.id !== mergeSource.id) {
        setMergeTarget(node);
      }
    } else {
      setSelectedNode(node);
    }
  };

  const handleMergeBranches = async () => {
    if (!mergeSource || !mergeTarget || !projectId) return;
    
    try {
      setMerging(true);
      setError(null);
      
      const mergedNode = await dialecticsApi.mergeBranches(
        projectId, 
        mergeSource.id, 
        mergeTarget.id, 
        mergeType
      );
      
      setMergeMode(false);
      setMergeSource(null);
      setMergeTarget(null);
      
      await loadData(projectId);
    } catch (error) {
      const message = error instanceof Error ? error.message : '合并失败，请重试';
      setError(message);
    } finally {
      setMerging(false);
    }
  };

  const handleCreateBranch = async (parentNodeId: string, branchContent: string, branchType: DialecticalNode['type']) => {
    if (!projectId) return;
    
    try {
      await dialecticsApi.createBranch(projectId, parentNodeId, branchContent, branchType);
      await loadData(projectId);
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建分支失败';
      setError(message);
    }
  };

  useEffect(() => {
    if (!svgRef.current || !graph || loading) return;

    const container = containerRef.current;
    const width = container ? container.clientWidth : 900;
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    
    const arrows = ['supports', 'challenges', 'evolves_from', 'reconciles', 'branches'];
    arrows.forEach(relation => {
      defs.append('marker')
        .attr('id', `arrow-${relation}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 35)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', getEdgeColor(relation));
    });

    const g = svg.append('g').attr('class', 'graph-container');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);

    const nodes = graph.nodes.map(n => ({
      ...n,
      x: n.position.x || width / 2,
      y: n.position.y || height / 2,
    }));

    const edges = graph.edges.map(e => ({
      ...e,
      source: e.sourceId,
      target: e.targetId,
    }));

    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('g')
      .data(edges)
      .enter()
      .append('g')
      .attr('class', 'edge-group');

    link.append('path')
      .attr('class', 'edge')
      .attr('fill', 'none')
      .attr('stroke', d => getEdgeColor(d.relation))
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', d => `url(#arrow-${d.relation})`);

    link.append('text')
      .attr('class', 'edge-label')
      .attr('text-anchor', 'middle')
      .attr('dy', -8)
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .text(d => getEdgeArrow(d.relation));

    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer');

    const nodeRadius = 28;

    node.append('circle')
      .attr('class', 'node-circle')
      .attr('r', nodeRadius)
      .attr('fill', d => getNodeColor(d.type))
      .attr('stroke', d => {
        if (selectedNode?.id === d.id) return '#1a1a2e';
        if (mergeSource?.id === d.id) return '#f5af19';
        if (mergeTarget?.id === d.id) return '#f5af19';
        return 'white';
      })
      .attr('stroke-width', d => {
        if (selectedNode?.id === d.id || mergeSource?.id === d.id || mergeTarget?.id === d.id) return 4;
        return 2;
      });

    node.append('text')
      .attr('class', 'node-icon')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('font-size', '18px')
      .text(d => {
        const icons: Record<string, string> = {
          thesis: '📜',
          antithesis: '⚔️',
          synthesis: '🔗',
          branch: '🌿',
        };
        return icons[d.type] || '📌';
      });

    node.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', nodeRadius + 16)
      .attr('font-size', '11px')
      .attr('fill', '#333')
      .attr('font-weight', '500')
      .text(d => {
        const content = d.content || getNodeLabel(d.type);
        return content.length > 12 ? content.substring(0, 12) + '...' : content;
      });

    node.append('text')
      .attr('class', 'node-type-badge')
      .attr('text-anchor', 'middle')
      .attr('dy', -nodeRadius - 8)
      .attr('font-size', '10px')
      .attr('fill', d => getNodeColor(d.type))
      .attr('font-weight', '600')
      .text(d => getNodeLabel(d.type));

    node.call(d3.drag<SVGGElement, DialecticalNode>()
      .on('start', (event, d) => {
        if (!event.active && simulationRef.current) {
          simulationRef.current.alphaTarget(0.3).restart();
        }
        (d as any).fx = d.x;
        (d as any).fy = d.y;
      })
      .on('drag', (event, d) => {
        (d as any).fx = event.x;
        (d as any).fy = event.y;
        handleNodeDrag(d.id, event.x, event.y);
      })
      .on('end', (event, d) => {
        if (!event.active && simulationRef.current) {
          simulationRef.current.alphaTarget(0);
        }
      }));

    node.on('click', (event, d) => {
      event.stopPropagation();
      handleNodeClick(d);
    });

    node.on('mouseenter', function(event, d) {
      d3.select(this).select('.node-circle')
        .transition()
        .duration(200)
        .attr('r', nodeRadius + 5);
    }).on('mouseleave', function(event, d) {
      d3.select(this).select('.node-circle')
        .transition()
        .duration(200)
        .attr('r', nodeRadius);
    });

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges as any).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(nodeRadius + 20));

    simulationRef.current = simulation;

    simulation.on('tick', () => {
      link.select('path')
        .attr('d', (d: any) => {
          const sourceX = typeof d.source === 'object' ? d.source.x : d.x;
          const sourceY = typeof d.source === 'object' ? d.source.y : d.y;
          const targetX = typeof d.target === 'object' ? d.target.x : d.x;
          const targetY = typeof d.target === 'object' ? d.target.y : d.y;
          
          const dx = targetX - sourceX;
          const dy = targetY - sourceY;
          const dr = Math.sqrt(dx * dx + dy * dy);
          
          return `M${sourceX},${sourceY}A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
        });

      link.select('text')
        .attr('x', (d: any) => {
          const sourceX = typeof d.source === 'object' ? d.source.x : d.x;
          const targetX = typeof d.target === 'object' ? d.target.x : d.x;
          return (sourceX + targetX) / 2;
        })
        .attr('y', (d: any) => {
          const sourceY = typeof d.source === 'object' ? d.source.y : d.y;
          const targetY = typeof d.target === 'object' ? d.target.y : d.y;
          return (sourceY + targetY) / 2 - 10;
        });

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    svg.on('click', () => {
      setSelectedNode(null);
    });

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [graph, loading, selectedNode, mergeSource, mergeTarget, handleNodeDrag]);

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
          <h1 style={styles.title}>🌐 辩证图谱</h1>
          <p style={styles.subtitle}>
            以节点连线形式展示论辩逻辑链条，支持拖拽编辑与分支合并
          </p>
        </div>
        <div style={styles.headerActions}>
          {mergeMode ? (
            <div style={styles.mergeModeBar}>
              <span style={styles.mergeModeText}>
                {mergeSource ? `已选择源节点: ${getNodeLabel(mergeSource.type)}` : '点击选择第一个节点'}
                {mergeTarget && ` → 目标节点: ${getNodeLabel(mergeTarget.type)}`}
              </span>
              <select
                value={mergeType}
                onChange={(e) => setMergeType(e.target.value as 'reconcile' | 'synthesize')}
                style={styles.mergeSelect}
              >
                <option value="synthesize">综合合题</option>
                <option value="reconcile">调和统一</option>
              </select>
              {mergeSource && mergeTarget && (
                <button
                  onClick={handleMergeBranches}
                  disabled={merging}
                  style={styles.mergeButton}
                >
                  {merging ? '合并中...' : '✓ 确认合并'}
                </button>
              )}
              <button
                onClick={() => {
                  setMergeMode(false);
                  setMergeSource(null);
                  setMergeTarget(null);
                }}
                style={styles.cancelButton}
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setMergeMode(true)}
              style={styles.enableMergeButton}
            >
              🔗 合并分支模式
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      {graph && graph.nodes.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🌐</div>
          <h3 style={styles.emptyTitle}>暂无辩证图谱</h3>
          <p style={styles.emptyDesc}>
            请先在"辩证分析"页面生成辩证三要素，图谱将自动构建
          </p>
        </div>
      ) : (
        <div style={styles.content}>
          <div style={styles.graphSection} ref={containerRef}>
            <svg
              ref={svgRef}
              width="100%"
              height={600}
              style={styles.svg}
            />
            <div style={styles.legend}>
              <div style={styles.legendTitle}>图例</div>
              <div style={styles.legendItems}>
                <div style={styles.legendItem}>
                  <div style={{ ...styles.legendDot, background: getNodeColor('thesis') }} />
                  <span style={styles.legendText}>论点 (Thesis)</span>
                </div>
                <div style={styles.legendItem}>
                  <div style={{ ...styles.legendDot, background: getNodeColor('antithesis') }} />
                  <span style={styles.legendText}>反论点 (Antithesis)</span>
                </div>
                <div style={styles.legendItem}>
                  <div style={{ ...styles.legendDot, background: getNodeColor('synthesis') }} />
                  <span style={styles.legendText}>合题 (Synthesis)</span>
                </div>
                <div style={styles.legendItem}>
                  <div style={{ ...styles.legendDot, background: getNodeColor('branch') }} />
                  <span style={styles.legendText}>分支 (Branch)</span>
                </div>
              </div>
              <p style={styles.legendHint}>💡 拖拽节点可调整位置，滚轮可缩放</p>
            </div>
          </div>

          <div style={styles.sidebar}>
            {selectedNode ? (
              <div style={styles.nodeDetail}>
                <div style={styles.detailHeader}>
                  <span style={{ ...styles.nodeTypeBadge, background: getNodeColor(selectedNode.type) }}>
                    {getNodeLabel(selectedNode.type)}
                  </span>
                  <span style={styles.nodeId}>ID: {selectedNode.id.substring(0, 8)}...</span>
                </div>

                <div style={styles.detailSection}>
                  <label style={styles.detailLabel}>内容</label>
                  <p style={styles.detailContent}>{selectedNode.content}</p>
                </div>

                {selectedNode.keyPoints.length > 0 && (
                  <div style={styles.detailSection}>
                    <label style={styles.detailLabel}>关键要点</label>
                    <ul style={styles.keyPointsList}>
                      {selectedNode.keyPoints.map((point, i) => (
                        <li key={i} style={styles.keyPointItem}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedNode.citations && selectedNode.citations.length > 0 && (
                  <div style={styles.detailSection}>
                    <label style={styles.detailLabel}>参考文献</label>
                    <ul style={styles.citationsList}>
                      {selectedNode.citations.map((cit, i) => (
                        <li key={i} style={styles.citationItem}>{cit}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={styles.detailSection}>
                  <label style={styles.detailLabel}>创建分支</label>
                  <button
                    onClick={() => {
                      const content = prompt('请输入分支内容:');
                      if (content) {
                        handleCreateBranch(selectedNode.id, content, 'branch');
                      }
                    }}
                    style={styles.createBranchButton}
                  >
                    🌿 从此节点创建分支
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.infoPanel}>
                <h3 style={styles.infoTitle}>图谱信息</h3>
                <div style={styles.stats}>
                  <div style={styles.stat}>
                    <span style={styles.statValue}>{graph?.nodes.length || 0}</span>
                    <span style={styles.statLabel}>节点数</span>
                  </div>
                  <div style={styles.stat}>
                    <span style={styles.statValue}>{graph?.edges.length || 0}</span>
                    <span style={styles.statLabel}>边数</span>
                  </div>
                  <div style={styles.stat}>
                    <span style={styles.statValue}>{graph?.triads.length || 0}</span>
                    <span style={styles.statLabel}>三要素组</span>
                  </div>
                </div>

                {graph && graph.triads.length > 0 && (
                  <div style={styles.triadsSection}>
                    <h4 style={styles.triadsTitle}>历史辩证分析</h4>
                    <div style={styles.triadsList}>
                      {graph.triads.map((triad, index) => (
                        <div
                          key={triad.id}
                          onClick={() => setSelectedTriad(triad)}
                          style={{
                            ...styles.triadItem,
                            ...(selectedTriad?.id === triad.id ? styles.selectedTriad : {}),
                          }}
                        >
                          <span style={styles.triadIndex}>#{index + 1}</span>
                          <p style={styles.triadContext}>
                            {triad.context.length > 30 
                              ? triad.context.substring(0, 30) + '...' 
                              : triad.context}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={styles.hints}>
                  <h4 style={styles.hintsTitle}>操作提示</h4>
                  <ul style={styles.hintsList}>
                    <li>🖱️ 拖拽节点可调整位置</li>
                    <li>🔍 滚轮可缩放图谱</li>
                    <li>👆 点击节点查看详情</li>
                    <li>🔗 开启合并模式可合并分支</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    alignItems: 'center',
    gap: 12,
  },
  enableMergeButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  mergeModeBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    background: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: 8,
  },
  mergeModeText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: 500,
  },
  mergeSelect: {
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
  },
  mergeButton: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '8px 16px',
    background: 'white',
    color: '#666',
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
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
  content: {
    display: 'flex',
    gap: 24,
  },
  graphSection: {
    flex: 1,
    background: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    position: 'relative' as const,
  },
  svg: {
    border: '1px solid #f0f0f0',
    borderRadius: 12,
    background: '#fafbfc',
  },
  legend: {
    position: 'absolute' as const,
    top: 32,
    left: 32,
    background: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #f0f0f0',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1a1a2e',
    marginBottom: 12,
  },
  legendItems: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  legendHint: {
    fontSize: 11,
    color: '#999',
    marginTop: 12,
    paddingTop: 8,
    borderTop: '1px solid #f0f0f0',
  },
  sidebar: {
    width: 320,
    flexShrink: 0,
  },
  nodeDetail: {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px solid #f0f0f0',
  },
  nodeTypeBadge: {
    padding: '4px 12px',
    borderRadius: 4,
    color: 'white',
    fontSize: 12,
    fontWeight: 600,
  },
  nodeId: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#666',
    marginBottom: 8,
  },
  detailContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 1.7,
    margin: 0,
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
  citationsList: {
    margin: 0,
    paddingLeft: 16,
  },
  citationItem: {
    fontSize: 12,
    color: '#666',
    lineHeight: 1.5,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  createBranchButton: {
    width: '100%',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  infoPanel: {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 20px',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginBottom: 24,
  },
  stat: {
    textAlign: 'center' as const,
    padding: 16,
    background: '#f8f9fa',
    borderRadius: 8,
  },
  statValue: {
    display: 'block',
    fontSize: 24,
    fontWeight: 700,
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  triadsSection: {
    marginBottom: 24,
  },
  triadsTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 12px',
  },
  triadsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  triadItem: {
    padding: 12,
    background: '#f8f9fa',
    borderRadius: 8,
    cursor: 'pointer',
    border: '2px solid transparent',
  },
  selectedTriad: {
    borderColor: '#667eea',
    background: 'rgba(102,126,234,0.05)',
  },
  triadIndex: {
    fontSize: 11,
    fontWeight: 600,
    color: '#667eea',
  },
  triadContext: {
    fontSize: 13,
    color: '#666',
    margin: '4px 0 0',
    lineHeight: 1.5,
  },
  hints: {
    padding: 16,
    background: '#f8f9fa',
    borderRadius: 8,
  },
  hintsTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#667eea',
    margin: '0 0 12px',
  },
  hintsList: {
    margin: 0,
    paddingLeft: 0,
    listStyle: 'none' as const,
  },
};

export default DialecticalGraphPage;
