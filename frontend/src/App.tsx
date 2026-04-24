import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import ProjectList from './pages/ProjectList';
import DialoguePage from './pages/DialoguePage';
import TreePage from './pages/TreePage';
import AttackPage from './pages/AttackPage';
import DefensePage from './pages/DefensePage';
import CrossDisciplinaryPage from './pages/CrossDisciplinaryPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <div style={styles.app}>
          <Navbar />
          <main style={styles.main}>
            <Routes>
              <Route path="/" element={<ProjectList />} />
              <Route path="/project/:projectId" element={<DialoguePage />} />
              <Route path="/project/:projectId/tree" element={<TreePage />} />
              <Route path="/project/:projectId/attack" element={<AttackPage />} />
              <Route path="/project/:projectId/defense" element={<DefensePage />} />
              <Route path="/project/:projectId/cross-disciplinary" element={<CrossDisciplinaryPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
};

const styles = {
  app: {
    minHeight: '100vh',
    background: '#f8f9fa',
  },
  main: {
    minHeight: 'calc(100vh - 60px)',
  },
};

export default App;
