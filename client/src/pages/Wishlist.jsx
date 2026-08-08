import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    apiFetch('/wishlist').then(data => {
      setItems(data);
      setLoading(false);
    });
  }, [isLoggedIn, navigate]);

  async function handleRemove(productId) {
    await apiFetch(`/wishlist/${productId}`, { method: 'DELETE' });
    toast.success('Removed from wishlist');
    setItems(items.filter(item => item.product_id !== productId));
  }

  async function handleAddToCart(productId) {
    const res = await apiFetch('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Added to cart');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading wishlist...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-6">Save items you love for later</p>
        <Link to="/" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-medium no-underline hover:bg-gray-700">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Link to={`/product/${item.product_id}`}>
              <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
            </Link>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
              <p className="text-lg font-bold text-gray-900 mb-3">₦{item.price.toFixed(2)}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToCart(item.product_id)}
                  className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 cursor-pointer border-none"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => handleRemove(item.product_id)}
                  className="text-red-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 cursor-pointer border border-red-200 bg-transparent"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
