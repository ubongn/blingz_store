import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import { formatPrice } from '../utils';
import { FiUsers, FiShoppingCart, FiDollarSign, FiPackage } from 'react-icons/fi';

const STATUS_COLORS = {
  Processing: 'bg-yellow-100 text-yellow-800',
  Shipped: 'bg-blue-100 text-blue-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn || !user?.is_admin) {
      navigate('/');
      return;
    }
    apiFetch('/api/admin/stats').then(data => {
      setStats(data);
      setLoading(false);
    });
  }, [isLoggedIn, user, navigate]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Total Revenue', value: `₦${Number(stats.totalRevenue || 0).toLocaleString()}`, icon: FiDollarSign, color: 'text-green-600' },
    { label: 'Total Orders', value: stats.totalOrders, icon: FiShoppingCart, color: 'text-blue-600' },
    { label: 'Total Users', value: stats.totalUsers, icon: FiUsers, color: 'text-purple-600' },
    { label: 'Total Products', value: stats.totalProducts, icon: FiPackage, color: 'text-orange-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}`}>
                  {status}
                </span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
            {Object.keys(stats.ordersByStatus).length === 0 && (
              <p className="text-sm text-gray-500">No orders yet</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Low Stock Alert</h3>
          <div className="space-y-3">
            {stats.lowStockProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{product.name}</span>
                <span className={`text-sm font-medium ${product.stock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                  {product.stock} left
                </span>
              </div>
            ))}
            {stats.lowStockProducts.length === 0 && (
              <p className="text-sm text-gray-500">All products well stocked</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Orders</h3>
            <Link to="/admin/orders" className="text-sm text-gray-500 hover:text-gray-900 no-underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Order</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Customer</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Total</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm font-medium text-gray-900">#{order.id}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{order.full_name}</td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{formatPrice(order.total)}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {stats.recentOrders.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
