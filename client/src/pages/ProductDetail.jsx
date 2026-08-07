import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';

const LOREM = {
  1: `Experience premium sound quality with these wireless headphones. Featuring advanced noise-cancelling technology, you can immerse yourself in your favorite music without distractions. The over-ear design provides comfort for extended listening sessions, while the built-in microphone allows for clear hands-free calls. With up to 30 hours of battery life, these headphones are perfect for travel, work, or everyday use. The foldable design makes them easy to carry wherever you go.`,
  2: `These lightweight running shoes are designed for maximum comfort and performance. The breathable mesh upper keeps your feet cool and dry, while the responsive cushioning absorbs impact with every stride. Whether you're hitting the track or training at the gym, these shoes provide the support and flexibility you need. The durable rubber outsole offers excellent traction on various surfaces. Available in multiple colors to match your style.`,
  3: `Stay organized with this water-resistant laptop backpack. Designed for the modern professional, it features a padded compartment that fits laptops up to 15.6 inches. Multiple pockets keep your essentials — phone, wallet, keys, and charger — neatly arranged. The water-resistant material protects your belongings from light rain, while the adjustable straps provide a comfortable fit for all-day wear. Perfect for work, school, or travel.`,
  4: `Track your fitness goals with this feature-packed smart watch. Monitor your heart rate, count steps, and track calories burned throughout the day. The vibrant display shows real-time notifications from your phone, so you never miss an important message. With water resistance up to 50 meters, you can wear it while swimming or showering. The long-lasting battery keeps up with your active lifestyle for up to 7 days on a single charge.`,
  5: `Start your mornings right with this 12-cup programmable coffee maker. Set it up the night before and wake up to freshly brewed coffee. The programmable timer lets you schedule brewing up to 24 hours in advance, while the adjustable strength control lets you customize each cup. The built-in thermal carafe keeps your coffee hot for hours without a hot plate. Easy-to-use controls and a sleek design make this coffee maker a great addition to any kitchen.`,
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch(`/products/${id}`).then(data => {
      setProduct(data);
      setLoading(false);
    });
  }, [id]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (!product || product.error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
        <Link to="/" className="text-gray-900 font-medium no-underline hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const description = LOREM[product.id] || product.description;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/" className="text-gray-500 text-sm no-underline hover:text-gray-900 mb-6 inline-block">
        &larr; Back to Products
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-80 md:h-full object-cover"
          />
          <div className="p-8 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            <p className="text-2xl font-bold text-gray-900 mb-6">₦{product.price.toFixed(2)}</p>
            <p className="text-gray-600 leading-relaxed mb-8">{description}</p>
            <button
              onClick={handleAddToCart}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 cursor-pointer border-none w-fit"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
