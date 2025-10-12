import { useState, useEffect } from 'react';
import { productsApi, categoriesApi, storageApi } from '../services/cms';
import type { Product, Category } from '../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, Upload } from 'lucide-react';

export function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load data. Please check your Supabase configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    try {
      if (editingProduct.id) {
        // Update existing product
        await productsApi.update(editingProduct.id, editingProduct);
      } else {
        // Create new product
        await productsApi.create(editingProduct);
      }
      await loadData();
      setEditingProduct(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsApi.delete(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const url = await storageApi.uploadImage(file);
      setEditingProduct(prev => ({
        ...prev,
        images: [...(prev?.images || []), url],
      }));
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const startCreate = () => {
    setEditingProduct({
      name: '',
      slug: '',
      description: '',
      price: 0,
      original_price: 0,
      rating: 0,
      review_count: 0,
      stock_status: 'in_stock',
      featured: false,
      active: true,
      images: [],
      features: [],
    });
    setIsCreating(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CMS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-1">Add, edit, and manage your products</p>
          </div>
          <button
            onClick={startCreate}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>

        {/* Edit/Create Form */}
        {(editingProduct || isCreating) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingProduct?.id ? 'Edit Product' : 'Create New Product'}
              </h2>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsCreating(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={editingProduct?.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    setEditingProduct(prev => ({ ...prev, name, slug }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Premium Wireless Headphones"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={editingProduct?.slug || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="premium-wireless-headphones"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  value={editingProduct?.price || 0}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="199"
                />
              </div>

              {/* Original Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Price (₹)
                </label>
                <input
                  type="number"
                  value={editingProduct?.original_price || 0}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, original_price: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="299"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={editingProduct?.category_id || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Stock Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Status
                </label>
                <select
                  value={editingProduct?.stock_status || 'in_stock'}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, stock_status: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="pre_order">Pre Order</option>
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editingProduct?.description || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Detailed product description..."
                />
              </div>

              {/* Features */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features (one per line)
                </label>
                <textarea
                  value={(editingProduct?.features || []).join('\n')}
                  onChange={(e) => setEditingProduct(prev => ({ 
                    ...prev, 
                    features: e.target.value.split('\n').filter(f => f.trim()) 
                  }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Active Noise Cancellation&#10;40-Hour Battery Life&#10;Premium Sound Quality"
                />
              </div>

              {/* Images */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </label>
                <div className="flex flex-wrap gap-4 mb-4">
                  {(editingProduct?.images || []).map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt="" className="w-24 h-24 object-cover rounded-lg" />
                      <button
                        onClick={() => setEditingProduct(prev => ({
                          ...prev,
                          images: prev?.images?.filter((_, i) => i !== idx),
                        }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition">
                  <Upload size={20} />
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct?.featured || false}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, featured: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured Product</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct?.active !== false}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Active/Published</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-4 mt-6 pt-6 border-t">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                <Save size={20} />
                Save Product
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsCreating(false);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Products List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover mr-4"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{product.price}</div>
                      {product.original_price && (
                        <div className="text-sm text-gray-500 line-through">₹{product.original_price}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.stock_status === 'in_stock' ? 'bg-green-100 text-green-800' :
                        product.stock_status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.stock_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {product.featured && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                            Featured
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-indigo-600 hover:text-indigo-900 p-2"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900 p-2"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products yet. Click "Add Product" to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
