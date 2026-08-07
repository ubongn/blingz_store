import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';

export default function Checkout() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: '', address: '', city: '', phone: '' });
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    apiFetch('/cart').then(data => {
      if (data.length === 0) {
        navigate('/cart');
        return;
      }
      setItems(data);
      setLoading(false);
    });
  }, [isLoggedIn, navigate]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const res = await apiFetch('/checkout', {
      method: 'POST',
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Order placed!');
      navigate(`/order-confirmation/${res.orderId}`);
    }
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <img src={item.image_url} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                  <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-900">₦{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Total</span>
              <span className="font-bold text-gray-900 text-lg">₦{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Lagos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="08012345678"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 cursor-pointer border-none"
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
