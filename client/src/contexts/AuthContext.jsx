import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import jwtDecode from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configurar axios com token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Verificar token ao iniciar
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Verificar se o token expirou
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          logout();
          toast.error('Sua sessão expirou. Por favor, faça login novamente.');
          setLoading(false);
          return;
        }

        // Verificar token no servidor
        const response = await axios.get('/api/auth/verify-token');
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error('Erro ao verificar token:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Login
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setCurrentUser(user);
      
      toast.success('Login realizado com sucesso!');
      return user;
    } catch (error) {
      console.error('Erro no login:', error);
      const message = error.response?.data?.message || 'Erro ao fazer login';
      toast.error(message);
      throw error;
    }
  };

  // Registro
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setCurrentUser(user);
      
      toast.success('Registro realizado com sucesso!');
      return user;
    } catch (error) {
      console.error('Erro no registro:', error);
      const message = error.response?.data?.message || 'Erro ao fazer registro';
      toast.error(message);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Recuperação de senha
  const forgotPassword = async (email) => {
    try {
      await axios.post('/api/auth/forgot-password', { email });
      toast.success('Instruções de recuperação de senha enviadas para seu email');
    } catch (error) {
      console.error('Erro na recuperação de senha:', error);
      const message = error.response?.data?.message || 'Erro ao solicitar recuperação de senha';
      toast.error(message);
      throw error;
    }
  };

  // Redefinição de senha
  const resetPassword = async (token, password) => {
    try {
      await axios.post('/api/auth/reset-password', { token, password });
      toast.success('Senha redefinida com sucesso!');
    } catch (error) {
      console.error('Erro na redefinição de senha:', error);
      const message = error.response?.data?.message || 'Erro ao redefinir senha';
      toast.error(message);
      throw error;
    }
  };

  // Atualizar perfil
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/client/profile', profileData);
      setCurrentUser({
        ...currentUser,
        ...profileData
      });
      toast.success('Perfil atualizado com sucesso!');
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      const message = error.response?.data?.message || 'Erro ao atualizar perfil';
      toast.error(message);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAdmin: currentUser?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
