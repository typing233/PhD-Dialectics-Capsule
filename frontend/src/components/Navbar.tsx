import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const Navbar: React.FC = () => {
  const { currentProject } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveLink = () => {
    const pathname = location.pathname;
    
    if (pathname === '/settings') return 'settings';
    
    if (!currentProject) return null;
    const basePath = `/project/${currentProject.id}`;
    
    if (pathname === basePath) return 'dialogue';
    if (pathname === `${basePath}/tree`) return 'tree';
    if (pathname === `${basePath}/attack`) return 'attack';
    if (pathname === `${basePath}/defense`) return 'defense';
    if (pathname === `${basePath}/cross-disciplinary`) return 'cross-disciplinary';
    if (pathname === `${basePath}/dialectics`) return 'dialectics';
    if (pathname === `${basePath}/graph`) return 'graph';
    if (pathname === `${basePath}/export`) return 'export';
    
    return null;
  };

  const activeLink = getActiveLink();

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.brand}>
          <span style={styles.logo}>🧠</span>
          <span style={styles.title}>论证进化健身房</span>
        </Link>

        <div style={styles.rightLinks}>
          {currentProject && (
            <div style={styles.links}>
              <Link 
                to={`/project/${currentProject.id}`} 
                style={{ ...styles.link, ...(activeLink === 'dialogue' ? styles.activeLink : {}) }}
              >
                🎯 苏格拉底对话
              </Link>
              <Link 
                to={`/project/${currentProject.id}/tree`} 
                style={{ ...styles.link, ...(activeLink === 'tree' ? styles.activeLink : {}) }}
              >
                🌳 论证树
              </Link>
              <Link 
                to={`/project/${currentProject.id}/dialectics`} 
                style={{ ...styles.link, ...(activeLink === 'dialectics' ? styles.activeLink : {}) }}
              >
                ⚖️ 辩证分析
              </Link>
              <Link 
                to={`/project/${currentProject.id}/graph`} 
                style={{ ...styles.link, ...(activeLink === 'graph' ? styles.activeLink : {}) }}
              >
                🌐 辩证图谱
              </Link>
              <Link 
                to={`/project/${currentProject.id}/attack`} 
                style={{ ...styles.link, ...(activeLink === 'attack' ? styles.activeLink : {}) }}
              >
                👿 魔鬼代言人
              </Link>
              <Link 
                to={`/project/${currentProject.id}/defense`} 
                style={{ ...styles.link, ...(activeLink === 'defense' ? styles.activeLink : {}) }}
              >
                🎤 答辩预演
              </Link>
              <Link 
                to={`/project/${currentProject.id}/cross-disciplinary`} 
                style={{ ...styles.link, ...(activeLink === 'cross-disciplinary' ? styles.activeLink : {}) }}
              >
                🔬 跨学科嫁接器
              </Link>
              <Link 
                to={`/project/${currentProject.id}/export`} 
                style={{ ...styles.link, ...(activeLink === 'export' ? styles.activeLink : {}) }}
              >
                📄 导出报告
              </Link>
            </div>
          )}
          
          <Link 
            to="/settings" 
            style={{ ...styles.settingsLink, ...(activeLink === 'settings' ? styles.activeLink : {}) }}
          >
            ⚙️ 设置
          </Link>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '0 24px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: 1600,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textDecoration: 'none',
    color: 'white',
  },
  logo: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
  },
  rightLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  links: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  link: {
    padding: '6px 12px',
    color: 'rgba(255,255,255,0.85)',
    textDecoration: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  },
  activeLink: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
  },
  settingsLink: {
    padding: '6px 12px',
    color: 'rgba(255,255,255,0.85)',
    textDecoration: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s',
    borderLeft: '1px solid rgba(255,255,255,0.2)',
    marginLeft: 8,
    paddingLeft: 16,
  },
};

export default Navbar;
