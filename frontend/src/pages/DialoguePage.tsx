import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { dialogueApi, projectApi } from '../api';
import type { DialogueMessage } from '../types';

const DialoguePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject, messages, setMessages, refreshData } = useAppContext();
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProject = async (id: string) => {
    try {
      setInitialLoading(true);
      const [project, messagesData] = await Promise.all([
        projectApi.get(id),
        dialogueApi.get(id),
      ]);
      
      setCurrentProject(project);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load project:', error);
      navigate('/');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !projectId) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      const result = await dialogueApi.send(projectId, userMessage);
      
      setMessages(prev => [
        ...prev,
        {
          id: 'temp-user',
          projectId,
          role: 'user',
          content: userMessage,
          timestamp: new Date().toISOString(),
          round: 0,
        },
        result.assistantMessage,
      ]);

      if (result.treeUpdated) {
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (initialLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.projectInfo}>
          <h2 style={styles.projectTitle}>{currentProject?.title}</h2>
          <p style={styles.projectDesc}>{currentProject?.description || '暂无描述'}</p>
        </div>
        
        <div style={styles.quickTips}>
          <h3 style={styles.tipsTitle}>💡 对话提示</h3>
          <ul style={styles.tipsList}>
            <li style={styles.tipItem}>清晰阐述你的研究问题</li>
            <li style={styles.tipItem}>描述你的核心假设</li>
            <li style={styles.tipItem}>讨论潜在的证据支持</li>
            <li style={styles.tipItem}>思考可能的反对意见</li>
          </ul>
        </div>

        <div style={styles.stats}>
          <div style={styles.stat}>
            <span style={styles.statValue}>{messages.filter(m => m.role === 'user').length}</span>
            <span style={styles.statLabel}>回答轮次</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{Math.floor(messages.length / 4) + 1}</span>
            <span style={styles.statLabel}>论证深度</span>
          </div>
        </div>
      </div>

      <div style={styles.chatArea}>
        <div style={styles.messages}>
          {messages.length === 0 ? (
            <div style={styles.welcome}>
              <span style={styles.welcomeIcon}>🤔</span>
              <h2>开始你的苏格拉底式对话</h2>
              <p>告诉我你的研究想法，让我们一起锻造严密的论证树</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id || index}
                style={{
                  ...styles.message,
                  ...(message.role === 'user' ? styles.userMessage : styles.assistantMessage),
                }}
              >
                <div style={styles.messageHeader}>
                  <span style={styles.messageRole}>
                    {message.role === 'user' ? '👤 你' : '🧠 AI 助手'}
                  </span>
                  <span style={styles.messageTime}>{formatTime(message.timestamp)}</span>
                </div>
                <div style={styles.messageContent}>
                  {message.content.split('\n').map((line, i) => (
                    <p key={i} style={styles.messageParagraph}>{line}</p>
                  ))}
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div style={{ ...styles.message, ...styles.assistantMessage }}>
              <div style={styles.messageHeader}>
                <span style={styles.messageRole}>🧠 AI 助手</span>
              </div>
              <div style={styles.typing}>
                <span style={styles.typingDot}></span>
                <span style={styles.typingDot}></span>
                <span style={styles.typingDot}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form style={styles.inputArea} onSubmit={handleSend}>
          <textarea
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="分享你的研究想法... (按 Enter 发送，Shift+Enter 换行)"
            disabled={loading}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button
            type="submit"
            style={styles.sendButton}
            disabled={loading || !input.trim()}
          >
            发送
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: 'calc(100vh - 60px)',
    background: '#f8f9fa',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 'calc(100vh - 60px)',
    background: '#f8f9fa',
  },
  loading: {
    fontSize: 16,
    color: '#666',
  },
  sidebar: {
    width: 300,
    background: 'white',
    borderRight: '1px solid #e5e5e5',
    padding: 24,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  projectInfo: {
    marginBottom: 24,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 8px',
  },
  projectDesc: {
    fontSize: 14,
    color: '#666',
    margin: 0,
    lineHeight: 1.5,
  },
  quickTips: {
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 12px',
  },
  tipsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  tipItem: {
    fontSize: 13,
    color: '#666',
    padding: '6px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  stats: {
    marginTop: 'auto',
    display: 'flex',
    gap: 24,
    paddingTop: 20,
    borderTop: '1px solid #e5e5e5',
  },
  stat: {
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: '#667eea',
    display: 'block',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  messages: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: 24,
  },
  welcome: {
    textAlign: 'center' as const,
    padding: 80,
  },
  welcomeIcon: {
    fontSize: 64,
    marginBottom: 24,
    display: 'block',
  },
  message: {
    maxWidth: 700,
    margin: '0 auto 20px',
    padding: 16,
    borderRadius: 12,
  },
  userMessage: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  assistantMessage: {
    background: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: 600,
    opacity: 0.8,
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.6,
  },
  messageContent: {},
  messageParagraph: {
    fontSize: 14,
    lineHeight: 1.7,
    margin: '0 0 8px',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  typing: {
    display: 'flex',
    gap: 4,
    padding: '8px 0',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#999',
    animation: 'pulse 1.4s infinite ease-in-out',
  },
  inputArea: {
    padding: 20,
    background: 'white',
    borderTop: '1px solid #e5e5e5',
    display: 'flex',
    gap: 12,
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: 14,
    border: '2px solid #e5e5e5',
    borderRadius: 12,
    outline: 'none',
    resize: 'none' as const,
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  sendButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
};

export default DialoguePage;
