import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Helmet>
        <title>About Us - BlingzStore</title>
        <meta name="description" content="Learn about BlingzStore - your trusted online shop for quality hair, honey and plantain chips in Abuja, Nigeria." />
      </Helmet>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">About BlingzStore</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Story</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          BlingzStore was founded with a simple mission: to bring quality products
          directly to your doorstep at affordable prices. Based in Abuja, Nigeria,
          we started as a small online shop and have grown into a trusted destination
          for customers looking for the best deals.
        </p>
        <p className="text-gray-600 leading-relaxed">
          We believe shopping should be easy, enjoyable, and accessible to everyone.
          That is why we focus on curating the best products, offering secure payment
          options, and providing fast delivery across the country.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-3xl mb-3">Quality</div>
          <h3 className="font-semibold text-gray-900 mb-2">Quality Products</h3>
          <p className="text-sm text-gray-600">Every item is carefully selected to meet our high standards.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-3xl mb-3">Fast</div>
          <h3 className="font-semibold text-gray-900 mb-2">Fast Delivery</h3>
          <p className="text-sm text-gray-600">We deliver your orders quickly and reliably to your door.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-3xl mb-3">Secure</div>
          <h3 className="font-semibold text-gray-900 mb-2">Secure Payments</h3>
          <p className="text-sm text-gray-600">Shop with confidence using our secure payment system.</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-white mb-3">Ready to Shop?</h2>
        <p className="text-gray-400 mb-4">Explore our collection and find something you love.</p>
        <Link
          to="/"
          className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg text-sm font-medium no-underline hover:bg-gray-100"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}
