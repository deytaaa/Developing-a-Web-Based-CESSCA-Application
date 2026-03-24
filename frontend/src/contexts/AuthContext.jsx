import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  // Helper to normalize user object to always have user_id
  const normalizeUser = (user) => {
    if (!user) return null;
    // Accept both userId and user_id, prefer user_id
    if (user.user_id) return user;
    if (user.userId) return { ...user, user_id: user.userId };
    return user;
  };

  useEffect(() => {
    // Check if user is logged in on mount
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(normalizeUser(currentUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    // After login, fetch full profile to get status
    try {
      const profileRes = await authService.getProfile();
      if (profileRes && profileRes.user) {
        setUser(normalizeUser(profileRes.user));
        localStorage.setItem('user', JSON.stringify(profileRes.user));
      } else {
        setUser(normalizeUser(data.user));
      }
    } catch (e) {
      setUser(normalizeUser(data.user));
    }
    return data;
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser) => { 
    const norm = normalizeUser(updatedUser);
    setUser(norm);
    localStorage.setItem('user', JSON.stringify(norm));
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
