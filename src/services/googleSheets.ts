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
}

/**
 * Send order data to Google Sheets
 * @param orderData - Customer and order information
 * @returns Promise with success/error status
 */
export async function sendToGoogleSheets(orderData: OrderData): Promise<{ success: boolean; message: string }> {
  try {
    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors', // Required for Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
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
