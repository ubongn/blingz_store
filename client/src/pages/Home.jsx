import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['Hair', 'Honey', 'Plantain Chips', 'Oils & Care'];

const testimonials = [
  { name: 'Adaeze Nwosu', quote: 'The braided wig I ordered is absolutely gorgeous! It looks so natural and the quality is top notch. BlingzStore is my go-to for hair now.', stars: 5 },
  { name: 'Blessing Okonkwo', quote: 'The plantain chips are so addictive! My kids finished the spicy pack in one sitting. Already ordering again. Best chips I\'ve tasted in a long time.', stars: 5 },
  { name: 'Halima Bello', quote: 'I love the raw honey — it\'s so pure and sweet. I use it for my tea and skincare. The coconut oil is also amazing for my hair. Highly recommend!', stars: 5 },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedCategory) params.set('category', selectedCategory);
    params.set('page', page);
    params.set('limit', 6);

    apiFetch(`/products?${params}`).then(data => {
      if (data.products) {
        setProducts(data.products);
        setTotalPages(data.totalPages);
      }
      setLoading(false);
    });
  }, [search, selectedCategory, page]);

  useEffect(() => {
    apiFetch('/products?limit=4').then(data => {
      if (data.products) setFeatured(data.products);
    });
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
  }

  function handleCategoryClick(cat) {
    setSelectedCategory(selectedCategory === cat ? '' : cat);
    setPage(1);
  }

  function handleNewsletter(e) {
    e.preventDefault();
    setEmail('');
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => (
            <div
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`rounded-xl border p-6 text-center hover:shadow-lg transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-900 border-gray-200'
              }`}
            >
              <span className="font-medium">{cat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {!search && !selectedCategory && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Our Best Sellers</h2>
          <p className="text-gray-500 mb-8 text-center">Top picks loved by our customers</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Search + All Products */}
      <section id="products" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {selectedCategory ? selectedCategory : search ? 'Search Results' : 'Browse Our Collection'}
        </h2>

        <form onSubmit={handleSearch} className="max-w-md mx-auto mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search products..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 cursor-pointer border-none">
              Search
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 px-4">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer bg-white hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
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
