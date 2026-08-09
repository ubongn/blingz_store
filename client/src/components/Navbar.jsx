import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBell, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { isLoggedIn, cartCount, logout, user, notifications, unreadCount, setUnreadCount, refreshNotifications } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    setDropdownOpen(false);
    toast.success('Logged out');
    navigate('/');
  }

  async function markAsRead(id) {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    setUnreadCount(prev => Math.max(0, prev - 1));
    refreshNotifications();
  }

  async function markAllRead() {
    await apiFetch('/api/notifications/read-all', { method: 'PUT' });
    setUnreadCount(0);
    refreshNotifications();
  }

  function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200" role="navigation" aria-label="Main navigation">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-900 no-underline">
          BlingzStore
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-600 hover:text-gray-900 no-underline text-sm font-medium">
            Home
          </Link>

          {isLoggedIn ? (
            <>
              {user?.is_admin ? (
                <>
                  <Link to="/admin" className="text-gray-600 hover:text-gray-900 no-underline text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link to="/admin/products" className="text-gray-600 hover:text-gray-900 no-underline text-sm font-medium">
                    Products
                  </Link>
                  <Link to="/admin/orders" className="text-gray-600 hover:text-gray-900 no-underline text-sm font-medium">
                    Orders
                  </Link>
                  <Link to="/admin/coupons" className="text-gray-600 hover:text-gray-900 no-underline text-sm font-medium">
                    Coupons
                  </Link>
                  <Link to="/admin/users" className="text-gray-600 hover:text-gray-900 no-underline text-sm font-medium">
                    Users
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/wishlist" className="text-gray-600 hover:text-gray-900 no-underline text-sm font-medium">
                    Wishlist
                  </Link>
                  <Link to="/cart" className="text-gray-600 hover:text-gray-900 no-underline text-sm font-medium relative">
                    Cart
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/orders" className="text-gray-600 hover:text-gray-900 no-underline text-sm font-medium">
                    Orders
                  </Link>
                </>
              )}

              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative bg-transparent border-none cursor-pointer p-1"
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                  aria-expanded={notifOpen}
                  aria-haspopup="true"
                >
                  <FiBell className="w-6 h-6" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50" role="region" aria-label="Notifications panel">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-900 text-sm">Notifications</p>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-gray-500 hover:text-gray-900 bg-transparent border-none cursor-pointer">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-gray-400">No notifications</p>
                      ) : (
                        notifications.slice(0, 10).map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => !notif.is_read && markAsRead(notif.id)}
                            className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50' : ''}`}
                          >
                            <p className="text-sm text-gray-700">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="bg-gray-900 text-white rounded-full w-10 h-10 flex items-center justify-center font-medium text-sm overflow-hidden">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user?.full_name)
                    )}
                  </div>
                  <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50" role="menu" aria-label="User menu">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-900 text-sm">{user?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline"
                      >
                        My Profile
                      </Link>
                      {!user?.is_admin && (
                        <>
                          <Link
                            to="/orders"
                            onClick={() => setDropdownOpen(false)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline"
                          >
                            My Orders
                          </Link>
                          <Link
                            to="/wishlist"
                            onClick={() => setDropdownOpen(false)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline"
                          >
                            My Wishlist
                          </Link>
                        </>
                      )}
                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline"
                      >
                        Account Settings
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-gray-900 no-underline text-sm font-medium">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium no-underline hover:bg-gray-700"
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
