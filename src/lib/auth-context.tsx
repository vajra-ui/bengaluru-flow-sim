import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'commuter' | 'operator';

export interface User {
  phone: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string, role: UserRole) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users
const MOCK_USERS = [
  { phone: '9876543210', password: 'commuter123', role: 'commuter' as const, name: 'Priya Sharma' },
  { phone: '9876543211', password: 'operator123', role: 'operator' as const, name: 'Rajesh Kumar' },
  { phone: '1234567890', password: 'pass', role: 'commuter' as const, name: 'Demo Commuter' },
  { phone: '0987654321', password: 'pass', role: 'operator' as const, name: 'Demo Operator' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (phone: string, password: string, role: UserRole): boolean => {
    // Accept any phone (10 digits) + any password for the selected role (mock)
    if (phone.length >= 10 && password.length >= 1) {
      const found = MOCK_USERS.find(u => u.phone === phone && u.password === password && u.role === role);
      if (found) {
        setUser({ phone: found.phone, role: found.role, name: found.name });
        return true;
      }
      // Fallback: accept any credentials for demo purposes
      setUser({ phone, role, name: role === 'commuter' ? 'Commuter User' : 'Operator User' });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
