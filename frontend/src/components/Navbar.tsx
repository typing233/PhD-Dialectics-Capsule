import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const Navbar: React.FC = () => {
  const { currentProject } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveLink = () => {
    if (!currentProject) return null;
    const pathname = location.pathname;
    const basePath = `/project/${currentProject.id}`;
    
    if (pathname === basePath) return 'dialogue';
    if (pathname === `${basePath}/tree`) return 'tree';
    if (pathname === `${basePath}/attack`) return 'attack';
    if (pathname === `${basePath}/defense`) return 'defense';
    if (pathname === `${basePath}/cross-disciplinary`) return 'cross-disciplinary';
    
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
          </div>
        )}
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
    maxWidth: 1400,
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
  links: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  link: {
    padding: '8px 16px',
    color: 'rgba(255,255,255,0.85)',
    textDecoration: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  activeLink: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
  },
};

export default Navbar;
