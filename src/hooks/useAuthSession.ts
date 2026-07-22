import { useState, useEffect } from 'react';
import { User } from '../types';

export function useAuthSession() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('raffle_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.user || null;
      }
    } catch (e) {
      console.error('Error loading session from localStorage:', e);
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('raffle_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.token || null;
      }
    } catch (e) {
      console.error('Error loading token from localStorage:', e);
    }
    return null;
  });

  // Sync session with localStorage whenever currentUser or token changes
  useEffect(() => {
    if (currentUser && token) {
      localStorage.setItem('raffle_user_session', JSON.stringify({ user: currentUser, token }));
    } else if (!currentUser) {
      localStorage.removeItem('raffle_user_session');
    }
  }, [currentUser, token]);

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('raffle_user_session');
  };

  return {
    currentUser,
    setCurrentUser,
    token,
    setToken,
    handleLogout,
  };
}
