import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../api';

export default function ProductCard({ product }) {
  const { isLoggedIn, setCartCount } = useAuth();
  const navigate = useNavigate();

  async function handleAddToCart(e) {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (product.stock <= 0) {
      toast.error('Product is out of stock');
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
      if (res.cartCount !== undefined) setCartCount(res.cartCount);
    }
  }

  async function handleToggleWishlist(e) {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error('Please login to save items');
      navigate('/login');
      return;
    }

    await apiFetch('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ product_id: product.id }),
    });
    toast.success('Added to wishlist');
  }

  return (
    <Link to={`/product/${product.id}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow block no-underline relative">
      {product.stock <= 0 && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-medium z-10">
          Out of Stock
        </div>
      )}
      <img
        src={product.image_url}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-gray-900">{product.name}</h3>
          <button
            onClick={handleToggleWishlist}
            className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer text-lg shrink-0 ml-2"
          >
            ♡
          </button>
        </div>
        <p className="text-gray-500 text-sm mb-1">{product.description}</p>
        {product.category && (
          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mb-2">{product.category}</span>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">₦{product.price.toFixed(2)}</span>
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  );
}
