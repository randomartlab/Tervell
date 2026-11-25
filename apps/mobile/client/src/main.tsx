import React from 'react';
import { createRoot } from 'react-dom/client';
import { MobileApp } from './App';
import './style.css';
import { native } from './bridge';
Object.defineProperty(window, 'electronAPI', {
  value: {
    openExternal: (url: string) => native('external', {
      url
    })
  },
  configurable: false
});
createRoot(document.getElementById('root')!).render(<MobileApp />);
