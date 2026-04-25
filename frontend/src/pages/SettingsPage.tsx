import React, { useState, useEffect } from 'react';
import { promptTemplateApi } from '../api';
import type { PromptTemplate, DeepSeekConfig } from '../types';

const DEFAULT_DEEPSEEK_CONFIG: DeepSeekConfig = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  maxTokens: 4096,
  temperature: 0.7,
};

const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<DeepSeekConfig>(() => {
    const saved = localStorage.getItem('deepseek_config');
    return saved ? JSON.parse(saved) : DEFAULT_DEEPSEEK_CONFIG;
  });
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'custom',
    systemPrompt: '',
    userPromptTemplate: '',
    description: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const data = await promptTemplateApi.getAll();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSaveConfig = () => {
    setSaving(true);
    localStorage.setItem('deepseek_config', JSON.stringify(config));
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  const handleCreateTemplate = async () => {
    try {
      if (!newTemplate.name || !newTemplate.systemPrompt || !newTemplate.userPromptTemplate) {
        alert('请填写模板名称、系统提示词和用户提示词模板');
        return;
      }
      await promptTemplateApi.create(newTemplate);
      setNewTemplate({
        name: '',
        category: 'custom',
        systemPrompt: '',
        userPromptTemplate: '',
        description: '',
      });
      setShowNewTemplate(false);
      loadTemplates();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      alert('无法删除默认模板');
      return;
    }
    if (confirm('确定要删除这个提示词模板吗？')) {
      try {
        await promptTemplateApi.delete(id);
        loadTemplates();
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const getApiKeyStatus = () => {
    if (!config.apiKey) return { color: '#fa709a', text: '未配置', icon: '🔴' };
    if (config.apiKey.startsWith('sk-')) return { color: '#43e97b', text: '已配置', icon: '🟢' };
    return { color: '#f093fb', text: '可能无效', icon: '🟡' };
  };

  const status = getApiKeyStatus();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>系统设置</h1>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🔑 DeepSeek API 配置</h2>
        <p style={styles.sectionDesc}>
          配置您的 DeepSeek API 密钥以启用 AI 智能生成功能。
          <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" style={styles.link}>
            获取 API Key
          </a>
        </p>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            API 密钥状态
            <span style={{ ...styles.statusBadge, color: status.color, marginLeft: 8 }}>
              {status.icon} {status.text}
            </span>
          </label>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>API Key</label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            placeholder="sk-xxxxxxxxxxxxxxxx"
            style={styles.input}
          />
          <p style={styles.hint}>您的 API Key 仅存储在本地浏览器中，不会发送到我们的服务器</p>
        </div>

        <div style={styles.toggleRow}>
          <span 
            style={styles.toggleLabel}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '▼' : '▶'} 高级设置
          </span>
        </div>

        {showAdvanced && (
          <div style={styles.advancedSettings}>
            <div style={styles.formGroup}>
              <label style={styles.label}>API Base URL</label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="https://api.deepseek.com"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>模型名称</label>
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                placeholder="deepseek-chat"
                style={styles.input}
              />
              <p style={styles.hint}>可用模型: deepseek-chat, deepseek-reasoner</p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>最大 Token 数: {config.maxTokens}</label>
              <input
                type="range"
                min={1000}
                max={128000}
                step={1000}
                value={config.maxTokens}
                onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                style={styles.slider}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>温度 (随机性): {config.temperature}</label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                style={styles.slider}
              />
              <p style={styles.hint}>较低的值使输出更确定，较高的值使输出更有创意</p>
            </div>
          </div>
        )}

        <button
          onClick={handleSaveConfig}
          disabled={saving}
          style={{ ...styles.saveButton, ...(saved ? styles.savedButton : {}) }}
        >
          {saving ? '保存中...' : saved ? '✓ 已保存' : '保存配置'}
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>📝 提示词模板管理</h2>
          <button
            onClick={() => setShowNewTemplate(true)}
            style={styles.addButton}
          >
            + 新建模板
          </button>
        </div>
        <p style={styles.sectionDesc}>管理用于生成辩证分析的提示词模板。默认模板不可修改，但您可以创建自定义模板。</p>

        {showNewTemplate && (
          <div style={styles.newTemplateForm}>
            <h3 style={styles.subtitle}>新建提示词模板</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>模板名称</label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="例如：自定义论点生成器"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>分类</label>
              <select
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                style={styles.select}
              >
                <option value="dialectics">辩证分析</option>
                <option value="custom">自定义</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>系统提示词 (System Prompt)</label>
              <textarea
                value={newTemplate.systemPrompt}
                onChange={(e) => setNewTemplate({ ...newTemplate, systemPrompt: e.target.value })}
                placeholder="定义 AI 的角色和任务..."
                style={styles.textarea}
                rows={6}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>用户提示词模板</label>
              <textarea
                value={newTemplate.userPromptTemplate}
                onChange={(e) => setNewTemplate({ ...newTemplate, userPromptTemplate: e.target.value })}
                placeholder="使用 {{变量名}} 定义可替换的变量，例如：研究主题：{{topic}}"
                style={styles.textarea}
                rows={4}
              />
              <p style={styles.hint}>使用 {'{{变量名}}'} 语法定义可替换的变量</p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>描述（可选）</label>
              <input
                type="text"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="模板的简短描述..."
                style={styles.input}
              />
            </div>

            <div style={styles.buttonRow}>
              <button
                onClick={() => setShowNewTemplate(false)}
                style={styles.cancelButton}
              >
                取消
              </button>
              <button
                onClick={handleCreateTemplate}
                style={styles.saveButton}
              >
                创建模板
              </button>
            </div>
          </div>
        )}

        {loadingTemplates ? (
          <div style={styles.loading}>加载模板中...</div>
        ) : (
          <div style={styles.templateList}>
            {templates.map((template) => (
              <div
                key={template.id}
                style={{ ...styles.templateCard, ...(template.isDefault ? styles.defaultCard : {}) }}
              >
                <div style={styles.templateHeader}>
                  <div>
                    <span style={styles.templateName}>{template.name}</span>
                    {template.isDefault && (
                      <span style={styles.defaultBadge}>默认</span>
                    )}
                  </div>
                  <span style={styles.templateCategory}>{template.category}</span>
                </div>
                
                {template.description && (
                  <p style={styles.templateDesc}>{template.description}</p>
                )}

                <div style={styles.templatePreview}>
                  <div style={styles.previewSection}>
                    <span style={styles.previewLabel}>系统提示词:</span>
                    <p style={styles.previewText}>
                      {template.systemPrompt.length > 150 
                        ? template.systemPrompt.substring(0, 150) + '...' 
                        : template.systemPrompt}
                    </p>
                  </div>
                  <div style={styles.previewSection}>
                    <span style={styles.previewLabel}>用户模板:</span>
                    <p style={styles.previewText}>{template.userPromptTemplate}</p>
                  </div>
                </div>

                {!template.isDefault && (
                  <div style={styles.templateActions}>
                    <button
                      onClick={() => handleDeleteTemplate(template.id, template.isDefault)}
                      style={styles.deleteButton}
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: 24,
    maxWidth: 900,
    margin: '0 auto',
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
  section: {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    margin: '0 0 24px',
    lineHeight: 1.6,
  },
  link: {
    color: '#667eea',
    marginLeft: 8,
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
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'monospace',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    outline: 'none',
    background: 'white',
    boxSizing: 'border-box' as const,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  statusBadge: {
    fontSize: 13,
    fontWeight: 600,
  },
  toggleRow: {
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#667eea',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  advancedSettings: {
    background: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    marginTop: 8,
  },
  saveButton: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  savedButton: {
    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  addButton: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  newTemplateForm: {
    background: '#f8f9fa',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 20px',
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '10px 24px',
    background: 'white',
    color: '#666',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center' as const,
    padding: 40,
    color: '#999',
  },
  templateList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  templateCard: {
    background: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    border: '2px solid transparent',
  },
  defaultCard: {
    borderColor: '#667eea',
    background: 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)',
  },
  templateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a2e',
  },
  defaultBadge: {
    marginLeft: 8,
    padding: '2px 8px',
    background: '#667eea',
    color: 'white',
    fontSize: 11,
    borderRadius: 4,
  },
  templateCategory: {
    fontSize: 12,
    color: '#999',
    background: '#e9ecef',
    padding: '4px 10px',
    borderRadius: 4,
  },
  templateDesc: {
    fontSize: 13,
    color: '#666',
    margin: '0 0 12px',
  },
  templatePreview: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  previewSection: {},
  previewLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: 500,
  },
  previewText: {
    fontSize: 13,
    color: '#666',
    margin: '4px 0 0',
    lineHeight: 1.5,
  },
  templateActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    padding: '6px 16px',
    background: 'transparent',
    color: '#fa709a',
    border: '1px solid #fa709a',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
  },
};

export default SettingsPage;
