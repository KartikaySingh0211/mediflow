import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { AuthFacade, AuthSession } from '../patterns/structural/Facade';

interface AuthContextValue {
  currentUser: User | null;
  session: AuthSession | null;
  activeRole: UserRole | null;
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  switchPersona: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Check saved session
    const saved = localStorage.getItem('mediflow_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSession(parsed);
        setCurrentUser(parsed.user);
        setActiveRole(parsed.activeRole);
        return;
      } catch {
        localStorage.removeItem('mediflow_session');
      }
    }

    // Default auto-login as Dr. Robert Vance (Doctor) or Admin for seamless demo
    switchPersona('doctor');
  }, []);

  const login = async (email: string, role?: UserRole) => {
    const authSession = await AuthFacade.login(email, role);
    setSession(authSession);
    setCurrentUser(authSession.user);
    setActiveRole(authSession.activeRole);
    localStorage.setItem('mediflow_session', JSON.stringify(authSession));
  };

  const switchPersona = async (role: UserRole) => {
    const roleEmails: Record<UserRole, string> = {
      admin: 'admin@mediflow.health',
      receptionist: 'reception@mediflow.health',
      doctor: 'doctor@mediflow.health',
      nurse: 'nurse@mediflow.health',
      lab_tech: 'lab@mediflow.health',
      pharmacist: 'pharmacy@mediflow.health',
      billing_officer: 'billing@mediflow.health'
    };

    await login(roleEmails[role], role);
  };

  const logout = () => {
    setCurrentUser(null);
    setSession(null);
    setActiveRole(null);
    localStorage.removeItem('mediflow_session');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        activeRole,
        isAuthenticated: !!currentUser,
        login,
        switchPersona,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
