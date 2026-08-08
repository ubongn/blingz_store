import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      apiFetch('/api/profile').then(data => {
        if (data && !data.error) setUser(data);
      });
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const refreshCart = useCallback(async () => {
    if (!token) {
      setCartCount(0);
      return;
    }
    const data = await apiFetch('/cart');
    if (Array.isArray(data)) {
      setCartCount(data.length);
    }
  }, [token]);

  useEffect(() => {
    refreshCart();
  }, [token, refreshCart]);

  function login(newToken) {
    setToken(newToken);
  }

  function logout() {
    setToken(null);
    setCartCount(0);
    setUser(null);
  }

  const isLoggedIn = !!token;

  return (
    <AuthContext.Provider value={{ token, isLoggedIn, login, logout, cartCount, setCartCount, refreshCart, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
