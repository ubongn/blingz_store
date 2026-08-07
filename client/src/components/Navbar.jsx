import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { isLoggedIn, cartCount, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.success('Logged out');
    navigate('/');
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
              <Link to="/cart" className="text-gray-600 hover:text-gray-900 no-underline text-sm font-medium relative">
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-transparent border-none cursor-pointer"
              >
                Logout
              </button>
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
