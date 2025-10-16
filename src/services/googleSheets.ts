// Google Sheets Integration Service
// Sends order data to Google Sheets via Apps Script Web App

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxVeet9UTsu10aUxFXiZ0BL3XJ4jPv6fs4IDHFsEtggN4jdWrGfTrHtdJswfdSK5vwG/exec';

interface OrderData {
  orderId: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  product: string;
  price: string;
  timestamp: string;
  paymentMethod?: string; // 'Online' or 'COD'
}

/**
 * Send order data to Google Sheets
 * @param orderData - Customer and order information
 * @returns Promise with success/error status
 */
export async function sendToGoogleSheets(orderData: OrderData): Promise<{ success: boolean; message: string }> {
  try {
    const dataWithPaymentMethod = {
      ...orderData,
      paymentMethod: orderData.paymentMethod || 'Online', // Default to 'Online' if not specified
    };

    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors', // Required for Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithPaymentMethod),
    });

    // Note: With 'no-cors' mode, we can't read the response
    // but the data will still be sent to Google Sheets
    return {
      success: true,
      message: 'Order data sent to Google Sheets successfully',
    };
  } catch (error) {
    console.error('Error sending to Google Sheets:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send data',
    };
  }
}

/**
 * Generate a unique order ID
 * Format: ORD-YYYYMMDD-XXXXXX (e.g., ORD-20240115-A3B2C1)
 */
export function generateOrderId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${dateStr}-${randomStr}`;
}

/**
 * Format current timestamp
 * Format: DD/MM/YYYY HH:MM:SS
 */
export function formatTimestamp(): string {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Send order confirmation email to customer
 * @param orderData - Customer and order information
 * @returns Promise with success/error status
 */
export async function sendOrderConfirmationEmail(orderData: OrderData): Promise<{ success: boolean; message: string }> {
  try {
    // Using the same Google Apps Script endpoint for email sending
    const emailData = {
      ...orderData,
      action: 'sendEmail', // Flag to tell the script to send email
      emailSubject: `Order Confirmation - ${orderData.orderId}`,
      emailMessage: `
Dear ${orderData.name},

Thank you for your order! Your order has been confirmed.

Order Details:
- Order ID: ${orderData.orderId}
- Product: ${orderData.product}
- Amount: ${orderData.price}
- Payment Method: ${orderData.paymentMethod || 'Online'}

Delivery Address:
${orderData.address}
${orderData.city}, ${orderData.state} - ${orderData.pincode}

${orderData.paymentMethod === 'COD' ? '📦 Your product will arrive in 5-7 working days.' : '📦 Your product will be shipped soon.'}

Thank you for shopping with us!

Best regards,
Your Store Team
      `.trim(),
    };

    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    return {
      success: true,
      message: 'Confirmation email sent successfully',
    };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
