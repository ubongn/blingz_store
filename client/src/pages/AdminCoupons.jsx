import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_uses: '', expires_at: '' });
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn || !user?.is_admin) {
      navigate('/');
      return;
    }
    loadCoupons();
  }, [isLoggedIn, user, navigate]);

  async function loadCoupons() {
    const data = await apiFetch('/api/admin/coupons');
    if (Array.isArray(data)) {
      setCoupons(data);
    }
    setLoading(false);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function openCreate() {
    setEditingCoupon(null);
    setForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_uses: '', expires_at: '' });
    setShowForm(true);
  }

  function openEdit(coupon) {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: coupon.min_order_amount?.toString() || '',
      max_uses: coupon.max_uses?.toString() || '',
      expires_at: coupon.expires_at?.split('T')[0] || '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const body = {
      ...form,
      discount_value: parseFloat(form.discount_value),
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      max_uses: parseInt(form.max_uses) || 0,
      is_active: true,
    };

    let res;
    if (editingCoupon) {
      res = await apiFetch(`/api/admin/coupons/${editingCoupon.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    } else {
      res = await apiFetch('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    }

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(editingCoupon ? 'Coupon updated' : 'Coupon created');
      setShowForm(false);
      loadCoupons();
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this coupon?')) return;
    const res = await apiFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Coupon deleted');
      loadCoupons();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading coupons...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Coupons</h2>
        <button
          onClick={openCreate}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 cursor-pointer border-none"
        >
          + New Coupon
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 uppercase"
                  placeholder="SUMMER20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="discount_type"
                  value={form.discount_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₦)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <input
                  type="number"
                  name="discount_value"
                  value={form.discount_value}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder={form.discount_type === 'percentage' ? '20' : '500'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₦)</label>
                <input
                  type="number"
                  name="min_order_amount"
                  value={form.min_order_amount}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses (0 = unlimited)</label>
                <input
                  type="number"
                  name="max_uses"
                  value={form.max_uses}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                <input
                  type="date"
                  name="expires_at"
                  value={form.expires_at}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 cursor-pointer border-none"
              >
                {editingCoupon ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer border-none"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {coupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No coupons yet</p>
          <button
            onClick={openCreate}
            className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 cursor-pointer border-none"
          >
            Create your first coupon
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Code</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Discount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Min Order</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Uses</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Expires</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{coupon.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₦${coupon.discount_value}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">₦{coupon.min_order_amount || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {coupon.used_count}{coupon.max_uses > 0 ? ` / ${coupon.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => openEdit(coupon)}
                      className="text-gray-900 hover:underline bg-transparent border-none cursor-pointer mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="text-red-600 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
