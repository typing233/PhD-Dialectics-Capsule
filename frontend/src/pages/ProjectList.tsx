import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../api';
import type { ResearchProject } from '../types';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setCreating(true);
      const project = await projectApi.create(newTitle.trim(), newDescription.trim());
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      navigate(`/project/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>论证进化健身房</h1>
          <p style={styles.subtitle}>锻造严密且可发表的论证树</p>
        </div>
        <button style={styles.createButton} onClick={() => setShowCreateModal(true)}>
          + 新建研究项目
        </button>
      </div>

      <div style={styles.features}>
        {[
          { icon: '🎯', title: '苏格拉底式对话', desc: 'AI驱动的多轮问答，引导想法外化' },
          { icon: '🌳', title: '假设演化树', desc: '动态生成可视化，梳理逻辑脉络' },
          { icon: '👿', title: '魔鬼代言人', desc: '审查逻辑漏洞，生成热力图' },
          { icon: '🔬', title: '跨学科嫁接器', desc: '提供其他领域的范式灵感' },
          { icon: '🎤', title: '答辩预演室', desc: '自动生成质询，评估回答表现' },
        ].map((feature, i) => (
          <div key={i} style={styles.featureCard}>
            <span style={styles.featureIcon}>{feature.icon}</span>
            <h3 style={styles.featureTitle}>{feature.title}</h3>
            <p style={styles.featureDesc}>{feature.desc}</p>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>我的项目</h2>
        
        {loading ? (
          <div style={styles.loading}>加载中...</div>
        ) : projects.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📚</span>
            <h3>还没有研究项目</h3>
            <p>创建一个新项目，开始锻造你的论证树</p>
            <button style={styles.emptyButton} onClick={() => setShowCreateModal(true)}>
              创建第一个项目
            </button>
          </div>
        ) : (
          <div style={styles.projectGrid}>
            {projects.map((project) => (
              <div 
                key={project.id} 
                style={styles.projectCard}
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <h3 style={styles.projectTitle}>{project.title}</h3>
                <p style={styles.projectDesc}>
                  {project.description || '暂无描述'}
                </p>
                <div style={styles.projectMeta}>
                  <span style={styles.projectDate}>
                    更新于 {formatDate(project.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>新建研究项目</h2>
            <form onSubmit={handleCreate}>
              <div style={styles.formGroup}>
                <label style={styles.label}>项目名称</label>
                <input
                  style={styles.input}
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例如：社交媒体使用与抑郁的因果关系研究"
                  autoFocus
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>项目描述（可选）</label>
                <textarea
                  style={styles.textarea}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="简要描述你的研究想法..."
                  rows={3}
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                  disabled={creating || !newTitle.trim()}
                >
                  {creating ? '创建中...' : '创建项目'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '40px 24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    color: '#1a1a2e',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    margin: 0,
  },
  createButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 16,
    marginBottom: 48,
  },
  featureCard: {
    padding: 20,
    background: 'white',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    textAlign: 'center' as const,
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
    lineHeight: 1.5,
  },
  section: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 20px',
  },
  loading: {
    textAlign: 'center' as const,
    padding: 60,
    color: '#666',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: 60,
    background: 'white',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    display: 'block',
  },
  emptyButton: {
    marginTop: 20,
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 20,
  },
  projectCard: {
    padding: 24,
    background: 'white',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '2px solid transparent',
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 8px',
  },
  projectDesc: {
    fontSize: 14,
    color: '#666',
    margin: '0 0 16px',
    lineHeight: 1.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
  },
  projectMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectDate: {
    fontSize: 12,
    color: '#999',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    background: 'white',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 500,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 24px',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
    border: '2px solid #e5e5e5',
    borderRadius: 8,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
    border: '2px solid #e5e5e5',
    borderRadius: 8,
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  modalActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  cancelButton: {
    padding: '10px 20px',
    background: '#f5f5f5',
    color: '#333',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  submitButton: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
};

export default ProjectList;
