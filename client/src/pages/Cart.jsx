import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';
import { CartSkeleton } from '../components/Skeleton';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn, setCartCount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    loadCart();
  }, [isLoggedIn, navigate]);

  async function loadCart() {
    const data = await apiFetch('/cart');
    setItems(data);
    setCartCount(data.length);
    setLoading(false);
  }

  async function handleRemove(itemId) {
    const res = await apiFetch(`/cart/${itemId}`, { method: 'DELETE' });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Removed from cart');
      if (res.cartCount !== undefined) setCartCount(res.cartCount);
      loadCart();
    }
  }

  async function handleUpdateQuantity(itemId, newQty) {
    if (newQty < 1) return;
    const res = await apiFetch(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity: newQty }),
    });
    if (res.error) {
      toast.error(res.error);
    } else {
      loadCart();
    }
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <CartSkeleton />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some products to get started</p>
        <Link to="/" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-medium no-underline hover:bg-gray-700">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h2>

      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              <p className="text-gray-500 text-sm">₦{item.price.toFixed(2)} each</p>
              {item.stock <= 5 && (
                <p className="text-orange-500 text-xs mt-1">Only {item.stock} left in stock</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              >
                -
              </button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button
                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
                className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">₦{(item.price * item.quantity).toFixed(2)}</p>
              <button
                onClick={() => handleRemove(item.id)}
                className="text-red-500 text-sm mt-1 hover:underline bg-transparent border-none cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-medium text-gray-700">Total</span>
          <span className="text-2xl font-bold text-gray-900">₦{total.toFixed(2)}</span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-700 cursor-pointer border-none"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
