import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h3 className="text-white text-xl font-bold mb-3">BlingzStore</h3>
            <p className="text-sm leading-relaxed">Your one-stop shop for quality products at amazing prices.</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 list-none p-0 m-0">
              <li><Link to="/" className="text-gray-400 hover:text-white no-underline text-sm">Home</Link></li>
              <li><Link to="/cart" className="text-gray-400 hover:text-white no-underline text-sm">Cart</Link></li>
              <li><Link to="/login" className="text-gray-400 hover:text-white no-underline text-sm">Login</Link></li>
              <li><Link to="/signup" className="text-gray-400 hover:text-white no-underline text-sm">Signup</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 list-none p-0 m-0 text-sm">
              <li>support@blingzstore.com</li>
              <li>+234 800 000 000</li>
              <li>Abuja, Utako</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 list-none p-0 m-0 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white no-underline">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white no-underline">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">© 2026 BlingzStore. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-400 hover:text-white no-underline text-sm">Facebook</a>
            <a href="#" className="text-gray-400 hover:text-white no-underline text-sm">Twitter</a>
            <a href="#" className="text-gray-400 hover:text-white no-underline text-sm">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
