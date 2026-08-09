import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';
import { TableRowSkeleton } from '../components/Skeleton';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, user: null, action: '' });
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn || !user?.is_admin) {
      navigate('/');
      return;
    }
    loadUsers();
  }, [isLoggedIn, user, navigate]);

  async function loadUsers() {
    const data = await apiFetch('/api/admin/users');
    if (Array.isArray(data)) {
      setUsers(data);
    }
    setLoading(false);
  }

  function openModal(u, action) {
    setModal({ show: true, user: u, action });
  }

  function closeModal() {
    setModal({ show: false, user: null, action: '' });
  }

  async function confirmToggle() {
    const { user: targetUser, action } = modal;
    if (!targetUser) return;

    const res = await apiFetch(`/api/admin/users/${targetUser.id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ is_admin: action === 'make' }),
    });

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(action === 'make' ? 'Admin granted' : 'Admin removed');
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_admin: action === 'make' } : u));
    }
    closeModal();
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <tbody>
              {[1, 2, 3, 4, 5].map(i => <TableRowSkeleton key={i} cols={5} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Users</h2>

      {users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No users yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Orders</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Reviews</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-900 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-medium">
                          {u.full_name ? u.full_name[0].toUpperCase() : '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{u.full_name || 'No name'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{u.order_count}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{u.review_count}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                        {u.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {u.id !== user?.id && (
                        <button
                          onClick={() => openModal(u, u.is_admin ? 'remove' : 'make')}
                          className={`bg-transparent border-none cursor-pointer text-sm ${u.is_admin ? 'text-red-600 hover:underline' : 'text-gray-900 hover:underline'}`}
                        >
                          {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {modal.action === 'make' ? 'Make Admin' : 'Remove Admin'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {modal.action === 'make'
                ? `Are you sure you want to grant admin privileges to ${modal.user?.full_name || modal.user?.email}?`
                : `Are you sure you want to remove admin privileges from ${modal.user?.full_name || modal.user?.email}?`
              }
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggle}
                className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border-none text-white ${
                  modal.action === 'make' ? 'bg-gray-900 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {modal.action === 'make' ? 'Grant Admin' : 'Remove Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
