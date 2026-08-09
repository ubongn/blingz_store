import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';
import { FiCamera } from 'react-icons/fi';

export default function Profile() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { isLoggedIn, user, setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    apiFetch('/api/profile').then(data => {
      if (data && !data.error) {
        setFullName(data.full_name || '');
        setEmail(data.email || '');
        setAvatarUrl(data.avatar_url || '');
      }
      setLoading(false);
    });
  }, [isLoggedIn, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const res = await apiFetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ full_name: fullName }),
    });

    setSaving(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Profile updated');
      setUser({ ...user, full_name: fullName, email, avatar_url: avatarUrl });
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    const res = await fetch('http://localhost:5000/api/profile/avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: fd,
    });
    const data = await res.json();
    setUploading(false);

    if (data.error) {
      toast.error(data.error);
    } else {
      setAvatarUrl(data.url);
      setUser({ ...user, avatar_url: data.url });
      toast.success('Avatar updated');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gray-900 text-white flex items-center justify-center text-2xl font-bold overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                fullName ? fullName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-white border border-gray-200 rounded-full p-1.5 cursor-pointer hover:bg-gray-50 shadow-sm">
              <FiCamera className="w-4 h-4 text-gray-600" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{fullName || 'No name set'}</p>
            <p className="text-sm text-gray-500">{email}</p>
            {uploading && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 cursor-pointer border-none"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
