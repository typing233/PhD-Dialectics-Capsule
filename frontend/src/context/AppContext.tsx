import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ResearchProject, DialogueMessage, EvolutionTree, Attack, AppContext } from '../types';
import { dialogueApi, treeApi, devilAdvocateApi } from '../api';

const AppContext = createContext<AppContext | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<ResearchProject | null>(null);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [tree, setTree] = useState<EvolutionTree | null>(null);
  const [attacks, setAttacks] = useState<Attack[]>([]);

  const refreshData = useCallback(async () => {
    if (!currentProject) return;

    try {
      const [messagesData, treeData, attacksData] = await Promise.all([
        dialogueApi.get(currentProject.id),
        treeApi.get(currentProject.id),
        devilAdvocateApi.getForProject(currentProject.id),
      ]);

      setMessages(messagesData);
      setTree(treeData);
      setAttacks(attacksData);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, [currentProject]);

  const value: AppContext = {
    currentProject,
    setCurrentProject,
    messages,
    setMessages,
    tree,
    setTree,
    attacks,
    setAttacks,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
