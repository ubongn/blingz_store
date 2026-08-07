import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  function login(newToken) {
    setToken(newToken);
  }

  function logout() {
    setToken(null);
    setCartCount(0);
  }

  const isLoggedIn = !!token;

  return (
    <AuthContext.Provider value={{ token, isLoggedIn, login, logout, cartCount, setCartCount }}>
      {children}
    </AuthContext.Provider>
  );
}
