import { useEffect, useRef, useState } from 'react';
import {
  ShoppingCart,
  Star,
  Check,
  Lock,
  Shield,
  TrendingUp,
  Phone,
  User,
  Loader2,
  QrCode,
  ExternalLink,
  Copy,
  Timer,
  Sparkles,
  ArrowLeft,
  Mail,
  MapPin,
  Home,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  createPaymentOrder,
  fetchOrderStatus,
  generateOrderId,
  type CreateOrderResponse,
} from '../services/payment';
import type { Product } from '../hooks/useProducts';

const PAYMENT_WINDOW_SECONDS = 10 * 60; // 10 minutes

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

export function ProductDetail({ product, onBack }: ProductDetailProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentResult, setPaymentResult] = useState<CreateOrderResponse | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [upiPaymentString, setUpiPaymentString] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [orderStatusMessage, setOrderStatusMessage] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [paymentExpiresAt, setPaymentExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const customerFormRef = useRef<HTMLDivElement | null>(null);

  const totalPrice = product.price * quantity;
  const savings = Math.floor(product.price * 0.15);
  const hasPaymentSuccess = paymentResult?.status === 'success';

  // All the helper functions and useEffects from App.tsx
  const normalizeZapUpiPayload = (value: string) => {
    let current = value.trim();
    if (!current) return '';

    const matchesTargetProtocol = (input: string) => {
      const lower = input.toLowerCase();
      return (
        lower.startsWith('upi://') ||
        lower.startsWith('http://') ||
        lower.startsWith('https://') ||
        lower.startsWith('data:image')
      );
    };

    if (matchesTargetProtocol(current)) return current;

    for (let i = 0; i < 2; i += 1) {
      try {
        const decoded = decodeURIComponent(current);
        if (decoded === current) break;
        current = decoded.trim();
        if (matchesTargetProtocol(current)) return current;
      } catch {
        break;
      }
    }

    return current;
  };

  const scrollToCustomerForm = (behavior: ScrollBehavior = 'smooth') => {
    if (customerFormRef.current) {
      customerFormRef.current.scrollIntoView({ behavior, block: 'start' });
    }
  };

  useEffect(() => {
    if (showCheckout) {
      scrollToCustomerForm('auto');
    }
  }, [showCheckout]);

  useEffect(() => {
    if (!paymentExpiresAt || !hasPaymentSuccess) {
      setRemainingSeconds(0);
      setPaymentExpired(false);
      return;
    }

    const tick = () => {
      const secondsLeft = Math.max(0, Math.ceil((paymentExpiresAt - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        setPaymentExpired(true);
        setStatusMessage('Your payment link expired. Tap "Start a New Order" to generate a fresh QR code.');
      }
    };

    tick();
    const intervalId = window.setInterval(() => {
      tick();
      if (paymentExpiresAt - Date.now() <= 0) {
        window.clearInterval(intervalId);
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [paymentExpiresAt, hasPaymentSuccess]);

  useEffect(() => {
    let cancelled = false;

    const isLikelyBase64 = (value: string) => {
      try {
        return btoa(atob(value.replace(/^data:image\/\\w+;base64,/, '').trim()))
          .replace(/=+$/, '') === value.replace(/^data:image\/\\w+;base64,/, '').trim().replace(/=+$/, '');
      } catch {
        return false;
      }
    };

    const generateQr = async () => {
      if (!hasPaymentSuccess || !paymentResult) {
        setQrCodeDataUrl('');
        setUpiPaymentString('');
        return;
      }

      const rawData = paymentResult.payment_data?.trim() ?? '';
      const decodedUpi = rawData ? normalizeZapUpiPayload(rawData) : '';
      const paymentPageUrl = paymentResult.payment_url?.trim() ?? '';
      const candidates = [decodedUpi, rawData, paymentPageUrl].filter(Boolean) as string[];
      const primaryValue = candidates[0] ?? '';

      if (!cancelled) {
        setUpiPaymentString(decodedUpi.startsWith('upi://') ? decodedUpi : '');
      }

      if (isLikelyBase64(rawData) && rawData.startsWith('data:image')) {
        if (!cancelled) {
          setQrCodeDataUrl(rawData);
        }
        return;
      }

      if (!primaryValue) {
        if (!cancelled) {
          setQrCodeDataUrl('');
        }
        return;
      }

      try {
        const generated = await QRCode.toDataURL(primaryValue, {
          width: 512,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        if (!cancelled) {
          setQrCodeDataUrl(generated);
        }
      } catch (err) {
        console.error('QR generation error:', err);
        if (!cancelled) {
          setQrCodeDataUrl('');
        }
      }
    };

    generateQr();
    return () => {
      cancelled = true;
    };
  }, [paymentResult, hasPaymentSuccess]);

  const resetCheckoutForm = () => {
    setShowCheckout(false);
    setQuantity(1);
    setCustomerName('');
    setCustomerMobile('');
    setCustomerEmail('');
    setCustomerAddress('');
    setCustomerCity('');
    setCustomerState('');
    setCustomerPincode('');
    setPaymentResult(null);
    setCurrentOrderId('');
    setError('');
    setStatusMessage('');
    setQrCodeDataUrl('');
    setUpiPaymentString('');
    setOrderStatusMessage('');
    setPaymentExpiresAt(null);
    setRemainingSeconds(0);
    setPaymentExpired(false);
  };

  const handlePayment = async () => {
    if (!customerName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!customerMobile.trim() || customerMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!customerAddress.trim()) {
      setError('Please enter your delivery address');
      return;
    }
    if (!customerCity.trim()) {
      setError('Please enter your city');
      return;
    }
    if (!customerState.trim()) {
      setError('Please enter your state');
      return;
    }
    if (!customerPincode.trim() || customerPincode.length !== 6) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }

    setIsProcessing(true);
    setError('');
    setStatusMessage('Creating your secure payment link...');

    try {
      const orderId = generateOrderId();
      setCurrentOrderId(orderId);

      const result = await createPaymentOrder({
        orderId: orderId,
        amount: totalPrice,
        customerMobile: customerMobile.trim(),
      });

      if (result.status === 'success') {
        setPaymentResult(result);
        setStatusMessage('Payment link generated successfully! Scan the QR code to pay.');
        const expiry = Date.now() + PAYMENT_WINDOW_SECONDS * 1000;
        setPaymentExpiresAt(expiry);
      } else {
        setError(result.message || 'Failed to create payment order. Please try again.');
        setStatusMessage('');
      }
    } catch (err: unknown) {
      console.error('Payment error:', err);
      if (err instanceof Error) {
        setError(err.message || 'Something went wrong. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setStatusMessage('');
    } finally {
      setIsProcessing(false);
    }
  };

  const checkOrderStatus = async () => {
    if (!currentOrderId) {
      setOrderStatusMessage('No active order to check');
      return;
    }

    setIsCheckingStatus(true);
    setOrderStatusMessage('Checking payment status...');

    try {
      const status = await fetchOrderStatus(currentOrderId);
      
      if (status.status === 'success' && status.data) {
        if (status.data.status === 'SUCCESS' || status.data.status === 'COMPLETED') {
          setOrderStatusMessage('🎉 Payment Successful! Your order is confirmed.');
        } else if (status.data.status === 'PENDING' || status.data.status === 'CREATED') {
          setOrderStatusMessage('⏳ Payment pending. Please complete the payment.');
        } else if (status.data.status === 'FAILED') {
          setOrderStatusMessage('❌ Payment failed. Please try again.');
        } else {
          setOrderStatusMessage(`Status: ${status.data.status}`);
        }
      } else {
        setOrderStatusMessage(status.message || 'Could not fetch order status');
      }
    } catch (err: unknown) {
      console.error('Status check error:', err);
      if (err instanceof Error) {
        setOrderStatusMessage(err.message || 'Failed to check status');
      } else {
        setOrderStatusMessage('Failed to check status');
      }
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const openPaymentLink = (shouldOpenInPlace = false) => {
    if (upiPaymentString && upiPaymentString.startsWith('upi://')) {
      window.location.href = upiPaymentString;
      return;
    }

    const fallbackUrl = paymentResult?.payment_url?.trim();
    if (fallbackUrl) {
      if (shouldOpenInPlace) {
        window.location.href = fallbackUrl;
      } else {
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate mock reviews based on product rating
  const reviews = [
    {
      name: "Priya Sharma",
      rating: 5,
      comment: `Amazing ${product.name}! Highly recommend it.`,
      date: "2 days ago",
      verified: true
    },
    {
      name: "Rahul Kumar",
      rating: Math.floor(product.rating),
      comment: product.description,
      date: "1 week ago",
      verified: true
    },
    {
      name: "Anjali Patel",
      rating: Math.floor(product.rating),
      comment: "Great quality and value for money. Very satisfied!",
      date: "2 weeks ago",
      verified: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Back Button */}
      <div className="max-w-sm sm:max-w-md mx-auto pt-4 px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Products
        </button>
      </div>

      <div className="max-w-sm sm:max-w-md mx-auto pb-32 px-4">
        {/* Product Images */}
        <div className="mb-6">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-4">
            <img 
              src={product.image}
              alt={product.name}
              className="w-full aspect-square object-cover"
            />
            <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
              ₹{savings} OFF
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
              {product.category}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating} ({product.reviews})
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-bold text-gray-900">₹{product.price}</span>
            <span className="text-lg text-gray-400 line-through">₹{product.price + savings}</span>
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
              Save ₹{savings}
            </span>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            {product.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {!showCheckout && (
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Buy Now
            </button>
          )}
        </div>

        {/* Checkout Form */}
        {showCheckout && (
          <div ref={customerFormRef} className="bg-white rounded-2xl p-6 shadow-lg mb-4">
            {!hasPaymentSuccess ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Customer Details</h3>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter your full name"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      autoComplete="tel"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Home className="w-4 h-4 inline mr-1" />
                      Delivery Address *
                    </label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="House No, Building, Street, Area"
                      rows={2}
                      autoComplete="street-address"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        City *
                      </label>
                      <input
                        type="text"
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="City"
                        autoComplete="address-level2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        value={customerState}
                        onChange={(e) => setCustomerState(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="State"
                        autoComplete="address-level1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={customerPincode}
                      onChange={(e) => setCustomerPincode(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="6-digit pincode"
                      maxLength={6}
                      autoComplete="postal-code"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 bg-gray-100 rounded-xl font-bold text-xl hover:bg-gray-200"
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-12 h-12 bg-gray-100 rounded-xl font-bold text-xl hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                    {error}
                  </div>
                )}

                {statusMessage && !error && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl mb-4">
                    {statusMessage}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Scan to Pay</h3>
                  <p className="text-gray-600 mb-4">Use any UPI app to complete payment</p>
                </div>

                {qrCodeDataUrl && (
                  <div className="bg-white p-4 rounded-xl border-2 border-indigo-200">
                    <img src={qrCodeDataUrl} alt="Payment QR Code" className="w-full max-w-xs mx-auto" />
                  </div>
                )}

                {!paymentExpired && remainingSeconds > 0 && (
                  <div className="flex items-center justify-center gap-2 text-orange-600 font-semibold">
                    <Timer className="w-5 h-5" />
                    Time remaining: {formatTime(remainingSeconds)}
                  </div>
                )}

                {paymentExpired && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    ⏰ Payment link expired. Please start a new order.
                  </div>
                )}

                <button
                  onClick={() => checkOrderStatus()}
                  disabled={isCheckingStatus}
                  className="w-full border-2 border-indigo-600 text-indigo-600 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                >
                  {isCheckingStatus ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Check Payment Status
                    </>
                  )}
                </button>

                {orderStatusMessage && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl">
                    {orderStatusMessage}
                  </div>
                )}

                {currentOrderId && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Order ID:</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                        {currentOrderId}
                      </code>
                      <button
                        onClick={() => copyToClipboard(currentOrderId)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center shadow">
            <Shield className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">Secure Payment</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow">
            <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">Best Price</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow">
            <Sparkles className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">Top Quality</p>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Customer Reviews</h3>
          
          <div className="space-y-4 mb-4">
            {reviews.map((review, index) => (
              <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{review.name}</span>
                  {review.verified && (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <Check className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
          <div className="max-w-sm sm:max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 font-medium">Total to Pay</span>
              <span className="text-2xl font-bold text-gray-900">₹{totalPrice}</span>
            </div>
            {hasPaymentSuccess ? (
              <div className="space-y-3">
                <button
                  onClick={() => openPaymentLink(true)}
                  disabled={!upiPaymentString && !paymentResult?.payment_url}
                  className={`w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform transition-all flex items-center justify-center gap-2 ${
                    upiPaymentString || paymentResult?.payment_url ? 'hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <ExternalLink className="w-5 h-5" />
                  Pay Now
                </button>
                <button
                  onClick={resetCheckoutForm}
                  className="w-full border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-200 active:scale-95"
                >
                  Start a New Order
                </button>
              </div>
            ) : (
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 ${
                  isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Proceed to Payment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
