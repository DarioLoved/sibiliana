import { useState, useEffect } from 'react';
import { AppState } from '../types';

const APP_STATE_KEY = 'casa-mare-app-state';

export function useAppState() {
  const [appState, setAppState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(APP_STATE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const updateAppState = (updates: Partial<AppState>) => {
    setAppState(prev => {
      const newState = { ...prev, ...updates };
      localStorage.setItem(APP_STATE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const clearAppState = () => {
    setAppState({});
    localStorage.removeItem(APP_STATE_KEY);
  };

  return {
    appState,
    updateAppState,
    clearAppState
  };
}