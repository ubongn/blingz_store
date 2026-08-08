import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';
import ProductCard from '../components/ProductCard';

const categories = [
  { name: 'Hair', emoji: '💇‍♀️' },
  { name: 'Honey', emoji: '🍯' },
  { name: 'Plantain Chips', emoji: '🍌' },
  { name: 'Oils & Care', emoji: '🧴' },
  { name: 'Bundles', emoji: '📦' },
];

const testimonials = [
  { name: 'Adaeze Nwosu', quote: 'The braided wig I ordered is absolutely gorgeous! It looks so natural and the quality is top notch. BlingzStore is my go-to for hair now.', stars: 5 },
  { name: 'Blessing Okonkwo', quote: 'The plantain chips are so addictive! My kids finished the spicy pack in one sitting. Already ordering again. Best chips I\'ve tasted in a long time.', stars: 5 },
  { name: 'Halima Bello', quote: 'I love the raw honey — it\'s so pure and sweet. I use it for my tea and skincare. The coconut oil is also amazing for my hair. Highly recommend!', stars: 5 },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    apiFetch('/products').then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  function handleNewsletter(e) {
    e.preventDefault();
    setEmail('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading products...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-700 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to BlingzStore</h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">Discover amazing products at great prices</p>
          <a href="#products" className="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 no-underline transition-colors">
            Shop Now
          </a>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map(cat => (
            <div key={cat.name} className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
              <span className="text-4xl block mb-2">{cat.emoji}</span>
              <span className="font-medium text-gray-900">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Our Best Sellers</h2>
        <p className="text-gray-500 mb-8 text-center">Top picks loved by our customers</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 4).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* All Products */}
      <section id="products" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Browse Our Collection</h2>
        <p className="text-gray-500 mb-8 text-center">Find exactly what you're looking for</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">What Our Customers Say</h2>
          <p className="text-gray-500 mb-8 text-center">Real reviews from real shoppers</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex mb-3">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <span key={si} className={si < t.stars ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{t.quote}"</p>
                <p className="font-semibold text-gray-900">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Stay in the Loop</h2>
          <p className="text-gray-400 mb-6">Subscribe for exclusive deals and new arrivals</p>
          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button type="submit" className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 cursor-pointer border-none">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
