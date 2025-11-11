import { useEffect, useRef, useState } from 'react';
import {
  Star,
  Check,
  Lock,
  Shield,
  TrendingUp,
  Phone,
  User,
  Loader2,
  QrCode,
  Copy,
  Timer,
  Sparkles,
  ArrowLeft,
  Mail,
  MapPin,
  Home,
  Share2,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  createPaymentOrder,
  fetchOrderStatus,
  generateOrderId,
  type CreateOrderResponse,
} from '../services/payment';
import { sendToGoogleSheets, sendOrderConfirmationEmail, formatTimestamp } from '../services/googleSheets';
import type { Product } from '../hooks/useProducts';
import { getProductUrl, shareProduct } from '../utils/routing';
import { setProductSEO } from '../utils/seo';
import {
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackAddPaymentInfo,
  trackPurchase,
  trackShare,
} from '../utils/facebookPixel';

const PAYMENT_WINDOW_SECONDS = 10 * 60; // 10 minutes

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

export function ProductDetail({ product, onBack }: ProductDetailProps) {
  const [showCheckout, setShowCheckout] = useState(true); // Auto-open checkout form
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0); // For image gallery
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
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [codOrderConfirmed, setCodOrderConfirmed] = useState(false);
  const customerFormRef = useRef<HTMLDivElement | null>(null);
  
  // Field error tracking
  const [fieldErrors, setFieldErrors] = useState({
    name: false,
    mobile: false,
    email: false,
    address: false,
    city: false,
    state: false,
    pincode: false
  });

  const totalPrice = product.price * quantity;
  const savings = 500; // Diwali discount
  const hasPaymentSuccess = paymentResult?.status === 'success';
  
  // Diwali Sale Countdown Timer (12 minutes)
  const [timeLeft, setTimeLeft] = useState(12 * 60); // 12 minutes in seconds

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

  // Update SEO when product loads
  useEffect(() => {
    const productUrl = getProductUrl(product);
    setProductSEO(product, productUrl);
    
    // Track product view for Facebook Pixel
    trackViewContent({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
    });
  }, [product]);

  // No auto-scroll on page load - let user see images first
  // Scroll happens when user clicks "Proceed to Payment"

  // Auto-swap images carousel for mobile
  useEffect(() => {
    if (!product.images || product.images.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % product.images!.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [product.images]);

  // Countdown Timer for Diwali Sale (12 minutes)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
    setPaymentMethod('online');
    setCodOrderConfirmed(false);
    setFieldErrors({
      name: false,
      mobile: false,
      email: false,
      address: false,
      city: false,
      state: false,
      pincode: false
    });
  };

  const handleCODOrder = async () => {
    // Scroll to form first to show user the fields
    scrollToCustomerForm('smooth');
    
    // Reset field errors
    const errors = {
      name: false,
      mobile: false,
      email: false,
      address: false,
      city: false,
      state: false,
      pincode: false
    };
    
    // Validate all required fields and mark errors
    if (!customerName.trim()) {
      errors.name = true;
      setError('❌ Please enter your full name');
      setFieldErrors(errors);
      return;
    }
    if (!customerMobile.trim()) {
      errors.mobile = true;
      setError('❌ Please enter your mobile number');
      setFieldErrors(errors);
      return;
    }
    if (customerMobile.trim().length !== 10) {
      errors.mobile = true;
      setError('❌ Mobile number must be exactly 10 digits');
      setFieldErrors(errors);
      return;
    }
    if (!customerEmail.trim()) {
      errors.email = true;
      setError('❌ Please enter your email address');
      setFieldErrors(errors);
      return;
    }
    if (!customerEmail.includes('@')) {
      errors.email = true;
      setError('❌ Please enter a valid email address');
      setFieldErrors(errors);
      return;
    }
    if (!customerAddress.trim()) {
      errors.address = true;
      setError('❌ Please enter your delivery address');
      setFieldErrors(errors);
      return;
    }
    if (!customerCity.trim()) {
      errors.city = true;
      setError('❌ Please enter your city');
      setFieldErrors(errors);
      return;
    }
    if (!customerState.trim()) {
      errors.state = true;
      setError('❌ Please enter your state');
      setFieldErrors(errors);
      return;
    }
    if (!customerPincode.trim()) {
      errors.pincode = true;
      setError('❌ Please enter your pincode');
      setFieldErrors(errors);
      return;
    }
    if (customerPincode.trim().length !== 6) {
      errors.pincode = true;
      setError('❌ Pincode must be exactly 6 digits');
      setFieldErrors(errors);
      return;
    }

    // All validations passed - clear all errors
    setFieldErrors(errors);
    setIsProcessing(true);
    setError('');
    setStatusMessage('Processing your COD order...');

    // Track checkout initiation for COD
    trackInitiateCheckout({
      productId: product.id,
      productName: product.name,
      value: totalPrice,
      quantity,
    });

    try {
      const orderId = generateOrderId();
      setCurrentOrderId(orderId);

      // Track payment method selection (COD)
      trackAddPaymentInfo({
        productId: product.id,
        productName: product.name,
        value: totalPrice,
        paymentMethod: 'cod',
      });

      const orderData = {
        orderId: orderId,
        name: customerName.trim(),
        mobile: customerMobile.trim(),
        email: customerEmail.trim(),
        address: customerAddress.trim(),
        city: customerCity.trim(),
        state: customerState.trim(),
        pincode: customerPincode.trim(),
        product: product.name,
        price: `₹${totalPrice}`,
        timestamp: formatTimestamp(),
        paymentMethod: 'COD',
      };

      // Send order data to Google Sheets and email in parallel (don't wait for response)
      // This provides instant feedback to user while backend processes in background
      Promise.all([
        sendToGoogleSheets(orderData),
        sendOrderConfirmationEmail(orderData)
      ]).then(([sheetResult, emailResult]) => {
        console.log('✅ Order submitted to Google Sheets:', sheetResult.message);
        console.log('✅ Confirmation email queued:', emailResult.message);
      }).catch(error => {
        console.error('Background order processing error:', error);
        // Don't show error to user - order is already confirmed on their end
      });

      // Track successful COD purchase immediately
      trackPurchase({
        orderId,
        productId: product.id,
        productName: product.name,
        value: totalPrice,
        quantity,
        paymentMethod: 'cod',
      });

      // Show success immediately (optimistic UI)
      setCodOrderConfirmed(true);
      setStatusMessage('✅ Order Confirmed! Your product will arrive in 5-7 working days. A confirmation email will be sent shortly to your email address.');
      setError('');
    } catch (err: unknown) {
      console.error('COD order error:', err);
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

  const handlePayment = async () => {
    // Scroll to form first to show user the fields
    scrollToCustomerForm('smooth');
    
    // Reset field errors
    const errors = {
      name: false,
      mobile: false,
      email: false,
      address: false,
      city: false,
      state: false,
      pincode: false
    };
    
    // Validate all required fields and mark errors
    if (!customerName.trim()) {
      errors.name = true;
      setError('❌ Please enter your full name');
      setFieldErrors(errors);
      return;
    }
    if (!customerMobile.trim()) {
      errors.mobile = true;
      setError('❌ Please enter your mobile number');
      setFieldErrors(errors);
      return;
    }
    if (customerMobile.trim().length !== 10) {
      errors.mobile = true;
      setError('❌ Mobile number must be exactly 10 digits');
      setFieldErrors(errors);
      return;
    }
    if (!customerEmail.trim()) {
      errors.email = true;
      setError('❌ Please enter your email address');
      setFieldErrors(errors);
      return;
    }
    if (!customerEmail.includes('@')) {
      errors.email = true;
      setError('❌ Please enter a valid email address');
      setFieldErrors(errors);
      return;
    }
    if (!customerAddress.trim()) {
      errors.address = true;
      setError('❌ Please enter your delivery address');
      setFieldErrors(errors);
      return;
    }
    if (!customerCity.trim()) {
      errors.city = true;
      setError('❌ Please enter your city');
      setFieldErrors(errors);
      return;
    }
    if (!customerState.trim()) {
      errors.state = true;
      setError('❌ Please enter your state');
      setFieldErrors(errors);
      return;
    }
    if (!customerPincode.trim()) {
      errors.pincode = true;
      setError('❌ Please enter your pincode');
      setFieldErrors(errors);
      return;
    }
    if (customerPincode.trim().length !== 6) {
      errors.pincode = true;
      setError('❌ Pincode must be exactly 6 digits');
      setFieldErrors(errors);
      return;
    }

    // All validations passed - clear all errors
    setFieldErrors(errors);
    setIsProcessing(true);
    setError('');
    setStatusMessage('Creating your secure payment link...');

    // Track checkout initiation
    trackInitiateCheckout({
      productId: product.id,
      productName: product.name,
      value: totalPrice,
      quantity,
    });

    try {
      const orderId = generateOrderId();
      setCurrentOrderId(orderId);

      // Track payment method selection
      trackAddPaymentInfo({
        productId: product.id,
        productName: product.name,
        value: totalPrice,
        paymentMethod: 'online',
      });

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

        // Send order data to Google Sheets
        try {
          await sendToGoogleSheets({
            orderId: orderId,
            name: customerName.trim(),
            mobile: customerMobile.trim(),
            email: customerEmail.trim(),
            address: customerAddress.trim(),
            city: customerCity.trim(),
            state: customerState.trim(),
            pincode: customerPincode.trim(),
            product: product.name,
            price: `₹${totalPrice}`,
            timestamp: formatTimestamp(),
            paymentMethod: 'Online',
          });
          console.log('✅ Order data sent to Google Sheets');
        } catch (sheetError) {
          console.error('Failed to send to Google Sheets:', sheetError);
          // Don't block the payment flow if Google Sheets fails
        }
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
          
          // Track successful purchase for Facebook Pixel
          trackPurchase({
            orderId: currentOrderId,
            productId: product.id,
            productName: product.name,
            value: totalPrice,
            quantity,
            paymentMethod: 'online',
          });
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

  // Detect if user is on mobile device
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const openPaymentLink = (shouldOpenInPlace = false, appName?: string) => {
    const isMobile = isMobileDevice();
    
    // For mobile devices, try to open UPI app directly first
    if (isMobile && upiPaymentString && upiPaymentString.startsWith('upi://')) {
      let finalUrl = upiPaymentString;
      
      // Convert to app-specific deep link based on button clicked
      if (appName) {
        // Extract the UPI payment parameters from the original string
        // Format: upi://pay?pa=xxx@xxx&pn=xxx&am=xxx&cu=INR&tn=xxx
        
        switch(appName.toLowerCase()) {
          case 'phonepe':
            // PhonePe accepts standard UPI format but with phonepe:// prefix
            // Keep the full upi://pay structure, just change protocol
            finalUrl = upiPaymentString.replace('upi://', 'phonepe://');
            break;
          case 'googlepay':
          case 'gpay':
            // Google Pay uses tez://upi/pay format with same parameters
            finalUrl = upiPaymentString.replace('upi://pay', 'tez://upi/pay');
            break;
          case 'paytm':
            // Paytm uses paytmmp://pay format with same parameters
            finalUrl = upiPaymentString.replace('upi://pay', 'paytmmp://pay');
            break;
          default:
            // For "Other UPI" or unspecified, use generic upi:// which will show app chooser on Android
            finalUrl = upiPaymentString;
        }
      }
      
      // Directly open UPI app without confirmation
      window.location.href = finalUrl;
      
      // Show success message after attempting to open
      setTimeout(() => {
        setStatusMessage('✅ Opening payment app... If it didn\'t open, please scan the QR code above.');
      }, 500);
      return;
    }

    // For desktop or if no UPI string, use payment URL
    const fallbackUrl = paymentResult?.payment_url?.trim();
    if (fallbackUrl) {
      if (shouldOpenInPlace || isMobile) {
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

  const [shareMessage, setShareMessage] = useState('');

  const handleShare = async () => {
    const result = await shareProduct(product);
    if (result.success) {
      // Track share event
      trackShare({
        id: product.id,
        name: product.name,
        shareMethod: result.method as 'native' | 'clipboard',
      });
      
      if (result.method === 'native') {
        setShareMessage('Shared successfully!');
      } else {
        setShareMessage('Link copied to clipboard!');
      }
      setTimeout(() => setShareMessage(''), 3000);
    } else {
      setShareMessage('Failed to share. Please try again.');
      setTimeout(() => setShareMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header with Back and Share Buttons */}
      <div className="max-w-sm sm:max-w-md mx-auto pt-4 px-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Products
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-full hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl font-medium text-sm"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
        
        {/* Share Success Message */}
        {shareMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-sm text-center animate-fade-in">
            {shareMessage}
          </div>
        )}
      </div>

      <div className="max-w-sm sm:max-w-md mx-auto pb-32 px-4">
        {/* Product Images Gallery */}
        <div className="mb-6">
          {/* Main Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-4 bg-gradient-to-br from-gray-50 to-gray-100">
            <img 
              src={product.images && product.images.length > 0 ? product.images[selectedImage] : product.image}
              alt={`${product.name} - View ${selectedImage + 1}`}
              className="w-full aspect-square object-cover"
            />
            <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg animate-pulse">
              ₹{savings} OFF
            </div>
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              {selectedImage + 1} / {product.images?.length || 1}
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-6 gap-2 mb-4">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative rounded-xl overflow-hidden aspect-square transition-all duration-300 ${
                    selectedImage === index 
                      ? 'ring-4 ring-indigo-500 scale-105 shadow-lg' 
                      : 'ring-2 ring-gray-200 hover:ring-indigo-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={img}
                    alt={`${product.name} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Product Highlights */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 text-center border border-blue-100">
              <div className="text-xl font-bold text-indigo-600">4.9★</div>
              <div className="text-xs text-gray-600 font-medium">Top Rated</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 text-center border border-green-100">
              <div className="text-xl font-bold text-green-600">✓</div>
              <div className="text-xs text-gray-600 font-medium">Verified</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 text-center border border-orange-100">
              <div className="text-xl font-bold text-orange-600">🚚</div>
              <div className="text-xs text-gray-600 font-medium">Fast Ship</div>
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

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-4xl font-bold text-gray-900">₹{product.price}</span>
            <span className="text-lg text-gray-400 line-through">₹1500</span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-bold">
              Save ₹500
            </span>
          </div>

          {/* Diwali Sale Countdown Timer */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-orange-600 animate-pulse" />
                <span className="text-sm font-semibold text-gray-700">🪔 Diwali Sale Ending Soon!</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border-2 border-orange-300">
                <span className="text-2xl font-black text-orange-600 tabular-nums">
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
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
        </div>

        {/* Trust Indicators */}
        <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-200 rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 p-2 rounded-full">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Secure</p>
                <p className="text-xs text-gray-600">SSL Encrypted</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-full">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Trusted</p>
                <p className="text-xs text-gray-600">50K+ Buyers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-purple-600 p-2 rounded-full">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Verified</p>
                <p className="text-xs text-gray-600">100% Authentic</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-orange-600 p-2 rounded-full">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Protected</p>
                <p className="text-xs text-gray-600">Safe Payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        {showCheckout && (
          <div ref={customerFormRef} className="bg-white rounded-2xl p-6 shadow-lg mb-4">
            {!hasPaymentSuccess && !codOrderConfirmed ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Delivery Details</h3>
                    <p className="text-sm text-gray-500">Please fill all fields for delivery</p>
                  </div>
                  <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                    <Lock className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-bold text-green-700">Secure</span>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('online');
                        // Track add to cart when user selects payment method
                        trackAddToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          quantity,
                        });
                      }}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                        paymentMethod === 'online'
                          ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg scale-105'
                          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                      }`}
                    >
                      {paymentMethod === 'online' && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                          <QrCode className="w-6 h-6 text-white" />
                        </div>
                        <p className="font-bold text-gray-900">Online UPI</p>
                        <p className="text-xs text-gray-600 mt-1">Pay with UPI Apps</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('cod');
                        // Track add to cart when user selects COD
                        trackAddToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          quantity,
                        });
                      }}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                        paymentMethod === 'cod'
                          ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg scale-105'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                      }`}
                    >
                      {paymentMethod === 'cod' && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-2xl">💵</span>
                        </div>
                        <p className="font-bold text-gray-900">Cash on Delivery</p>
                        <p className="text-xs text-gray-600 mt-1">Pay when you receive</p>
                      </div>
                    </button>
                  </div>
                  
                  {paymentMethod === 'cod' && (
                    <div className="mt-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-3">
                      <p className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="text-lg">📦</span>
                        <span className="flex-1">
                          <strong>Your product will arrive in 5-7 working days.</strong> You can pay in cash when the delivery arrives at your doorstep.
                        </span>
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="customer-name"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (fieldErrors.name) {
                          setFieldErrors({...fieldErrors, name: false});
                          setError('');
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                        fieldErrors.name 
                          ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                      }`}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      required
                    />
                    {fieldErrors.name && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <span className="text-base">⚠️</span> Please fill in your full name
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="tel"
                      id="customer-mobile"
                      value={customerMobile}
                      onChange={(e) => {
                        setCustomerMobile(e.target.value);
                        if (fieldErrors.mobile) {
                          setFieldErrors({...fieldErrors, mobile: false});
                          setError('');
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                        fieldErrors.mobile 
                          ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                      }`}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      autoComplete="tel"
                      required
                    />
                    {fieldErrors.mobile && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <span className="text-base">⚠️</span> Please enter a valid 10-digit mobile number
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="customer-email"
                      value={customerEmail}
                      onChange={(e) => {
                        setCustomerEmail(e.target.value);
                        if (fieldErrors.email) {
                          setFieldErrors({...fieldErrors, email: false});
                          setError('');
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                        fieldErrors.email 
                          ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                      }`}
                      placeholder="your.email@example.com"
                      autoComplete="email"
                      required
                    />
                    {fieldErrors.email && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <span className="text-base">⚠️</span> Please enter a valid email address
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Home className="w-4 h-4 inline mr-1" />
                      Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => {
                        setCustomerAddress(e.target.value);
                        if (fieldErrors.address) {
                          setFieldErrors({...fieldErrors, address: false});
                          setError('');
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                        fieldErrors.address 
                          ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                      }`}
                      placeholder="House No, Building, Street, Area"
                      rows={2}
                      autoComplete="street-address"
                      required
                    />
                    {fieldErrors.address && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <span className="text-base">⚠️</span> Please enter your complete delivery address
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerCity}
                        onChange={(e) => {
                          setCustomerCity(e.target.value);
                          if (fieldErrors.city) {
                            setFieldErrors({...fieldErrors, city: false});
                            setError('');
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                          fieldErrors.city 
                            ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                        }`}
                        placeholder="City"
                        autoComplete="address-level2"
                        required
                      />
                      {fieldErrors.city && (
                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                          <span className="text-base">⚠️</span> Please enter city
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerState}
                        onChange={(e) => {
                          setCustomerState(e.target.value);
                          if (fieldErrors.state) {
                            setFieldErrors({...fieldErrors, state: false});
                            setError('');
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                          fieldErrors.state 
                            ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                        }`}
                        placeholder="State"
                        autoComplete="address-level1"
                        required
                      />
                      {fieldErrors.state && (
                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                          <span className="text-base">⚠️</span> Please enter state
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerPincode}
                      onChange={(e) => {
                        setCustomerPincode(e.target.value);
                        if (fieldErrors.pincode) {
                          setFieldErrors({...fieldErrors, pincode: false});
                          setError('');
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                        fieldErrors.pincode 
                          ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
                      }`}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      autoComplete="postal-code"
                      required
                    />
                    {fieldErrors.pincode && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <span className="text-base">⚠️</span> Please enter a valid 6-digit pincode
                      </p>
                    )}
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
            ) : codOrderConfirmed ? (
              /* COD Order Confirmation Screen */
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed! 🎉</h3>
                  <p className="text-gray-600 mb-2">Your Cash on Delivery order has been successfully placed.</p>
                  <p className="text-sm text-gray-500">A confirmation email has been sent to {customerEmail}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📦</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">Delivery Information</p>
                      <p className="text-sm text-gray-700">Your product will arrive in <strong>5-7 working days</strong></p>
                      <p className="text-sm text-gray-600 mt-2">Please keep ₹{totalPrice} ready in cash for the delivery person.</p>
                    </div>
                  </div>
                </div>

                {currentOrderId && (
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-2 text-center font-semibold">Order ID</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-base font-mono bg-gray-100 px-4 py-2 rounded-lg font-bold text-indigo-600">
                        {currentOrderId}
                      </code>
                      <button
                        onClick={() => copyToClipboard(currentOrderId)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Copy className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">Save this for future reference</p>
                  </div>
                )}

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Order Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product:</span>
                      <span className="font-semibold text-gray-900">{product.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-semibold text-gray-900">{quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment:</span>
                      <span className="font-semibold text-green-700">Cash on Delivery</span>
                    </div>
                    <div className="border-t border-green-300 my-2 pt-2 flex justify-between">
                      <span className="text-gray-900 font-bold">Total Amount:</span>
                      <span className="text-xl font-bold text-gray-900">₹{totalPrice}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={resetCheckoutForm}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Place Another Order
                </button>
              </div>
            ) : (
              /* Online Payment QR Code Screen */
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Payment QR Code</h3>
                  <p className="text-gray-600 mb-4">Scan with any UPI app to complete payment</p>
                </div>

                {/* QR Code for all users */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Scan to Pay</p>
                  {qrCodeDataUrl && (
                    <div className="bg-white p-4 rounded-xl border-2 border-indigo-200">
                      <img src={qrCodeDataUrl} alt="Payment QR Code" className="w-full max-w-xs mx-auto" />
                    </div>
                  )}
                </div>

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
                {/* Payment App Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openPaymentLink(true, 'phonepe')}
                    disabled={!upiPaymentString && !paymentResult?.payment_url}
                    className={`bg-white border-2 border-purple-200 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all flex items-center justify-center ${
                      upiPaymentString || paymentResult?.payment_url ? 'hover:scale-[1.02] hover:border-purple-400' : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <img 
                      src="https://static.vecteezy.com/system/resources/thumbnails/049/116/753/small_2x/phonepe-app-icon-transparent-background-free-png.png" 
                      alt="PhonePe" 
                      className="h-10 w-auto object-contain"
                    />
                  </button>
                  
                  <button
                    onClick={() => openPaymentLink(true, 'gpay')}
                    disabled={!upiPaymentString && !paymentResult?.payment_url}
                    className={`bg-white border-2 border-blue-200 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all flex items-center justify-center ${
                      upiPaymentString || paymentResult?.payment_url ? 'hover:scale-[1.02] hover:border-blue-400' : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" 
                      alt="Google Pay" 
                      className="h-8 w-auto object-contain"
                    />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openPaymentLink(true, 'paytm')}
                    disabled={!upiPaymentString && !paymentResult?.payment_url}
                    className={`bg-white border-2 border-blue-200 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all flex items-center justify-center ${
                      upiPaymentString || paymentResult?.payment_url ? 'hover:scale-[1.02] hover:border-blue-400' : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <img 
                      src="https://static.vecteezy.com/system/resources/thumbnails/051/336/375/small_2x/paytm-upi-transparent-icon-free-png.png" 
                      alt="Paytm" 
                      className="h-10 w-auto object-contain"
                    />
                  </button>

                  <button
                    onClick={() => openPaymentLink(true)}
                    disabled={!upiPaymentString && !paymentResult?.payment_url}
                    className={`bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all flex items-center justify-center gap-2 ${
                      upiPaymentString || paymentResult?.payment_url ? 'hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="font-bold">Other UPI</span>
                  </button>
                </div>
                
                <button
                  onClick={resetCheckoutForm}
                  className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                >
                  Start New Order
                </button>
              </div>
            ) : codOrderConfirmed ? (
              <button
                onClick={resetCheckoutForm}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
              >
                Place Another Order
              </button>
            ) : (
              <div className="space-y-3">
                {paymentMethod === 'online' ? (
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 ${
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
                        <QrCode className="w-5 h-5" />
                        Pay Online with UPI
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleCODOrder}
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
                        <span className="text-xl">💵</span>
                        Confirm Cash on Delivery
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
