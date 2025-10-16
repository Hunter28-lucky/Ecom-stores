// ====================================================================
// GOOGLE APPS SCRIPT - Complete Order Management System with COD Support
// ====================================================================
// 
// Features:
// - Order capture and storage
// - Email notifications to admin + customer
// - WhatsApp notifications
// - COD (Cash on Delivery) support
// - Beautiful formatted sheets
// - Sales analytics dashboard
//
// ====================================================================

// ====== CONFIGURATION ======
const CONFIG = {
  // Admin emails - both will receive notifications
  ADMIN_EMAILS: [
    'krrishyogi18@gmail.com',           // Your email
    'Priyanshuchouhanllc@gmail.com'     // Partner's email
  ],
  
  // Your WhatsApp number (with country code, no + or spaces)
  // Example: For +91 8797903378, use: 918797903378
  WHATSAPP_NUMBER: '918797903378',
  
  // Email subject line
  EMAIL_SUBJECT: '🎉 New Order Received - TechStore',
  
  // Business name
  BUSINESS_NAME: 'TechStore'
};

// ====== MAIN FUNCTION - Receives Orders ======
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // ============================================
    // CUSTOMER EMAIL CONFIRMATION REQUEST (COD)
    // ============================================
    if (data.action === 'sendEmail') {
      sendCustomerConfirmationEmail(data);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Customer confirmation email sent successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ============================================
    // ORDER DATA SUBMISSION
    // ============================================
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Check if headers exist, if not create them
    if (sheet.getLastRow() === 0) {
      setupSheet(sheet);
    }
    
    // Add new order data (including Payment Method)
    const newRow = [
      data.orderId,
      data.name,
      data.mobile,
      data.email,
      data.address,
      data.city,
      data.state,
      data.pincode,
      data.product,
      data.price,
      data.timestamp,
      data.paymentMethod || 'Online', // ← NEW: Payment method (Online/COD)
      'Pending' // Default status
    ];
    
    sheet.appendRow(newRow);
    
    // Format the new row
    const lastRow = sheet.getLastRow();
    formatDataRow(sheet, lastRow);
    
    // Send admin notifications (email + WhatsApp)
    sendEmailNotification(data);
    sendWhatsAppNotification(data);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Order saved and notifications sent!'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ====== CUSTOMER CONFIRMATION EMAIL (for COD orders) ======
function sendCustomerConfirmationEmail(data) {
  try {
    // Send email to customer with order confirmation
    MailApp.sendEmail({
      to: data.email,
      subject: data.emailSubject || 'Order Confirmation - ' + CONFIG.BUSINESS_NAME,
      body: data.emailMessage || 'Thank you for your order!',
      name: CONFIG.BUSINESS_NAME
    });
    
    Logger.log('Customer confirmation email sent to: ' + data.email);
    
  } catch (error) {
    Logger.log('Customer email error: ' + error.toString());
    // Don't throw error - we don't want to block the order if email fails
  }
}

// ====== ADMIN EMAIL NOTIFICATION ======
function sendEmailNotification(data) {
  try {
    const subject = CONFIG.EMAIL_SUBJECT;
    
    // Determine payment badge color
    const paymentMethod = data.paymentMethod || 'Online';
    const paymentBadgeColor = paymentMethod === 'COD' ? '#FF9800' : '#2196F3';
    const paymentIcon = paymentMethod === 'COD' ? '💵' : '💳';
    
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; border: 2px solid #4CAF50; border-radius: 10px; overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🎉 New Order Received!</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${CONFIG.BUSINESS_NAME}</p>
            </div>
            
            <!-- Order Details -->
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">📦 Order Details</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr style="background-color: white;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Order ID:</td>
                  <td style="padding: 12px; border: 1px solid #ddd; color: #1976D2; font-weight: bold;">${data.orderId}</td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Product:</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${data.product}</td>
                </tr>
                <tr style="background-color: white;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Price:</td>
                  <td style="padding: 12px; border: 1px solid #ddd; color: #2E7D32; font-weight: bold; font-size: 18px;">${data.price}</td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Payment Method:</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">
                    <span style="background: ${paymentBadgeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 14px;">
                      ${paymentIcon} ${paymentMethod}
                    </span>
                  </td>
                </tr>
                <tr style="background-color: white;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Order Time:</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${data.timestamp}</td>
                </tr>
              </table>
              
              <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; margin-top: 30px;">👤 Customer Information</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr style="background-color: white;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Name:</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${data.name}</td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Mobile:</td>
                  <td style="padding: 12px; border: 1px solid #ddd;"><a href="tel:+91${data.mobile}" style="color: #1976D2; text-decoration: none;">📱 ${data.mobile}</a></td>
                </tr>
                <tr style="background-color: white;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Email:</td>
                  <td style="padding: 12px; border: 1px solid #ddd;"><a href="mailto:${data.email}" style="color: #1976D2; text-decoration: none;">✉️ ${data.email}</a></td>
                </tr>
              </table>
              
              <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; margin-top: 30px;">🏠 Delivery Address</h2>
              
              <div style="background: white; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
                <p style="margin: 5px 0; font-size: 16px;"><strong>${data.address}</strong></p>
                <p style="margin: 5px 0; color: #666;">${data.city}, ${data.state} - ${data.pincode}</p>
              </div>
              
              <!-- Quick Actions -->
              <div style="margin-top: 30px; text-align: center;">
                <a href="https://wa.me/91${data.mobile}" style="display: inline-block; background: #25D366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold;">💬 WhatsApp Customer</a>
                <a href="tel:+91${data.mobile}" style="display: inline-block; background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold;">📞 Call Customer</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-top: 2px solid #4CAF50;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                📊 View all orders in your <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}" style="color: #4CAF50; text-decoration: none; font-weight: bold;">Google Sheet Dashboard</a>
              </p>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
                ${CONFIG.BUSINESS_NAME} • Automated Order Management System
              </p>
            </div>
            
          </div>
        </body>
      </html>
    `;
    
    const plainBody = `
🎉 NEW ORDER RECEIVED!

ORDER DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━
Order ID: ${data.orderId}
Product: ${data.product}
Price: ${data.price}
Payment Method: ${paymentMethod} ${paymentIcon}
Time: ${data.timestamp}

CUSTOMER INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${data.name}
Mobile: ${data.mobile}
Email: ${data.email}

DELIVERY ADDRESS:
━━━━━━━━━━━━━━━━━━━━━━━━
${data.address}
${data.city}, ${data.state} - ${data.pincode}

View all orders: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}

━━━━━━━━━━━━━━━━━━━━━━━━
${CONFIG.BUSINESS_NAME}
    `;
    
    // Send to all admin emails
    CONFIG.ADMIN_EMAILS.forEach(email => {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        body: plainBody,
        htmlBody: htmlBody
      });
      Logger.log('Email notification sent to: ' + email);
    });
    
    Logger.log('All email notifications sent successfully');
  } catch (error) {
    Logger.log('Email error: ' + error.toString());
  }
}

// ====== WHATSAPP NOTIFICATION ======
function sendWhatsAppNotification(data) {
  try {
    // Create WhatsApp message
    const paymentMethod = data.paymentMethod || 'Online';
    const paymentIcon = paymentMethod === 'COD' ? '💵' : '💳';
    
    const message = `🎉 *NEW ORDER RECEIVED!*

*ORDER DETAILS*
━━━━━━━━━━━━━━━━
📦 Order ID: ${data.orderId}
🛍️ Product: ${data.product}
💰 Price: ${data.price}
${paymentIcon} Payment: ${paymentMethod}
⏰ Time: ${data.timestamp}

*CUSTOMER INFO*
━━━━━━━━━━━━━━━━
👤 Name: ${data.name}
📱 Mobile: ${data.mobile}
✉️ Email: ${data.email}

*DELIVERY ADDRESS*
━━━━━━━━━━━━━━━━
🏠 ${data.address}
📍 ${data.city}, ${data.state} - ${data.pincode}

━━━━━━━━━━━━━━━━
🔗 View orders: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`;
    
    // URL encode the message
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp Web URL
    const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    // Log the WhatsApp URL
    Logger.log('WhatsApp notification URL: ' + whatsappUrl);
    Logger.log('Open this URL in your browser to send WhatsApp message');
    
  } catch (error) {
    Logger.log('WhatsApp error: ' + error.toString());
  }
}

// ====== SETUP BEAUTIFUL SHEET ======
function setupSheet(sheet) {
  // Set headers (UPDATED: Added "Payment Method" column)
  const headers = [
    'Order ID', 'Name', 'Mobile', 'Email', 'Address', 
    'City', 'State', 'Pincode', 'Product', 'Price', 
    'Timestamp', 'Payment Method', 'Status'
  ];
  
  sheet.appendRow(headers);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4CAF50');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  headerRange.setBorder(true, true, true, true, true, true, '#FFFFFF', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Set column widths
  sheet.setColumnWidth(1, 180); // Order ID
  sheet.setColumnWidth(2, 150); // Name
  sheet.setColumnWidth(3, 120); // Mobile
  sheet.setColumnWidth(4, 200); // Email
  sheet.setColumnWidth(5, 250); // Address
  sheet.setColumnWidth(6, 100); // City
  sheet.setColumnWidth(7, 100); // State
  sheet.setColumnWidth(8, 80);  // Pincode
  sheet.setColumnWidth(9, 200); // Product
  sheet.setColumnWidth(10, 80); // Price
  sheet.setColumnWidth(11, 150); // Timestamp
  sheet.setColumnWidth(12, 120); // Payment Method (NEW)
  sheet.setColumnWidth(13, 120); // Status
  
  // Add data validation for Status column (updated to column M)
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('M2:M1000').setDataValidation(statusRule);
  
  // Add statistics dashboard
  addStatisticsDashboard(sheet);
}

// ====== FORMAT DATA ROWS ======
function formatDataRow(sheet, rowNumber) {
  const rowRange = sheet.getRange(rowNumber, 1, 1, 13); // Updated to 13 columns
  
  // Alternating row colors
  if (rowNumber % 2 === 0) {
    rowRange.setBackground('#F5F5F5');
  } else {
    rowRange.setBackground('#FFFFFF');
  }
  
  // Add borders
  rowRange.setBorder(true, true, true, true, false, false, '#E0E0E0', SpreadsheetApp.BorderStyle.SOLID);
  
  // Center align specific columns
  sheet.getRange(rowNumber, 1).setHorizontalAlignment('center'); // Order ID
  sheet.getRange(rowNumber, 3).setHorizontalAlignment('center'); // Mobile
  sheet.getRange(rowNumber, 8).setHorizontalAlignment('center'); // Pincode
  sheet.getRange(rowNumber, 10).setHorizontalAlignment('center'); // Price
  sheet.getRange(rowNumber, 11).setHorizontalAlignment('center'); // Timestamp
  sheet.getRange(rowNumber, 12).setHorizontalAlignment('center'); // Payment Method
  sheet.getRange(rowNumber, 13).setHorizontalAlignment('center'); // Status
  
  // Format price column
  sheet.getRange(rowNumber, 10).setFontWeight('bold').setFontColor('#2E7D32');
  
  // Format Payment Method column (NEW)
  const paymentMethodCell = sheet.getRange(rowNumber, 12);
  const paymentMethod = paymentMethodCell.getValue();
  if (paymentMethod === 'COD') {
    paymentMethodCell.setBackground('#FFE0B2');
    paymentMethodCell.setFontWeight('bold');
    paymentMethodCell.setFontColor('#E65100');
  } else {
    paymentMethodCell.setBackground('#BBDEFB');
    paymentMethodCell.setFontWeight('bold');
    paymentMethodCell.setFontColor('#0D47A1');
  }
  
  // Format status column
  const statusCell = sheet.getRange(rowNumber, 13);
  statusCell.setValue('Pending');
  statusCell.setBackground('#FFF9C4');
  statusCell.setFontWeight('bold');
  statusCell.setFontColor('#F57C00');
  
  // Make Order ID bold and blue
  sheet.getRange(rowNumber, 1).setFontWeight('bold').setFontColor('#1976D2');
}

// ====== SALES ANALYTICS DASHBOARD ======
function addStatisticsDashboard(sheet) {
  const startRow = 2;
  const startCol = 15; // Column O (moved one column to the right)
  
  // Dashboard Title
  const titleRange = sheet.getRange(startRow, startCol, 1, 2);
  titleRange.merge();
  titleRange.setValue('📊 SALES DASHBOARD');
  titleRange.setBackground('#2196F3');
  titleRange.setFontColor('#FFFFFF');
  titleRange.setFontWeight('bold');
  titleRange.setFontSize(12);
  titleRange.setHorizontalAlignment('center');
  
  // Add statistics (updated formulas for new column positions)
  const stats = [
    ['Total Orders:', '=COUNTA(A2:A)', '#4CAF50'],
    ['Total Revenue:', '=COUNTA(A2:A)*999', '#2E7D32'],
    ['💵 COD Orders:', '=COUNTIF(L:L,"COD")', '#FF9800'],
    ['💳 Online Orders:', '=COUNTIF(L:L,"Online")', '#2196F3'],
    ['', '', ''],
    ['📦 Pending:', '=COUNTIF(M:M,"Pending")', '#F57C00'],
    ['⚙️ Processing:', '=COUNTIF(M:M,"Processing")', '#2196F3'],
    ['🚚 Shipped:', '=COUNTIF(M:M,"Shipped")', '#9C27B0'],
    ['✅ Delivered:', '=COUNTIF(M:M,"Delivered")', '#4CAF50'],
    ['❌ Cancelled:', '=COUNTIF(M:M,"Cancelled")', '#F44336'],
    ['', '', ''],
    ['Today Orders:', '=COUNTIF(K:K,TEXT(TODAY(),"dd/mm/yyyy"))', '#FF9800'],
    ['Avg. Order Value:', '₹999', '#00BCD4']
  ];
  
  let currentRow = startRow + 1;
  stats.forEach(([label, formula, color]) => {
    if (label) {
      sheet.getRange(currentRow, startCol).setValue(label).setFontWeight('bold');
      sheet.getRange(currentRow, startCol + 1).setFormula(formula).setFontWeight('bold').setFontColor(color);
    }
    currentRow++;
  });
  
  // Format dashboard box
  const dashboardRange = sheet.getRange(startRow, startCol, stats.length + 1, 2);
  dashboardRange.setBorder(true, true, true, true, true, true, '#2196F3', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  // Set column widths
  sheet.setColumnWidth(startCol, 140);
  sheet.setColumnWidth(startCol + 1, 100);
  
  // Add last updated timestamp
  const timestampRow = startRow + stats.length + 2;
  sheet.getRange(timestampRow, startCol, 1, 2).merge();
  sheet.getRange(timestampRow, startCol).setValue('Last Updated: ' + new Date().toLocaleString()).setFontSize(9).setFontColor('#999').setHorizontalAlignment('center');
}

// ====== STATUS CHANGE NOTIFICATION ======
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  
  // Check if Status column (M - updated from L) was edited
  if (range.getColumn() === 13 && range.getRow() > 1) {
    const newStatus = range.getValue();
    const rowNumber = range.getRow();
    
    // Update status cell formatting based on status
    updateStatusFormatting(sheet, rowNumber, newStatus);
  }
}

function updateStatusFormatting(sheet, rowNumber, status) {
  const statusCell = sheet.getRange(rowNumber, 13); // Updated to column 13
  
  const statusColors = {
    'Pending': { bg: '#FFF9C4', font: '#F57C00' },
    'Processing': { bg: '#BBDEFB', font: '#1976D2' },
    'Shipped': { bg: '#E1BEE7', font: '#7B1FA2' },
    'Delivered': { bg: '#C8E6C9', font: '#2E7D32' },
    'Cancelled': { bg: '#FFCDD2', font: '#C62828' }
  };
  
  if (statusColors[status]) {
    statusCell.setBackground(statusColors[status].bg);
    statusCell.setFontColor(statusColors[status].font);
  }
}

// ====== MANUAL SETUP (Run once if sheet has existing data) ======
function setupExistingSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  setupSheet(sheet);
  
  const lastRow = sheet.getLastRow();
  for (let i = 2; i <= lastRow; i++) {
    formatDataRow(sheet, i);
  }
  
  Logger.log('Sheet setup complete!');
}

// ====== TEST FUNCTION (Optional - for debugging) ======
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Google Apps Script is working! COD support enabled.',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
