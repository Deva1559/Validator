import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export interface User {
  role: 'FACULTY' | 'STUDENT';
  name: string;
  roll_no?: string;
  department?: string;
  section?: string;
  email?: string;
  title?: string;
  assigned_use_case?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isFaculty: boolean;
  isStudent: boolean;
  login: (role: 'FACULTY' | 'STUDENT', identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  registerStudent: (data: { roll_no: string; name: string; department?: string; section?: string; pin?: string; email?: string }) => Promise<{ success: boolean; error?: string }>;
  registerFaculty: (data: { name: string; email: string; password: string; department?: string; title?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'model_validator_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (role: 'FACULTY' | 'STUDENT', identifier: string, password: string = '') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, identifier, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || 'Login failed. Please check credentials.' };
      }

      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error or backend unreachable. Please try again.' };
    }
  };

  const registerStudent = async (studentData: { roll_no: string; name: string; department?: string; section?: string; pin?: string; email?: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || 'Registration failed.' };
      }

      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error connecting to authentication service.' };
    }
  };

  const registerFaculty = async (facultyData: { name: string; email: string; password: string; department?: string; title?: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register-faculty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facultyData)
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || 'Faculty registration failed.' };
      }

      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error connecting to authentication service.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isFaculty: user?.role === 'FACULTY',
        isStudent: user?.role === 'STUDENT',
        login,
        registerStudent,
        registerFaculty,
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
