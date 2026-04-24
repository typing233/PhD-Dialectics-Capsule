import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { defenseApi, projectApi } from '../api';
import type { DefenseQuestion } from '../types';

const DefensePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject, messages } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<DefenseQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<DefenseQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadData(projectId);
    }
  }, [projectId]);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const [project, questionsData] = await Promise.all([
        projectApi.get(id),
        defenseApi.get(id),
      ]);
      
      setCurrentProject(project);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!projectId) return;
    try {
      setGenerating(true);
      const context = messages.map(m => m.content).join('\n');
      const result = await defenseApi.generate(projectId, context);
      setQuestions(prev => [...prev, ...result]);
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedQuestion || !answer.trim()) return;
    try {
      setSubmitting(true);
      const context = messages.map(m => m.content).join('\n');
      const result = await defenseApi.answerQuestion(selectedQuestion.id, answer.trim(), context);
      
      setQuestions(prev => prev.map(q => q.id === result.id ? result : q));
      setSelectedQuestion(result);
      setAnswer('');
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      methodology: '研究方法',
      literature: '文献综述',
      assumptions: '前提假设',
      contribution: '研究贡献',
      future_work: '未来工作',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      methodology: '#667eea',
      literature: '#f093fb',
      assumptions: '#4facfe',
      contribution: '#fa709a',
      future_work: '#43e97b',
    };
    return colors[category] || '#999';
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
    };
    return labels[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: '#43e97b',
      medium: '#f093fb',
      hard: '#fa709a',
    };
    return colors[difficulty] || '#999';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#43e97b';
    if (score >= 60) return '#f093fb';
    return '#fa709a';
  };

  const stats = {
    total: questions.length,
    answered: questions.filter(q => q.evaluation).length,
    avgScore: questions.filter(q => q.evaluation).length > 0
      ? Math.round(questions.filter(q => q.evaluation).reduce((sum, q) => sum + (q.evaluation?.score || 0), 0) / questions.filter(q => q.evaluation).length)
      : 0,
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
          <h1 style={styles.title}>答辩预演室</h1>
          <p style={styles.subtitle}>基于论证树自动生成质询问题</p>
        </div>
        <button 
          style={styles.generateButton} 
          onClick={handleGenerateQuestions}
          disabled={generating}
        >
          {generating ? '🎯 生成中...' : '🎯 生成问题'}
        </button>
      </div>

      <div style={styles.stats}>
        {[
          { label: '总问题数', value: stats.total, icon: '📝' },
          { label: '已回答', value: stats.answered, icon: '✅' },
          { label: '平均得分', value: `${stats.avgScore}分`, icon: '⭐' },
        ].map((stat, i) => (
          <div key={i} style={styles.statCard}>
            <span style={styles.statIcon}>{stat.icon}</span>
            <span style={styles.statValue}>{stat.value}</span>
            <span style={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      <div style={styles.content}>
        <div style={styles.questionsList}>
          {questions.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>🎤</span>
              <h3>还没有预演问题</h3>
              <p>点击"生成问题"让AI基于你的论证树生成质询问题</p>
            </div>
          ) : (
            questions.map((question) => {
              const isSelected = selectedQuestion?.id === question.id;
              return (
                <div 
                  key={question.id}
                  style={{
                    ...styles.questionCard,
                    ...(question.evaluation ? styles.questionCardAnswered : {}),
                    ...(isSelected ? styles.questionCardSelected : {}),
                  }}
                  onClick={() => {
                    setSelectedQuestion(question);
                    if (!question.evaluation) setAnswer('');
                  }}
                >
                <div style={styles.questionHeader}>
                  <div style={styles.questionMeta}>
                    <span style={{ 
                      ...styles.badge,
                      background: getCategoryColor(question.category) + '20',
                      color: getCategoryColor(question.category),
                    }}>
                      {getCategoryLabel(question.category)}
                    </span>
                    <span style={{ 
                      ...styles.badge,
                      background: getDifficultyColor(question.difficulty) + '20',
                      color: getDifficultyColor(question.difficulty),
                    }}>
                      {getDifficultyLabel(question.difficulty)}
                    </span>
                  </div>
                  {question.evaluation && (
                    <span style={{ 
                      ...styles.score,
                      color: getScoreColor(question.evaluation.score),
                    }}>
                      {question.evaluation.score}分
                    </span>
                  )}
                </div>
                
                <p style={styles.questionText}>{question.question}</p>
                
                {question.userAnswer && (
                  <div style={styles.answerPreview}>
                    <span style={styles.answerLabel}>你的回答：</span>
                    <p style={styles.answerText}>
                      {question.userAnswer.length > 80 
                        ? question.userAnswer.substring(0, 80) + '...' 
                        : question.userAnswer}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {selectedQuestion && (
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>回答问题</h3>
              <button 
                style={styles.closeButton}
                onClick={() => setSelectedQuestion(null)}
              >
                ✕
              </button>
            </div>

            <div style={styles.sidebarContent}>
              <div style={styles.questionMeta}>
                <span style={{ 
                  ...styles.badge,
                  background: getCategoryColor(selectedQuestion.category) + '20',
                  color: getCategoryColor(selectedQuestion.category),
                }}>
                  {getCategoryLabel(selectedQuestion.category)}
                </span>
                <span style={{ 
                  ...styles.badge,
                  background: getDifficultyColor(selectedQuestion.difficulty) + '20',
                  color: getDifficultyColor(selectedQuestion.difficulty),
                }}>
                  {getDifficultyLabel(selectedQuestion.difficulty)}
                </span>
              </div>

              <div style={styles.questionBox}>
                <p style={styles.questionFullText}>{selectedQuestion.question}</p>
              </div>

              {selectedQuestion.evaluation ? (
                <div style={styles.evaluationSection}>
                  <div style={styles.evaluationHeader}>
                    <span style={styles.evaluationLabel}>评估结果</span>
                    <span style={{
                      ...styles.evaluationScore,
                      color: getScoreColor(selectedQuestion.evaluation.score),
                    }}>
                      {selectedQuestion.evaluation.score}分
                    </span>
                  </div>
                  
                  <p style={styles.evaluationFeedback}>{selectedQuestion.evaluation.feedback}</p>

                  {selectedQuestion.evaluation.strengths.length > 0 && (
                    <div style={styles.evaluationSubsection}>
                      <span style={styles.strengthLabel}>💪 优点</span>
                      <ul style={styles.evaluationList}>
                        {selectedQuestion.evaluation.strengths.map((s, i) => (
                          <li key={i} style={styles.evaluationItem}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedQuestion.evaluation.improvements.length > 0 && (
                    <div style={styles.evaluationSubsection}>
                      <span style={styles.improveLabel}>📈 改进点</span>
                      <ul style={styles.evaluationList}>
                        {selectedQuestion.evaluation.improvements.map((s, i) => (
                          <li key={i} style={styles.evaluationItem}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={styles.yourAnswer}>
                    <span style={styles.yourAnswerLabel}>你的回答：</span>
                    <p style={styles.yourAnswerText}>{selectedQuestion.userAnswer}</p>
                  </div>
                </div>
              ) : (
                <div style={styles.answerSection}>
                  <label style={styles.answerLabel}>请输入你的回答：</label>
                  <textarea
                    style={styles.answerInput}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="在这里输入你的回答...\n\n提示：\n1. 清晰阐述你的观点\n2. 提供具体的论据支持\n3. 考虑可能的反驳意见"
                    rows={8}
                  />
                  <button
                    style={styles.submitButton}
                    onClick={handleSubmitAnswer}
                    disabled={submitting || !answer.trim()}
                  >
                    {submitting ? '评估中...' : '提交并评估'}
                  </button>
                </div>
              )}
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
  generateButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: 'white',
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statIcon: {
    fontSize: 28,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  content: {
    display: 'flex',
    gap: 24,
  },
  questionsList: {
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
  questionCard: {
    background: 'white',
    borderRadius: 12,
    padding: 20,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '2px solid transparent',
  },
  questionCardSelected: {
    borderColor: '#667eea',
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.15)',
    opacity: 1,
  },
  questionCardAnswered: {
    opacity: 0.85,
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionMeta: {
    display: 'flex',
    gap: 8,
  },
  badge: {
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
  },
  score: {
    fontSize: 18,
    fontWeight: 700,
  },
  questionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 1.5,
    margin: 0,
  },
  answerPreview: {
    marginTop: 12,
    padding: 12,
    background: '#f8f9fa',
    borderRadius: 8,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: '#999',
    display: 'block',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 13,
    color: '#666',
    margin: 0,
    lineHeight: 1.4,
  },
  sidebar: {
    width: 420,
    background: 'white',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const,
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
  sidebarContent: {
    padding: 20,
    overflowY: 'auto' as const,
    flex: 1,
  },
  questionBox: {
    padding: 16,
    background: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 20,
  },
  questionFullText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 1.6,
    margin: 0,
  },
  evaluationSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  evaluationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evaluationLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
  },
  evaluationScore: {
    fontSize: 24,
    fontWeight: 700,
  },
  evaluationFeedback: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.6,
    margin: 0,
    padding: 12,
    background: '#f8f9fa',
    borderRadius: 8,
  },
  evaluationSubsection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#43e97b',
  },
  improveLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#fa709a',
  },
  evaluationList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  evaluationItem: {
    fontSize: 13,
    color: '#666',
    padding: '6px 10px',
    background: '#f8f9fa',
    borderRadius: 4,
  },
  yourAnswer: {
    padding: 16,
    background: '#f8f9fa',
    borderRadius: 8,
  },
  yourAnswerLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: '#999',
    display: 'block',
    marginBottom: 8,
  },
  yourAnswerText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 1.6,
    margin: 0,
  },
  answerSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: '#333',
  },
  answerInput: {
    width: '100%',
    padding: 16,
    fontSize: 14,
    border: '2px solid #e5e5e5',
    borderRadius: 12,
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    lineHeight: 1.6,
    transition: 'border-color 0.2s',
  },
  submitButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
};

export default DefensePage;
