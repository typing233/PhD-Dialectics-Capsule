import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { treeApi, projectApi, dialogueApi } from '../api';
import type { EvolutionTree, ArgumentNode } from '../types';
import * as d3 from 'd3';

const TreePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject, tree, setTree, refreshData } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ArgumentNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (tree && svgRef.current) {
      renderTree();
    }
  }, [tree]);

  const loadProject = async (id: string) => {
    try {
      setLoading(true);
      const [project, treeData] = await Promise.all([
        projectApi.get(id),
        treeApi.get(id),
      ]);
      
      setCurrentProject(project);
      setTree(treeData);
    } catch (error) {
      console.error('Failed to load project:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTree = async () => {
    if (!projectId) return;
    try {
      setSyncing(true);
      const result = await treeApi.syncTree(projectId);
      setTree(result.tree);
      if (result.newNodes > 0) {
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to sync tree:', error);
    } finally {
      setSyncing(false);
    }
  };

  const renderTree = () => {
    if (!tree || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 500;
    const margin = { top: 40, right: 120, bottom: 40, left: 120 };

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    if (tree.nodes.length === 0) {
      g.append('text')
        .attr('x', (width - margin.left - margin.right) / 2)
        .attr('y', (height - margin.top - margin.bottom) / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#999')
        .attr('font-size', 14)
        .text('暂无节点，点击"同步对话"生成论证树');
      return;
    }

    const nodeMap = new Map(tree.nodes.map(n => [n.id, n]));
    
    const data: any = { children: [] };
    const rootNodes = tree.nodes.filter(n => !n.parentId || !nodeMap.has(n.parentId));
    
    if (rootNodes.length === 0 && tree.nodes.length > 0) {
      rootNodes.push(tree.nodes[0]);
    }

    const buildHierarchy = (nodeId: string): any => {
      const node = nodeMap.get(nodeId);
      if (!node) return null;
      
      const children = tree.nodes
        .filter(n => n.parentId === nodeId)
        .map(n => buildHierarchy(n.id))
        .filter(Boolean);

      return {
        id: node.id,
        data: node,
        children: children.length > 0 ? children : undefined,
      };
    };

    if (rootNodes.length === 1) {
      const root = buildHierarchy(rootNodes[0].id);
      if (root) {
        const hierarchy = d3.hierarchy(root);
        const treeLayout = d3.tree()
          .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
        
        treeLayout(hierarchy);

        g.selectAll('.link')
          .data(hierarchy.links())
          .enter()
          .append('path')
          .attr('class', 'link')
          .attr('fill', 'none')
          .attr('stroke', '#ddd')
          .attr('stroke-width', 2)
          .attr('d', d3.linkHorizontal()
            .x((d: any) => d.y)
            .y((d: any) => d.x));

        const nodeGroups = g.selectAll('.node')
          .data(hierarchy.descendants())
          .enter()
          .append('g')
          .attr('class', 'node')
          .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
          .style('cursor', 'pointer')
          .on('click', (event: any, d: any) => {
            setSelectedNode(d.data.data);
          });

        nodeGroups.append('circle')
          .attr('r', 24)
          .attr('fill', (d: any) => getNodeColor(d.data.data))
          .attr('stroke', '#fff')
          .attr('stroke-width', 3);

        nodeGroups.append('text')
          .attr('dy', '.35em')
          .attr('x', (d: any) => (d.children ? -35 : 35))
          .attr('text-anchor', (d: any) => (d.children ? 'end' : 'start'))
          .attr('fill', '#333')
          .attr('font-size', 12)
          .text((d: any) => {
            const text = d.data.data.content;
            return text.length > 20 ? text.substring(0, 20) + '...' : text;
          });

        nodeGroups.append('text')
          .attr('dy', '1.8em')
          .attr('x', (d: any) => (d.children ? -35 : 35))
          .attr('text-anchor', (d: any) => (d.children ? 'end' : 'start'))
          .attr('fill', '#999')
          .attr('font-size', 10)
          .text((d: any) => getNodeTypeLabel(d.data.data.type));
      }
    }
  };

  const getNodeColor = (node: ArgumentNode) => {
    const colors: Record<string, string> = {
      hypothesis: '#667eea',
      assumption: '#f093fb',
      evidence: '#4facfe',
      counterargument: '#fa709a',
      refinement: '#43e97b',
    };
    return colors[node.type] || '#999';
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

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      high: '#fa709a',
      medium: '#f093fb',
      low: '#4facfe',
    };
    return colors[severity] || '#999';
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
          <h1 style={styles.title}>论证树可视化</h1>
          <p style={styles.subtitle}>
            {tree?.nodes.length || 0} 个节点 · {tree?.edges.length || 0} 条边
          </p>
        </div>
        <button 
          style={styles.syncButton} 
          onClick={handleSyncTree}
          disabled={syncing}
        >
          {syncing ? '同步中...' : '🔄 同步对话'}
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.treeArea}>
          <svg ref={svgRef} style={styles.svg}></svg>
          
          <div style={styles.legend}>
            <div style={styles.legendTitle}>节点类型</div>
            <div style={styles.legendItems}>
              {[
                { type: 'hypothesis', label: '假设', color: '#667eea' },
                { type: 'assumption', label: '前提', color: '#f093fb' },
                { type: 'evidence', label: '证据', color: '#4facfe' },
                { type: 'counterargument', label: '反驳', color: '#fa709a' },
                { type: 'refinement', label: '修正', color: '#43e97b' },
              ].map(item => (
                <div key={item.type} style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: item.color }}></span>
                  <span style={styles.legendLabel}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedNode && (
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>节点详情</h3>
              <button 
                style={styles.closeButton}
                onClick={() => setSelectedNode(null)}
              >
                ✕
              </button>
            </div>

            <div style={styles.nodeDetail}>
              <div style={styles.nodeType}>
                <span style={{ ...styles.nodeTypeDot, background: getNodeColor(selectedNode) }}></span>
                {getNodeTypeLabel(selectedNode.type)}
              </div>
              
              <div style={styles.section}>
                <label style={styles.label}>内容</label>
                <p style={styles.nodeContent}>{selectedNode.content}</p>
              </div>

              <div style={styles.metrics}>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>论证强度</span>
                  <div style={styles.meter}>
                    <div 
                      style={{ 
                        ...styles.meterFill, 
                        width: `${selectedNode.strength * 100}%`,
                        background: selectedNode.strength > 0.7 ? '#43e97b' : selectedNode.strength > 0.4 ? '#f093fb' : '#fa709a'
                      }}
                    ></div>
                  </div>
                  <span style={styles.metricValue}>{Math.round(selectedNode.strength * 100)}%</span>
                </div>

                <div style={styles.metric}>
                  <span style={styles.metricLabel}>脆弱度</span>
                  <div style={styles.meter}>
                    <div 
                      style={{ 
                        ...styles.meterFill, 
                        width: `${selectedNode.vulnerabilityScore * 100}%`,
                        background: selectedNode.vulnerabilityScore > 0.6 ? '#fa709a' : selectedNode.vulnerabilityScore > 0.3 ? '#f093fb' : '#43e97b'
                      }}
                    ></div>
                  </div>
                  <span style={styles.metricValue}>{Math.round(selectedNode.vulnerabilityScore * 100)}%</span>
                </div>
              </div>

              <div style={styles.section}>
                <label style={styles.label}>版本</label>
                <span style={styles.version}>v{selectedNode.version}</span>
              </div>
            </div>
          </div>
        )}
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
  syncButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  content: {
    display: 'flex',
    gap: 24,
  },
  treeArea: {
    flex: 1,
    background: 'white',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  svg: {
    width: '100%',
    height: 500,
  },
  legend: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid #f0f0f0',
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#333',
    marginBottom: 12,
  },
  legendItems: {
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap' as const,
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
  legendLabel: {
    fontSize: 13,
    color: '#666',
  },
  sidebar: {
    width: 340,
    background: 'white',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
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
    fontWeight: 600,
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
  nodeDetail: {
    padding: 20,
  },
  nodeType: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    background: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 16,
  },
  nodeTypeDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: '#999',
    display: 'block',
    marginBottom: 6,
  },
  nodeContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 1.6,
    margin: 0,
  },
  metrics: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    marginBottom: 16,
  },
  metric: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: '#666',
  },
  meter: {
    height: 8,
    background: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 600,
    color: '#333',
  },
  version: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: 600,
  },
};

export default TreePage;
