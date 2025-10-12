import { useEffect, useRef, useState } from 'react';
import {
  ShoppingCart,
  Star,
  Play,
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
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  createPaymentOrder,
  fetchOrderStatus,
  generateOrderId,
  type CreateOrderResponse,
} from './services/payment';

const PAYMENT_WINDOW_SECONDS = 10 * 60; // 10 minutes to complete payment

function App() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
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

  const product = {
    name: "Premium Wireless Headphones",
    price: 199,
    originalPrice: 299,
    rating: 4.8,
    reviews: 2847,
    image: "https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg?auto=compress&cs=tinysrgb&w=800",
    images: [
      "https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/8000544/pexels-photo-8000544.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=800"
    ],
    videoThumb: "https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=800",
    features: [
      "Active Noise Cancellation",
      "40-Hour Battery Life",
      "Premium Sound Quality",
      "Wireless & Bluetooth 5.0"
    ]
  };

  const reviews = [
    {
      name: "Priya Sharma",
      rating: 5,
      comment: "Best headphones I've ever owned. The sound quality is absolutely incredible! Perfect for work from home.",
      date: "2 days ago",
      verified: true
    },
    {
      name: "Rahul Kumar",
      rating: 5,
      comment: "Worth every penny. The noise cancellation is a game-changer for travel. Delivered within 2 days!",
      date: "1 week ago",
      verified: true
    },
    {
      name: "Anjali Patel",
      rating: 4,
      comment: "Great quality and comfortable for long listening sessions. Battery life is amazing.",
      date: "2 weeks ago",
      verified: true
    }
  ];

  const hasPaymentSuccess = paymentResult?.status === 'success';

  const scrollToCustomerForm = (behavior: ScrollBehavior = 'smooth') => {
    if (customerFormRef.current) {
      customerFormRef.current.scrollIntoView({ behavior, block: 'start' });
    }
  };

  const normalizeZapUpiPayload = (value: string) => {
    let current = value.trim();
    if (!current) {
      return '';
    }

    const matchesTargetProtocol = (input: string) => {
      const lower = input.toLowerCase();
      return (
        lower.startsWith('upi://') ||
        lower.startsWith('http://') ||
        lower.startsWith('https://') ||
        lower.startsWith('data:image')
      );
    };

    if (matchesTargetProtocol(current)) {
      return current;
    }

    for (let i = 0; i < 2; i += 1) {
      try {
        const decoded = decodeURIComponent(current);
        if (decoded === current) {
          break;
        }
        current = decoded.trim();
        if (matchesTargetProtocol(current)) {
          return current;
        }
      } catch {
        break;
      }
    }

    return current;
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
        setStatusMessage('Your payment link expired. Tap “Start a New Order” to generate a fresh QR code.');
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
        return btoa(atob(value.replace(/^data:image\/\w+;base64,/, '').trim()))
          .replace(/=+$/, '') === value.replace(/^data:image\/\w+;base64,/, '').trim().replace(/=+$/, '');
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

      if (!primaryValue) {
        setQrCodeDataUrl('');
        return;
      }

      if (primaryValue.startsWith('data:image/')) {
        setQrCodeDataUrl(primaryValue);
        return;
      }

      if (isLikelyBase64(primaryValue)) {
        setQrCodeDataUrl(primaryValue.startsWith('data:image') ? primaryValue : `data:image/png;base64,${primaryValue}`);
        return;
      }

      const contentForQr = decodedUpi || paymentPageUrl;

      if (!contentForQr) {
        setQrCodeDataUrl('');
        return;
      }

      try {
        const dataUrl = await QRCode.toDataURL(contentForQr, { width: 320 });
        if (!cancelled) {
          setQrCodeDataUrl(dataUrl);
        }
      } catch (err) {
        console.error('QR code generation failed', err);
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

  const totalPrice = product.price * quantity;
  const savings = (product.originalPrice - product.price) * quantity;
  const countdownLabel = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;
  const isUrgent = remainingSeconds > 0 && remainingSeconds <= 60;
  const progressPercent = paymentExpiresAt ? Math.max(0, Math.min(100, (remainingSeconds / PAYMENT_WINDOW_SECONDS) * 100)) : 0;

  const validateMobileNumber = (mobile: string): boolean => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const handlePayment = async () => {
    setError('');
    setStatusMessage('');
    setOrderStatusMessage('');
    setPaymentExpired(false);
    setPaymentExpiresAt(null);
    setRemainingSeconds(0);
    setUpiPaymentString('');

    if (!customerName.trim()) {
      setError('Please enter your name');
      scrollToCustomerForm();
      return;
    }

    if (!validateMobileNumber(customerMobile)) {
      setError('Please enter a valid 10-digit mobile number');
      scrollToCustomerForm();
      return;
    }

    setIsProcessing(true);
    setPaymentResult(null);
    setStatusMessage('Creating your secure payment link...');

    try {
      const orderId = generateOrderId();
      setCurrentOrderId(orderId);
      const redirectUrl = window.location.origin + '/payment-success';

      const response = await createPaymentOrder({
        amount: totalPrice,
        orderId,
        customerMobile,
        redirectUrl,
        remark: `${product.name} x ${quantity} - ${customerName}`,
      });

      if (response.status === 'success') {
        setPaymentResult(response);
        const expiryTimestamp = Date.now() + PAYMENT_WINDOW_SECONDS * 1000;
        setPaymentExpiresAt(expiryTimestamp);
        setRemainingSeconds(PAYMENT_WINDOW_SECONDS);
        setPaymentExpired(false);
        setStatusMessage(`Scan this QR with any UPI app and pay ₹${totalPrice.toLocaleString()} to finish your order.`);
      } else {
        setError(response.message || 'Payment failed. Please try again.');
        setPaymentExpiresAt(null);
        setRemainingSeconds(0);
      }
    } catch (err) {
      console.error('Payment failed', err);
      setError('Something went wrong. Please try again.');
      setPaymentExpiresAt(null);
      setRemainingSeconds(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const startCheckout = () => {
    setPaymentResult(null);
    setStatusMessage('Fill in your details to get your secure payment link instantly and reserve today’s savings.');
    setError('');
    setCurrentOrderId('');
    setOrderStatusMessage('');
    setQrCodeDataUrl('');
    setUpiPaymentString('');
    setPaymentExpiresAt(null);
    setRemainingSeconds(0);
    setPaymentExpired(false);
    setShowCheckout(true);
    setTimeout(() => scrollToCustomerForm(), 200);
  };

  const exitCheckout = () => {
    setShowCheckout(false);
    setPaymentResult(null);
    setStatusMessage('');
    setError('');
    setCurrentOrderId('');
    setOrderStatusMessage('');
    setQrCodeDataUrl('');
    setUpiPaymentString('');
    setPaymentExpiresAt(null);
    setRemainingSeconds(0);
    setPaymentExpired(false);
  };

  const handleCheckStatus = async () => {
    if (!currentOrderId) {
      setOrderStatusMessage('No order in progress yet.');
      return;
    }

    setIsCheckingStatus(true);
    setOrderStatusMessage('');

    try {
      const status = await fetchOrderStatus(currentOrderId);

      if (status.status === 'success' && status.data) {
        setOrderStatusMessage(
          `Status: ${status.data.status} • Amount: ₹${status.data.amount} • Ref: ${status.data.txn_id || 'N/A'}`
        );
      } else {
        setOrderStatusMessage(status.message || 'Order status not available yet.');
      }
    } catch (err) {
      console.error('Status check failed', err);
      setOrderStatusMessage('Failed to check order status. Please try again in a moment.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const openPaymentLink = (preferUpi = true) => {
    if (paymentExpired) {
      setOrderStatusMessage('This payment link has expired. Start a new order to generate a fresh QR code.');
      return;
    }

    const targetLink = preferUpi && upiPaymentString ? upiPaymentString : paymentResult?.payment_url || upiPaymentString;

    if (targetLink) {
      const isUpiIntent = targetLink.startsWith('upi://');
      if (isUpiIntent) {
        const isLikelyMobile = /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
        if (!isLikelyMobile) {
          setOrderStatusMessage('Scan the QR code with any UPI app or copy the link below. This shortcut only works on your phone.');
          return;
        }
      }

      window.open(targetLink, '_blank', 'noopener,noreferrer');
      if (isUpiIntent) {
        setOrderStatusMessage('Opening your UPI app... If nothing happens, scan the QR code or copy the link below.');
      } else {
        setOrderStatusMessage('Payment page opened in a new tab.');
      }
    } else {
      setOrderStatusMessage('Payment link is unavailable. Start a new order to regenerate it.');
    }
  };

  const copyOrderId = async () => {
    if (!currentOrderId) {
      setOrderStatusMessage('Nothing to copy yet.');
      return;
    }

    try {
      await navigator.clipboard.writeText(currentOrderId);
      setOrderStatusMessage('Order ID copied to clipboard.');
    } catch (err) {
      console.error('Failed to copy order id', err);
      setOrderStatusMessage('Unable to copy order ID. Please copy it manually.');
    }
  };

  const copyUpiLink = async () => {
    if (!upiPaymentString) {
      setOrderStatusMessage('UPI link is not ready yet. Generate a new order to try again.');
      return;
    }

    try {
      await navigator.clipboard.writeText(upiPaymentString);
      setOrderStatusMessage('UPI payment link copied. Paste it into your preferred UPI app.');
    } catch (err) {
      console.error('Failed to copy UPI link', err);
      setOrderStatusMessage('Unable to copy the UPI link. Please copy it manually from the text below.');
    }
  };

  const resetCheckoutForm = () => {
    setPaymentResult(null);
    setStatusMessage('Fill in your details to get your secure payment link instantly and reserve today’s savings.');
    setOrderStatusMessage('');
    setCustomerName('');
    setCustomerMobile('');
    setQuantity(1);
    setCurrentOrderId('');
    setQrCodeDataUrl('');
    setUpiPaymentString('');
    setTimeout(() => scrollToCustomerForm(), 150);
    setPaymentExpiresAt(null);
    setRemainingSeconds(0);
    setPaymentExpired(false);
  };

  if (!showCheckout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
  <div className="max-w-sm sm:max-w-md mx-auto px-4 py-6 pb-24">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-80 object-cover"
              />
              <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                Save ₹{savings}
              </div>
              <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                In Stock
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.reviews.toLocaleString()} reviews)
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ₹{product.price}
                </span>
                <span className="text-xl text-gray-400 line-through">
                  ₹{product.originalPrice}
                </span>
                <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </span>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 mb-6 border border-blue-200">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                  <Shield className="w-5 h-5 text-blue-600" />
                  100% Secure Payment | COD Available
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-semibold text-orange-600">
                    147 people bought this in the last 24 hours
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600">
                    Free delivery across India | Easy 7-day returns
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
            <div className="max-w-sm sm:max-w-md mx-auto">
              <button
                onClick={startCheckout}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-6 h-6" />
                Buy Now - ₹{product.price}
              </button>
              <p className="text-center text-xs text-gray-500 mt-2">
                Safe & Secure Payment | All India Delivery
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-44 sm:pb-32">
  <div className="max-w-sm sm:max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={exitCheckout}
            className="text-gray-600 font-medium"
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
          <div className="w-12"></div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
            {error}
          </div>
        )}

        {statusMessage && !error && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl mb-6 flex items-start gap-3">
            <Sparkles className="w-4 h-4 mt-0.5" />
            <span className="text-sm leading-relaxed">{statusMessage}</span>
          </div>
        )}

        {hasPaymentSuccess && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 transition-transform duration-300 ease-out">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Payment Ready</h3>
                <p className="text-xs text-gray-500">
                  Order ID: <span className="font-medium text-gray-700">{currentOrderId}</span>
                </p>
              </div>
            </div>

            <div
              className={`rounded-2xl border px-4 py-3 mb-3 flex items-center justify-between text-sm font-semibold transition-all duration-300 ${
                paymentExpired
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : isUrgent
                  ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                {paymentExpired ? 'Payment link expired' : 'Link expires in'}
              </span>
              <span className="font-mono text-lg tracking-widest">
                {paymentExpired ? '--:--' : countdownLabel}
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full transition-all duration-700 ease-out ${paymentExpired ? 'bg-red-300' : 'bg-emerald-400'}`}
                style={{ width: paymentExpired ? '0%' : `${progressPercent}%` }}
              ></div>
            </div>

            <p className="text-sm text-gray-600 mb-4 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span>
                {paymentExpired
                  ? 'This payment window has closed. Tap “Start a New Order” below to generate a fresh QR code and keep your price locked in.'
                  : `Complete the payment within ${countdownLabel} to lock in your ₹${savings.toLocaleString()} savings, free delivery, and priority dispatch.`}
              </span>
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center mb-4">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="UPI QR Code"
                  className={`w-48 h-48 sm:w-56 sm:h-56 max-w-full object-contain drop-shadow-md transition-transform duration-500 ${
                    paymentExpired ? 'opacity-60' : 'animate-[pulse_2.5s_ease-in-out_infinite]'
                  }`}
                />
              ) : (
                <div className="text-center text-gray-500 text-sm py-12">
                  We're preparing your QR code...
                </div>
              )}
            </div>

            <div className="text-center mb-4">
              <p className="text-sm text-gray-700 font-medium">
                Scan this QR with any UPI app and pay{' '}
                <span className="text-lg font-bold text-gray-900">₹{totalPrice.toLocaleString()}</span>
                .
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Prefer your phone? Tap “Pay with UPI App” below or copy the link if you need to share it.
              </p>
            </div>

            {upiPaymentString && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 mb-4 text-xs text-gray-600 break-all">
                <p className="font-semibold text-gray-800 mb-1">UPI deep link</p>
                <p className="leading-relaxed">{upiPaymentString}</p>
              </div>
            )}

            <div className="grid gap-3">
              {upiPaymentString && (
                <button
                  onClick={() => openPaymentLink(true)}
                  disabled={paymentExpired}
                  className={`w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 active:scale-95 ${
                    paymentExpired ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  Pay with UPI App
                </button>
              )}
              {paymentResult?.payment_url && (
                <button
                  onClick={() => openPaymentLink(false)}
                  disabled={paymentExpired}
                  className={`w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 active:scale-95 ${
                    paymentExpired ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  View Payment Page
                </button>
              )}
              {upiPaymentString && (
                <button
                  onClick={copyUpiLink}
                  className="w-full border border-emerald-200 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-emerald-600 hover:bg-emerald-50 transition-all duration-200 active:scale-95"
                >
                  <Copy className="w-4 h-4" />
                  Copy UPI Link
                </button>
              )}
              <button
                onClick={copyOrderId}
                className="w-full border border-gray-200 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 transition-all duration-200 active:scale-95"
              >
                <Copy className="w-4 h-4" />
                Copy Order ID
              </button>
              <button
                onClick={handleCheckStatus}
                disabled={isCheckingStatus}
                className={`w-full border border-emerald-200 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${
                  isCheckingStatus ? 'bg-emerald-50 text-emerald-400 cursor-not-allowed' : 'text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {isCheckingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking status...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Check Payment Status
                  </>
                )}
              </button>
            </div>
            {orderStatusMessage && (
              <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                {orderStatusMessage}
              </p>
            )}
          </div>
        )}

        <div ref={customerFormRef} className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            Customer Details
          </h3>

          {hasPaymentSuccess && (
            <p className="text-sm text-green-600 mb-4">
              We've sent the payment link and QR code to {customerMobile}. You can still keep a copy of your details below.
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                disabled={hasPaymentSuccess}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-base ${
                  hasPaymentSuccess ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  disabled={hasPaymentSuccess}
                  className={`w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-base ${
                    hasPaymentSuccess ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Payment link will be sent to this number
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Lock className="w-4 h-4 text-green-600" />
              <span className="font-medium">100% Secure Payment Gateway</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="font-medium">UPI, Cards, NetBanking & More</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-600" />
              <span className="font-medium">7-Day Easy Returns & Refunds</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>

          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-24 h-24 object-cover rounded-xl"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-bold text-gray-900">₹{product.price}</span>
                  <span className="line-through ml-2 text-gray-400">₹{product.originalPrice}</span>
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={hasPaymentSuccess}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors ${
                      hasPaymentSuccess ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    -
                  </button>
                  <span className="font-semibold min-w-[20px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={hasPaymentSuccess}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors ${
                      hasPaymentSuccess ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {product.images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Product ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
            ))}
          </div>

          <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-6">
            <img
              src={product.videoThumb}
              alt="Product video"
              className="w-full h-48 object-cover opacity-75"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                <Play className="w-8 h-8 text-gray-900 ml-1" />
              </div>
            </div>
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white text-sm font-medium">Product Demo</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span className="font-semibold">₹{totalPrice}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>You Save</span>
              <span className="font-semibold">-₹{savings}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Delivery Charges</span>
              <span className="font-semibold text-green-600">FREE</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span className="text-green-600">₹{totalPrice}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            Customer Reviews
          </h3>

          <div className="space-y-4">
            {reviews.map((review, index) => (
              <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                      {review.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                      <p className="text-xs text-gray-500">{review.date}</p>
                    </div>
                  </div>
                  {review.verified && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
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

          <button className="w-full mt-4 text-green-600 font-semibold py-2 text-sm">
            Read all {product.reviews.toLocaleString()} reviews →
          </button>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 mb-6 border border-orange-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Limited Time Offer!</p>
              <p className="text-sm text-gray-700">
                Get extra ₹{savings} off + Free delivery. Hurry, only few units left!
              </p>
            </div>
          </div>
        </div>

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
            <p className="text-center text-xs text-gray-500 mt-3">
              By proceeding, you agree to our Terms & Conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
