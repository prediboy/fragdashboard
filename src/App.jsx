import React, { useState, useEffect } from 'react';
import SellerDashboard from './components/SellerDashboard';
import FragAdminDashboard from './components/FragAdminDashboard';

export default function App() {
  const [currentView, setCurrentView] = useState('admin'); // 'admin' | 'seller'
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('theme') !== 'light';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (e) {}
  }, [isDark]);

  if (currentView === 'seller') {
    return (
      <SellerDashboard
        isDark={isDark}
        onToggleTheme={() => setIsDark(prev => !prev)}
        onSwitchToAdminView={() => setCurrentView('admin')}
      />
    );
  }

  return (
    <FragAdminDashboard
      isDark={isDark}
      onToggleTheme={() => setIsDark(prev => !prev)}
      onSwitchToSellerView={() => setCurrentView('seller')}
    />
  );
}
