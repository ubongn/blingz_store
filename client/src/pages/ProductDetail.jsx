import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';
import { ProductDetailSkeleton } from '../components/Skeleton';
import { FiArrowLeft, FiStar } from 'react-icons/fi';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isLoggedIn, setCartCount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch(`/products/${id}`).then(data => {
      setProduct(data);
      setSelectedImage(data.image_url || '');
      setLoading(false);
    });
  }, [id]);

  async function handleAddToCart() {
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

  async function handleReview(e) {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error('Please login to leave a review');
      return;
    }

    setSubmitting(true);
    const res = await apiFetch(`/products/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
    setSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Review submitted');
      setComment('');
      setRating(5);
      const updated = await apiFetch(`/products/${id}`);
      setProduct(updated);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!product || product.error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
        <Link to="/" className="text-gray-900 font-medium no-underline hover:underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Helmet>
        <title>{product.name} - BlingzStore</title>
        <meta name="description" content={product.description || `${product.name} - Shop at BlingzStore`} />
        <meta property="og:title" content={`${product.name} - BlingzStore`} />
        <meta property="og:description" content={product.description || `${product.name} - Shop at BlingzStore`} />
        <meta property="og:type" content="product" />
      </Helmet>

      <Link to="/" className="text-gray-500 text-sm no-underline hover:text-gray-900 mb-6 inline-block">
        <FiArrowLeft className="inline mr-1" /> Back to Products
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div>
            <img src={selectedImage || product.image_url} alt={product.name} className="w-full h-80 md:h-96 object-cover" />
            {product.images && product.images.length > 0 && (
              <div className="flex gap-2 p-3 border-t border-gray-100">
                <button
                  onClick={() => setSelectedImage(product.image_url)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer p-0 ${selectedImage === product.image_url ? 'border-gray-900' : 'border-transparent'}`}
                >
                  <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                </button>
                {product.images.map(img => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer p-0 ${selectedImage === img.image_url ? 'border-gray-900' : 'border-transparent'}`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-8 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            {product.category && (
              <span className="inline-block bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded mb-4 w-fit">{product.category}</span>
            )}
            <p className="text-2xl font-bold text-gray-900 mb-4">₦{product.price.toFixed(2)}</p>

            {product.avgRating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <FiStar key={s} className={s <= Math.round(product.avgRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="text-gray-500 text-sm">({product.avgRating}) · {product.reviews?.length || 0} reviews</span>
              </div>
            )}

            <p className="text-gray-600 leading-relaxed mb-4">{product.description}</p>

            <div className="mb-6">
              <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 cursor-pointer border-none w-fit disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

        {isLoggedIn && (
          <form onSubmit={handleReview} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Write a Review</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`bg-transparent border-none cursor-pointer hover:scale-110 transition-transform ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <FiStar className={star <= rating ? 'fill-current' : ''} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Share your experience..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 cursor-pointer border-none disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {product.reviews?.length > 0 ? (
          <div className="space-y-4">
            {product.reviews.map((review, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <FiStar key={s} className={s <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
                    ))}
                  </div>
                  <span className="text-gray-400 text-sm">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-600 mb-2">{review.comment}</p>
                <p className="text-gray-400 text-sm">by {review.email}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
        )}
      </div>
    </div>
  );
}
