import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';
import PasswordInput from '../components/PasswordInput';

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  async function handleChangePassword(e) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChanging(true);
    const res = await apiFetch('/api/change-password', {
      method: 'PUT',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    setChanging(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  async function handleDeleteAccount() {
    if (!deletePassword) {
      toast.error('Password is required');
      return;
    }

    setDeleting(true);
    const res = await apiFetch('/api/account', {
      method: 'DELETE',
      body: JSON.stringify({ password: deletePassword }),
    });
    setDeleting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Account deleted');
      logout();
      navigate('/');
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={changing}
            className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 cursor-pointer border-none"
          >
            {changing ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-700">Push notifications for new orders</span>
            <input
              type="checkbox"
              checked={localStorage.getItem('notif_orders') !== 'false'}
              onChange={(e) => {
                localStorage.setItem('notif_orders', e.target.checked);
                toast.success('Preference saved');
              }}
              className="w-4 h-4 text-gray-900 rounded focus:ring-gray-900"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-700">Push notifications for promotions</span>
            <input
              type="checkbox"
              checked={localStorage.getItem('notif_promos') !== 'false'}
              onChange={(e) => {
                localStorage.setItem('notif_promos', e.target.checked);
                toast.success('Preference saved');
              }}
              className="w-4 h-4 text-gray-900 rounded focus:ring-gray-900"
            />
          </label>
        </div>
      </div>

      {!user?.is_admin && (
        <>
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <h3 className="font-semibold text-red-600 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 cursor-pointer border-none"
            >
              Delete Account
            </button>
          </div>

          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Account</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This action is irreversible. Enter your password to confirm.
                </p>
                <PasswordInput
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => { setShowDeleteModal(false); setDeletePassword(''); }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 cursor-pointer border-none"
                  >
                    {deleting ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
