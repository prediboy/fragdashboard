import React, { useState, useEffect } from 'react';
import SellerDashboard from './components/SellerDashboard';

export default function App() {
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

  return (
    <SellerDashboard
      isDark={isDark}
      onToggleTheme={() => setIsDark(prev => !prev)}
    />
  );
}
