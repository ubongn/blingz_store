import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import AdminCoupons from './pages/AdminCoupons';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
