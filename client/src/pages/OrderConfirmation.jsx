import { Link, useParams } from 'react-router-dom';

export default function OrderConfirmation() {
  const { id } = useParams();

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-2">Thank you for your purchase.</p>
        <p className="text-sm text-gray-400 mb-6">Order #{id} — Payment confirmed</p>

        <div className="flex gap-3 justify-center">
          <Link
            to={`/orders/${id}`}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium no-underline hover:bg-gray-700"
          >
            View Order
          </Link>
          <Link
            to="/"
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium no-underline hover:bg-gray-200"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
