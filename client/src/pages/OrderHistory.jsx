import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import { OrderSkeleton } from '../components/Skeleton';

const STATUS_COLORS = {
  Processing: 'bg-yellow-100 text-yellow-800',
  Shipped: 'bg-blue-100 text-blue-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    apiFetch('/orders').then(data => {
      setOrders(data);
      setLoading(false);
    });
  }, [isLoggedIn, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <OrderSkeleton />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h2>
        <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
        <Link to="/" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-medium no-underline hover:bg-gray-700">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>

      <div className="space-y-4">
        {orders.map(order => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="bg-white rounded-xl border border-gray-200 p-6 block no-underline hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Order #{order.id}</p>
                <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">₦{order.total.toFixed(2)}</p>
                <span className={`inline-block text-xs px-2 py-1 rounded font-medium mt-1 ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                  {order.status}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
