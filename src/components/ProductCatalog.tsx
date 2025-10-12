import { useState, useEffect } from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import { useProducts, type Product } from '../hooks/useProducts';
import { ProductDetail } from './ProductDetail';
import { AdminDashboard } from './AdminDashboard';
import { AdminLogin } from './AdminLogin';

export function ProductCatalog() {
  const { products, loading, error } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleProductClick = (product: Product) => {
    setIsTransitioning(true);
    // Smooth fade transition before showing product page
    setTimeout(() => {
      setSelectedProduct(product);
      setIsTransitioning(false);
    }, 300); // 300ms transition
  };

  // Check if user is authenticated from sessionStorage
  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Check URL for /admin path
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin' || path === '/admin/') {
      setShowAdmin(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
          </div>
          <p className="text-gray-400 text-lg font-medium">Loading amazing products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center bg-gradient-to-br from-zinc-900 to-black p-8 rounded-2xl border border-red-500/30 max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Handle admin access
  if (showAdmin) {
    if (!isAuthenticated) {
      return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
    }
    return (
      <AdminDashboard
        onBack={() => {
          setShowAdmin(false);
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  if (selectedProduct) {
    return <ProductDetail product={selectedProduct} onBack={() => setSelectedProduct(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header - Matte Black Theme */}
      <header className="bg-black/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center sm:justify-between">
            <div className="flex items-center space-x-4">
              {/* Real TechStore Logo from Internet */}
              <img 
                src="https://cdn-icons-png.flaticon.com/512/869/869636.png" 
                alt="TechStore Logo" 
                className="w-12 h-12 sm:w-14 sm:h-14"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight">
                  TechStore
                </h1>
                <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">Premium Electronics</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400 font-medium">{products.length} Products Available</span>
            </div>
          </div>
        </div>
      </header>

      {/* Products Grid - No Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative bg-gradient-to-br from-zinc-900 to-black rounded-3xl overflow-hidden cursor-pointer border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
              onClick={() => handleProductClick(product)}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative overflow-hidden aspect-square">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                  <span className="text-xs font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent uppercase tracking-wider">{product.category}</span>
                </div>
              </div>
              
              <div className="relative p-6">
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all">
                  {product.name}
                </h3>
                
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">
                    {product.rating} ({product.reviews})
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                      ₹{product.price}
                    </span>
                  </div>
                  <button className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/50 transform hover:scale-105 transition-all duration-300 flex items-center gap-2 group">
                    <ShoppingCart className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer - Matte Black */}
      <footer className="bg-black border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 p-2 rounded-xl">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white">TechStore</h3>
            </div>
            <p className="text-gray-500 font-medium">
              © 2024 TechStore. All rights reserved. Premium Electronics for Everyone.
            </p>
          </div>
        </div>
      </footer>

      {/* Smooth Transition Overlay - Black to White Fade */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-black via-gray-900 to-white animate-fadeToWhite pointer-events-none" />
      )}
    </div>
  );
}
