import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { isLoggedIn, cartCount, logout, user } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
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

  function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
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

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
                >
                  <div className="bg-gray-900 text-white rounded-full w-10 h-10 flex items-center justify-center font-medium text-sm">
                    {getInitials(user?.full_name)}
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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
