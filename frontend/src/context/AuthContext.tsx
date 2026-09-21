import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface AuthContextType {
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  updateAccount: (username?: string, githubToken?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Restore state from authService
    setIsAuthenticated(authService.isAuthenticated());
    setUsername(authService.getUsername());
  }, []);

  const login = async (user: string, pass: string) => {
    const data = await authService.login(user, pass);
    setIsAuthenticated(true);
    setUsername(data.username);
  };

  const updateAccount = async (user?: string, githubToken?: string) => {
    const data = await authService.updateAccount(user, githubToken);
    setUsername(data.username);
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ username, isAuthenticated, login, updateAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
