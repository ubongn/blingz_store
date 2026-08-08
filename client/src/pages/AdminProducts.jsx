import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';
import { TableRowSkeleton } from '../components/Skeleton';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', image_url: '', category: 'Hair', stock: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const CATEGORIES = ['Hair', 'Honey', 'Plantain Chips', 'Oils & Care'];

  useEffect(() => {
    if (!isLoggedIn || !user?.is_admin) {
      navigate('/');
      return;
    }
    loadProducts();
  }, [isLoggedIn, user, navigate]);

  async function loadProducts() {
    const data = await apiFetch('/api/admin/products');
    if (Array.isArray(data)) {
      setProducts(data);
    }
    setLoading(false);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function openCreate() {
    setEditingProduct(null);
    setForm({ name: '', description: '', price: '', image_url: '', category: 'Hair', stock: '' });
    setImageFile(null);
    setImagePreview('');
    setShowForm(true);
  }

  function openEdit(product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image_url: product.image_url || '',
      category: product.category || 'Hair',
      stock: product.stock.toString(),
    });
    setImageFile(null);
    setImagePreview(product.image_url || '');
    setShowForm(true);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setUploading(true);

    let imageUrl = form.image_url;
    if (imageFile) {
      const fd = new FormData();
      fd.append('image', imageFile);
      const uploadRes = await fetch('http://localhost:5000/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.error) {
        toast.error(uploadData.error);
        setUploading(false);
        return;
      }
      imageUrl = uploadData.url;
    }

    const body = {
      ...form,
      image_url: imageUrl,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
    };

    let res;
    if (editingProduct) {
      res = await apiFetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    } else {
      res = await apiFetch('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    }

    setUploading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(editingProduct ? 'Product updated' : 'Product created');
      setShowForm(false);
      loadProducts();
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return;
    const res = await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Product deleted');
      loadProducts();
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <tbody>
              {[1, 2, 3, 4, 5].map(i => <TableRowSkeleton key={i} cols={6} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Products</h2>
        <button
          onClick={openCreate}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 cursor-pointer border-none"
        >
          + New Product
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">{editingProduct ? 'Edit Product' : 'Create Product'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-gray-900 file:text-white file:text-sm file:cursor-pointer"
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded-lg border border-gray-200" />
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 cursor-pointer border-none"
              >
                {uploading ? 'Uploading...' : editingProduct ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer border-none"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No products yet</p>
          <button
            onClick={openCreate}
            className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 cursor-pointer border-none"
          >
            Add your first product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Product</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Price</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Stock</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded-lg" />
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{product.category}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">₦{product.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`font-medium ${product.stock <= 0 ? 'text-red-600' : product.stock <= 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => openEdit(product)}
                        className="text-gray-900 hover:underline bg-transparent border-none cursor-pointer mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
