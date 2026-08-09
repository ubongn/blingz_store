import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { apiFetch } from '../api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import { FiSliders, FiX, FiStar } from 'react-icons/fi';

const CATEGORIES = ['Hair', 'Honey', 'Plantain Chips', 'Oils & Care'];
const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
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
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [featured, setFeatured] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sort) params.set('sort', sort);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    params.set('page', page);
    params.set('limit', 6);

    apiFetch(`/products?${params}`).then(data => {
      if (data.products) {
        setProducts(data.products);
        setTotalPages(data.totalPages);
      }
      setLoading(false);
    });
  }, [search, selectedCategory, sort, minPrice, maxPrice, page]);

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

  function clearFilters() {
    setSearch('');
    setSelectedCategory('');
    setSort('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  }

  function handleNewsletter(e) {
    e.preventDefault();
    setEmail('');
  }

  const hasActiveFilters = search || selectedCategory || sort || minPrice || maxPrice;

  return (
    <div>
      <Helmet>
        <title>BlingzStore - Quality Hair, Honey & Plantain Chips in Abuja</title>
        <meta name="description" content="Shop premium braided wigs, organic honey, plantain chips and hair care products at BlingzStore. Fast delivery in Abuja, Nigeria." />
        <meta property="og:title" content="BlingzStore - Quality Hair, Honey & Plantain Chips" />
        <meta property="og:description" content="Shop premium braided wigs, organic honey, plantain chips and hair care products." />
        <meta property="og:type" content="website" />
      </Helmet>
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
      {!search && !selectedCategory && !sort && !minPrice && !maxPrice && (
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

        {/* Search + Filter Toggle */}
        <div className="max-w-xl mx-auto mb-6 flex gap-2">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search products..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button type="submit" className="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-700 cursor-pointer border-none">
              Search
            </button>
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FiSliders className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="max-w-xl mx-auto mb-6 flex flex-wrap items-center gap-2">
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-sm rounded-full">
                {selectedCategory}
                <button onClick={() => { setSelectedCategory(''); setPage(1); }} className="ml-1 text-white hover:text-gray-300 bg-transparent border-none cursor-pointer p-0 text-sm"><FiX className="w-3 h-3" /></button>
              </span>
            )}
            {sort && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-sm rounded-full">
                {SORT_OPTIONS.find(o => o.value === sort)?.label}
                <button onClick={() => { setSort(''); setPage(1); }} className="ml-1 text-white hover:text-gray-300 bg-transparent border-none cursor-pointer p-0 text-sm"><FiX className="w-3 h-3" /></button>
              </span>
            )}
            {minPrice && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-sm rounded-full">
                Min ₦{minPrice}
                <button onClick={() => { setMinPrice(''); setPage(1); }} className="ml-1 text-white hover:text-gray-300 bg-transparent border-none cursor-pointer p-0 text-sm"><FiX className="w-3 h-3" /></button>
              </span>
            )}
            {maxPrice && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-sm rounded-full">
                Max ₦{maxPrice}
                <button onClick={() => { setMaxPrice(''); setPage(1); }} className="ml-1 text-white hover:text-gray-300 bg-transparent border-none cursor-pointer p-0 text-sm"><FiX className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-900 bg-transparent border-none cursor-pointer underline ml-1">
              Clear all
            </button>
          </div>
        )}

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="max-w-xl mx-auto mb-8 bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Sort by</label>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Price Range (₦)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <span className="text-gray-400">—</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-2 text-gray-900 underline bg-transparent border-none cursor-pointer">
                Clear filters
              </button>
            )}
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
                    <FiStar key={si} className={si < t.stars ? 'text-yellow-400' : 'text-gray-300'} fill={si < t.stars ? 'currentColor' : 'none'} />
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
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-white text-gray-900 placeholder-gray-500"
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
