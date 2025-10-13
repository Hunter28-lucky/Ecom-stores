import { useState, useEffect } from 'react';
import { ShoppingCart, Star, Phone, Shield, TruckIcon, RotateCcw, Lock, BadgeCheck, Award, Users } from 'lucide-react';
import { useProducts, type Product } from '../hooks/useProducts';
import { ProductDetail } from './ProductDetail';
import { AdminDashboard } from './AdminDashboard';
import { AdminLogin } from './AdminLogin';
import { SplashScreen } from './SplashScreen';

export function ProductCatalog() {
  const { products, loading, error } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Check if user is visiting for the first time in this session
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (!hasSeenSplash) {
      setShowSplash(true);
      sessionStorage.setItem('hasSeenSplash', 'true');
    }
  }, []);

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

  // Show cinematic splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

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
            <div className="hidden sm:flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400 font-medium">{products.length} Products Available</span>
              </div>
              <button
                onClick={() => setShowContactModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden md:inline">Contact Help</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Trust Badges Section */}
      <div className="bg-gradient-to-r from-green-900/20 via-emerald-900/20 to-green-900/20 border-y border-green-500/20 py-6 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-center gap-3 bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/5">
              <Shield className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-white font-bold text-sm">100% Secure</p>
                <p className="text-gray-400 text-xs">Payment Protected</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/5">
              <TruckIcon className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-white font-bold text-sm">Free Shipping</p>
                <p className="text-gray-400 text-xs">All Over India</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/5">
              <RotateCcw className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-white font-bold text-sm">Easy Returns</p>
                <p className="text-gray-400 text-xs">7 Days Return</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/5">
              <BadgeCheck className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-white font-bold text-sm">Verified</p>
                <p className="text-gray-400 text-xs">Authentic Products</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-purple-900/30 border border-purple-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-purple-600 p-3 rounded-full">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">50,000+ Happy Customers</p>
              <p className="text-gray-400 text-sm">Join thousands of satisfied buyers across India</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-white font-bold ml-2">4.8/5</span>
            <span className="text-gray-400 text-sm">(2,847 reviews)</span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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

      {/* Customer Testimonials Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-2">What Our Customers Say</h2>
          <p className="text-gray-400">Real reviews from real customers</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Testimonial 1 */}
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-300 mb-4 italic">"Amazing product quality! Received it within 2 days. Highly recommended!"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">R</div>
              <div>
                <p className="text-white font-semibold">Rahul Sharma</p>
                <p className="text-gray-500 text-sm">Verified Buyer</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-300 mb-4 italic">"Best online shopping experience. Customer support was very helpful!"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">P</div>
              <div>
                <p className="text-white font-semibold">Priya Patel</p>
                <p className="text-gray-500 text-sm">Verified Buyer</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-300 mb-4 italic">"Genuine products at best prices. Will definitely buy again!"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">A</div>
              <div>
                <p className="text-white font-semibold">Amit Kumar</p>
                <p className="text-gray-500 text-sm">Verified Buyer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-black border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Footer Top */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 p-2 rounded-xl">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white">TechStore</h3>
              </div>
              <p className="text-gray-400 mb-4">Your trusted destination for premium electronics. We deliver authentic products with secure payment and fast shipping across India.</p>
              <div className="flex items-center gap-4">
                <Lock className="w-5 h-5 text-green-500" />
                <span className="text-gray-400 text-sm">256-bit SSL Encrypted</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Track Order</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Shipping Info</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h4 className="text-white font-bold mb-4">Policies</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Return Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="border-t border-white/10 pt-8 mb-8">
            <p className="text-gray-400 text-sm mb-4 text-center">We Accept</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                <span className="text-white font-semibold text-sm">UPI</span>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                <span className="text-white font-semibold text-sm">PhonePe</span>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                <span className="text-white font-semibold text-sm">Google Pay</span>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                <span className="text-white font-semibold text-sm">Paytm</span>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-white/10 pt-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-400 text-sm">Trusted by 50,000+ Customers</span>
            </div>
            <p className="text-gray-500 font-medium">
              © 2024 TechStore. All rights reserved. Premium Electronics for Everyone.
            </p>
            <p className="text-gray-600 text-xs mt-2">Made with ❤️ in India</p>
          </div>
        </div>
      </footer>

      {/* Smooth Transition Overlay - Black to White Fade */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-black via-gray-900 to-white animate-fadeToWhite pointer-events-none" />
      )}

      {/* Contact Help Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/10 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Contact Support</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-400 mb-6">Need help with your order? Contact us on these numbers:</p>
              
              {/* Phone Number 1 */}
              <a
                href="tel:+916204109028"
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-2 border-green-500/30 rounded-xl hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20 transform hover:scale-[1.02] transition-all group"
              >
                <div className="bg-green-600 p-3 rounded-full group-hover:bg-green-500 transition-colors">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">Support Line 1</p>
                  <p className="text-lg font-bold text-white">+91 6204109028</p>
                </div>
              </a>

              {/* Phone Number 2 */}
              <a
                href="tel:+918797903378"
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-2 border-blue-500/30 rounded-xl hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transform hover:scale-[1.02] transition-all group"
              >
                <div className="bg-blue-600 p-3 rounded-full group-hover:bg-blue-500 transition-colors">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">Support Line 2</p>
                  <p className="text-lg font-bold text-white">+91 8797903378</p>
                </div>
              </a>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-sm text-gray-500 text-center">Available 24/7 for support</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
