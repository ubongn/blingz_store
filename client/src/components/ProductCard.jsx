import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../api';

export default function ProductCard({ product }) {
  const { isLoggedIn } = useAuth();

  async function handleAddToCart() {
    if (!isLoggedIn) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    const res = await apiFetch('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: product.id, quantity: 1 }),
    });

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Added to cart');
    }
  }

  return (
    <Link to={`/product/${product.id}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow block no-underline">
      <img
        src={product.image_url}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
        <p className="text-gray-500 text-sm mb-3">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">₦{product.price.toFixed(2)}</span>
          <button
            onClick={(e) => { e.preventDefault(); handleAddToCart(); }}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 cursor-pointer border-none"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
}
