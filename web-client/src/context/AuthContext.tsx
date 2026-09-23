import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  phone: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  language?: string;
  aliases?: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('phonemail_token');
    const savedUser = localStorage.getItem('phonemail_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('phonemail_user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleSetUser = (newUser: User) => {
    setUser(newUser);
    setToken(localStorage.getItem('phonemail_token'));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('phonemail_token');
    localStorage.removeItem('phonemail_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, logout, setUser: handleSetUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
