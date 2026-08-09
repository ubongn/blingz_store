import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ total, form, couponCode, discountAmount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const { refreshCart, refreshNotifications } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      toast.error(submitError.message);
      setProcessing(false);
      return;
    }

    const res = await apiFetch('/checkout/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({ amount: total, coupon_code: couponCode || undefined }),
    });

    if (res.error) {
      toast.error(res.error);
      setProcessing(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret: res.clientSecret,
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message);
      setProcessing(false);
      return;
    }

    const orderRes = await apiFetch('/checkout', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        payment_intent_id: res.paymentIntentId,
        coupon_code: couponCode || '',
        discount_amount: discountAmount || 0,
      }),
    });

    if (orderRes.error) {
      toast.error(orderRes.error);
    } else {
      toast.success('Order placed!');
      refreshCart();
      refreshNotifications();
      navigate(`/order-confirmation/${orderRes.orderId}`);
    }
    setProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 cursor-pointer border-none"
      >
        {processing ? 'Processing...' : `Pay ₦${(total - discountAmount).toFixed(2)}`}
      </button>
    </form>
  );
}

export default function Checkout() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ full_name: '', address: '', city: '', phone: '' });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [suggestedCoupons, setSuggestedCoupons] = useState([]);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    apiFetch('/cart').then(data => {
      if (data.length === 0) {
        navigate('/cart');
        return;
      }
      setItems(data);
      setLoading(false);
    });
    apiFetch('/checkout/suggest-coupons').then(data => {
      if (Array.isArray(data)) setSuggestedCoupons(data);
    });
  }, [isLoggedIn, navigate]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const res = await apiFetch('/checkout/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ code: couponCode, orderAmount: subtotal }),
    });
    setCouponLoading(false);

    if (res.error) {
      toast.error(res.error);
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } else {
      setAppliedCoupon(res);
      setDiscountAmount(res.discount_amount);
      toast.success(`Coupon applied! You save ₦${res.discount_amount.toFixed(2)}`);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
  }

  async function applyCouponDirect(code) {
    setCouponLoading(true);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const res = await apiFetch('/checkout/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ code, orderAmount: subtotal }),
    });
    setCouponLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      setAppliedCoupon(res);
      setDiscountAmount(res.discount_amount);
      toast.success(`Coupon applied! You save ₦${res.discount_amount.toFixed(2)}`);
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalTotal = subtotal - discountAmount;

  useEffect(() => {
    if (items.length > 0 && finalTotal > 0) {
      apiFetch('/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({ amount: finalTotal }),
      }).then(data => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
      });
    }
  }, [items, finalTotal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <img src={item.image_url} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                  <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-900">₦{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Have a coupon?</label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span className="text-sm text-green-700 font-medium">{appliedCoupon.code} — {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% off` : `₦${appliedCoupon.discount_value} off`}</span>
                <button onClick={removeCoupon} className="text-red-500 text-xs hover:underline bg-transparent border-none cursor-pointer">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 cursor-pointer border-none"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
            )}
          </div>

          {suggestedCoupons.length > 0 && !appliedCoupon && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Available coupons:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedCoupons.map(coupon => (
                  <button
                    key={coupon.code}
                    type="button"
                    onClick={() => { setCouponCode(coupon.code); applyCouponDirect(coupon.code); }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs text-green-700 hover:bg-green-100 cursor-pointer transition-colors"
                  >
                    <span className="font-medium">{coupon.code}</span>
                    <span>— {coupon.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">₦{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Discount</span>
                <span className="text-green-600">-₦{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="font-medium text-gray-700">Total</span>
              <span className="font-bold text-gray-900 text-lg">₦{finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="123 Main Street"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Lagos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="08012345678"
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm items={items} total={finalTotal} form={form} couponCode={couponCode} discountAmount={discountAmount} />
            </Elements>
          ) : (
            <p className="text-gray-500 text-sm">Loading payment...</p>
          )}
        </div>
      </div>
    </div>
  );
}
