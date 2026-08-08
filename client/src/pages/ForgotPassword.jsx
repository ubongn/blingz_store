import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    const res = await apiFetch('/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    setSending(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      setSent(true);
      if (res.token) setToken(res.token);
      toast.success('Reset link sent');
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Forgot Password</h2>
        <p className="text-gray-500 text-center mb-6 text-sm">
          Enter your email and we will send you a reset link.
        </p>

        {sent ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-gray-700 mb-2">Reset link sent to <strong>{email}</strong></p>
            {token && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Your reset token (for demo):</p>
                <code className="text-xs text-gray-900 break-all">{token}</code>
              </div>
            )}
            <Link
              to={`/reset-password?token=${token}`}
              className="inline-block bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium no-underline hover:bg-gray-700 mt-2"
            >
              Reset Password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 cursor-pointer border-none"
            >
              {sending ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              <Link to="/login" className="text-gray-900 hover:underline">Back to Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
