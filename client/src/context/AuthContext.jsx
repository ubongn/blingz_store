import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastNotifCount = useRef(0);

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

  const refreshNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    const data = await apiFetch('/api/notifications');
    if (Array.isArray(data)) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  }, [token]);

  useEffect(() => {
    refreshCart();
    refreshNotifications();
  }, [token, refreshCart, refreshNotifications]);

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      const data = await apiFetch('/api/notifications');
      if (Array.isArray(data)) {
        const newUnread = data.filter(n => !n.is_read).length;
        if (lastNotifCount.current > 0 && data.length > lastNotifCount.current) {
          const newest = data[0];
          toast(newest.message, { duration: 5000 });
        }
        setNotifications(data);
        setUnreadCount(newUnread);
        lastNotifCount.current = data.length;
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    lastNotifCount.current = notifications.length;
  }, [notifications.length]);

  function login(newToken) {
    setToken(newToken);
  }

  function logout() {
    setToken(null);
    setCartCount(0);
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    lastNotifCount.current = 0;
  }

  const isLoggedIn = !!token;

  return (
    <AuthContext.Provider value={{
      token, isLoggedIn, login, logout,
      cartCount, setCartCount, refreshCart,
      user, setUser,
      notifications, unreadCount, setUnreadCount, refreshNotifications
    }}>
      {children}
    </AuthContext.Provider>
  );
}
