import { createContext, useContext, useEffect, useState } from "react";
import { AUTH_KEY } from "../components/RequireAuth.jsx";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user data from localStorage on mount
    try {
      const userData = localStorage.getItem('hms_user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
      localStorage.removeItem('hms_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem(AUTH_KEY, token);
    if (userData) {
      localStorage.setItem('hms_user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('hms_user');
    setUser(null);
  };

  const updateUser = (userData) => {
    localStorage.setItem('hms_user', JSON.stringify(userData));
    setUser(userData);
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider  value={value}> 
      {children} 
    </AuthContext.Provider>  
  ); 
}  
