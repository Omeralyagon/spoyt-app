import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

const navItems = [
  { path: '/home', label: 'בית', icon: '🏠' },
  { path: '/discover', label: 'גלה', icon: '🔍' },
  { path: '/create-plan', label: '+', icon: '+', isFab: true },
  { path: '/my-plans', label: 'שלי', icon: '📋' },
  { path: '/profile', label: 'פרופיל', icon: '👤' },
];

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on login page
  if (location.pathname === '/login') return null;

  return (
    <nav className="bottom-nav" aria-label="ניווט ראשי">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        
        if (item.isFab) {
          return (
            <button
              key={item.path}
              className="bottom-nav__fab"
              onClick={() => navigate(item.path)}
              aria-label="צור פלאו חדש"
            >
              <span className="bottom-nav__fab-icon">+</span>
            </button>
          );
        }
        
        return (
          <button
            key={item.path}
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="bottom-nav__icon">{item.icon}</span>
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
