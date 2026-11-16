import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

interface AuthContextType {
  user: User | { displayName?: string; email?: string } | null;
  role: 'admin' | 'user' | 'guest';
  loading: boolean;
  token: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithPassword: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'guest',
  loading: true,
  token: null,
  loginWithGoogle: async () => {},
  loginWithPassword: async () => false,
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | { displayName?: string; email?: string } | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | 'guest'>('guest');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRole = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setRole(data.role || 'user');
        if (data.user && !user) {
          setUser({ displayName: data.user.name, email: data.user.email });
        }
      }
    } catch (err) {
      console.error('Erro ao verificar permissões de usuário:', err);
      setRole('user');
    }
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchRole(token);
    }
  };

  useEffect(() => {
    // Check if an admin password session exists in session storage
    const savedAdminToken = sessionStorage.getItem('ninho2_admin_token');
    if (savedAdminToken) {
      setToken(savedAdminToken);
      setUser({ displayName: 'Administrador Ninho Verde II', email: 'kaueia78@gmail.com' });
      setRole('admin');
      fetchRole(savedAdminToken);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // If we already have an active admin session token, prioritize it
      if (sessionStorage.getItem('ninho2_admin_token')) {
        setLoading(false);
        return;
      }

      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          setToken(idToken);
          await fetchRole(idToken);
        } catch (error) {
          console.error('Erro ao obter token do Firebase:', error);
          setToken(null);
          setRole('guest');
        }
      } else {
        setToken(null);
        setRole('guest');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithPassword = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Senha incorreta');
      }

      const adminToken = data.token;
      sessionStorage.setItem('ninho2_admin_token', adminToken);
      setToken(adminToken);
      setUser({ displayName: data.user.name, email: data.user.email });
      setRole('admin');
      return true;
    } catch (err: any) {
      console.error('Falha no login com senha administrativa:', err);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      await fetchRole(idToken);
    } catch (error: any) {
      console.error('Falha no login com Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      sessionStorage.removeItem('ninho2_admin_token');
      await signOut(auth);
      setUser(null);
      setToken(null);
      setRole('guest');
    } catch (error) {
      console.error('Falha ao sair:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        token,
        loginWithGoogle,
        loginWithPassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
