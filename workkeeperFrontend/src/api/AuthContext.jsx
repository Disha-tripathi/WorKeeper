import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance, { setAccessToken, clearAuth } from './axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (username, password) => {
    try {
      const res = await axiosInstance.post('/auth/login', { username, password });
      const { accessToken, id, name, role } = res.data;

      setAccessToken(accessToken);
      setUser({
        employeeId: id,
        username: name,
        role: role.toLowerCase(),
      });

      return true;
    } catch (error) {
      clearAuth();
      setUser(null);
      return false;
    }
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    window.location.href = '/login';
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await axiosInstance.get('/auth/me');
        const { id, name, role } = res.data;

        setUser({
          employeeId: id,
          username: name,
          role: role.toLowerCase(),
        });
      } catch (error) {
        console.warn('Session expired or invalid token.');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
