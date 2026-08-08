import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

const STATUS_STEPS = ['Processing', 'Shipped', 'Delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    apiFetch(`/orders/${id}`).then(data => {
      setOrder(data);
      setLoading(false);
    });
  }, [id, isLoggedIn, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading order...</p>
      </div>
    );
  }

  if (!order || order.error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
        <Link to="/orders" className="text-gray-900 font-medium no-underline hover:underline">Back to Orders</Link>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/orders" className="text-gray-500 text-sm no-underline hover:text-gray-900 mb-6 inline-block">
        &larr; Back to Orders
      </Link>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Order #{order.id}</h2>

      {/* Order Tracking */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Order Status</h3>
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, i) => (
            <div key={step} className="flex-1 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                i <= currentStep ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i <= currentStep ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-2 font-medium ${i <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Shipping Details</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Name:</span> {order.full_name}</p>
            <p><span className="text-gray-500">Address:</span> {order.address}</p>
            <p><span className="text-gray-500">City:</span> {order.city}</p>
            <p><span className="text-gray-500">Phone:</span> {order.phone}</p>
            <p><span className="text-gray-500">Date:</span> {new Date(order.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Payment & Items</h3>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Payment:</span>
              <span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Method:</span>
              <span className="font-medium text-gray-900 capitalize">{order.payment_method || 'N/A'}</span>
            </div>
            {order.coupon_code && (
              <div className="flex justify-between">
                <span className="text-gray-500">Coupon:</span>
                <span className="font-medium text-green-600">{order.coupon_code}</span>
              </div>
            )}
            {order.discount_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Discount:</span>
                <span className="font-medium text-green-600">-₦{order.discount_amount.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">₦{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Total</span>
              <span className="font-bold text-gray-900">₦{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
