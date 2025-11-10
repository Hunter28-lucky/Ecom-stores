# 📊 Facebook Pixel Implementation Guide

## ✅ Complete Setup - Track Every Customer Action!

Your Facebook Pixel is now properly configured to track all critical e-commerce events for Meta Ads optimization.

---

## 🎯 What's Tracking Now?

### **1. PageView** 📄
**When it fires:**
- User lands on your website
- User returns to home page from product detail

**Why it matters:**
- Basic traffic tracking
- Audience building
- Retargeting pool creation

---

### **2. ViewContent** 👁️
**When it fires:**
- User opens a product detail page
- Someone clicks on Apple AirPods Pro

**Data tracked:**
```javascript
{
  content_ids: ['1'],
  content_name: 'Apple AirPods Pro (2nd Generation)',
  content_type: 'product',
  content_category: 'Premium Audio',
  value: 999,
  currency: 'INR'
}
```

**Why it matters:**
- Create product-specific audiences
- Show ads for products people viewed
- Dynamic product ads
- "Recently viewed" retargeting

---

### **3. AddToCart** 🛒
**When it fires:**
- User selects payment method (Online UPI or COD)
- Shows buying intent

**Data tracked:**
```javascript
{
  content_ids: ['1'],
  content_name: 'Apple AirPods Pro (2nd Generation)',
  content_type: 'product',
  value: 999,
  currency: 'INR',
  num_items: 1
}
```

**Why it matters:**
- High-intent audience (people ready to buy)
- Cart abandonment retargeting
- Optimize for "Add to Cart" conversions
- Better than ViewContent audiences

---

### **4. InitiateCheckout** 💳
**When it fires:**
- User fills form and clicks "Proceed to Payment" (Online)
- User fills form and clicks "Place COD Order" (COD)

**Data tracked:**
```javascript
{
  content_ids: ['1'],
  content_name: 'Apple AirPods Pro (2nd Generation)',
  content_type: 'product',
  value: 999,
  currency: 'INR',
  num_items: 1
}
```

**Why it matters:**
- Very high-intent audience
- Optimize campaigns for checkout starts
- Retarget people who started but didn't complete
- Track checkout funnel drop-offs

---

### **5. AddPaymentInfo** 💰
**When it fires:**
- After form validation passes
- Before payment/order creation

**Data tracked:**
```javascript
{
  content_ids: ['1'],
  content_name: 'Apple AirPods Pro (2nd Generation)',
  content_type: 'product',
  value: 999,
  currency: 'INR',
  payment_method: 'UPI' // or 'Cash on Delivery'
}
```

**Why it matters:**
- Track which payment methods convert better
- Last-second abandonment tracking
- Optimize for this micro-conversion

---

### **6. Purchase** 🎉 **[MOST IMPORTANT!]**
**When it fires:**
- **Online UPI**: When payment status returns SUCCESS/COMPLETED
- **COD**: When order is confirmed and sent to Google Sheets

**Data tracked:**
```javascript
{
  content_ids: ['1'],
  content_name: 'Apple AirPods Pro (2nd Generation)',
  content_type: 'product',
  value: 999,
  currency: 'INR',
  num_items: 1,
  order_id: 'ORD1731234567891234',
  payment_method: 'UPI' // or 'Cash on Delivery'
}
```

**Why it matters:**
- ✅ **CRITICAL** for conversion tracking
- ✅ Facebook optimizes ads for purchases
- ✅ ROAS (Return on Ad Spend) calculations
- ✅ Lookalike audiences from buyers
- ✅ Exclude buyers from retargeting
- ✅ Attribution tracking (which ad led to sale)

---

### **7. Share** 📤
**When it fires:**
- User clicks "Share" button
- Link copied or shared via native menu

**Data tracked:**
```javascript
{
  content_ids: ['1'],
  content_name: 'Apple AirPods Pro (2nd Generation)',
  content_type: 'product',
  share_method: 'native' // or 'clipboard'
}
```

**Why it matters:**
- Track viral/word-of-mouth potential
- People who share are brand advocates
- Create audiences of engaged users

---

## 🔧 Technical Implementation

### **Files Created:**
```
✅ src/utils/facebookPixel.ts  - Event tracking functions
```

### **Files Modified:**
```
✅ src/components/ProductDetail.tsx  - All event tracking
✅ src/components/ProductCatalog.tsx - PageView tracking
```

### **Pixel ID:**
```
1568883147881162
```

---

## 📈 How to Use in Facebook Ads Manager

### **1. Verify Events Are Firing**

#### Test Events Tool:
1. Go to: https://business.facebook.com/events_manager
2. Click on your Pixel (ID: 1568883147881162)
3. Go to **"Test Events"** tab
4. Browse your website and see events appear in real-time!

#### What You Should See:
```
✅ PageView - When you land on site
✅ ViewContent - When you click product
✅ AddToCart - When you select payment method
✅ InitiateCheckout - When you start checkout
✅ AddPaymentInfo - During payment process
✅ Purchase - When order completes (TEST THIS!)
✅ Share - When you click Share button
```

---

### **2. Create Custom Audiences**

#### High-Intent Audiences:
```
👥 "Viewed Product"
   - Event: ViewContent
   - Time: Last 30 days
   - Use for: Product retargeting

👥 "Added to Cart"
   - Event: AddToCart
   - Time: Last 7 days
   - Use for: Cart abandonment ads

👥 "Started Checkout"
   - Event: InitiateCheckout
   - Time: Last 3 days
   - Use for: Aggressive retargeting

👥 "Purchasers"
   - Event: Purchase
   - Time: Last 180 days
   - Use for: Lookalike audiences, exclusion
```

---

### **3. Optimize Campaign for Conversions**

#### When Creating Facebook Ad:
```
1. Campaign Objective: "Sales" or "Conversions"

2. Conversion Event: Select "Purchase"
   ✅ This tells Facebook to find people who will buy

3. Pixel: Select your pixel (1568883147881162)

4. Attribution Window: 7-day click, 1-day view

5. Budget: Start with ₹500/day minimum
```

---

### **4. Create Lookalike Audiences**

#### From Purchasers:
```
1. Go to Audiences
2. Click "Create Audience" > "Lookalike Audience"
3. Source: "Purchasers" (Custom Audience from Purchase event)
4. Location: India
5. Audience Size: 1% (most similar people)
6. Use for: Prospecting campaigns
```

---

## 🎯 Campaign Structure Examples

### **Campaign 1: Prospecting**
```
Objective: Conversions (Purchase)
Audience: 1% Lookalike of Purchasers
Optimization: Purchase
Ad: Product features, benefits, price
```

### **Campaign 2: Retargeting - Warm**
```
Objective: Conversions (Purchase)
Audience: ViewContent in last 30 days
         EXCLUDE: Purchasers
Optimization: Purchase
Ad: Testimonials, reviews, limited-time offer
```

### **Campaign 3: Retargeting - Hot**
```
Objective: Conversions (Purchase)
Audience: AddToCart in last 7 days
         EXCLUDE: Purchasers
Optimization: Purchase
Ad: Urgency ("Limited stock!", "Offer ends soon!")
Budget: Higher (these people are ready to buy)
```

### **Campaign 4: Cart Abandonment**
```
Objective: Conversions (Purchase)
Audience: InitiateCheckout in last 3 days
         EXCLUDE: Purchasers
Optimization: Purchase
Ad: "You left something behind!" + 5% discount
```

---

## 🔍 Debugging & Testing

### **Check Console Logs:**

When testing, open browser console (F12) and look for:
```
📊 FB Pixel: ViewContent tracked Apple AirPods Pro (2nd Generation)
📊 FB Pixel: AddToCart tracked Apple AirPods Pro (2nd Generation)
📊 FB Pixel: InitiateCheckout tracked Apple AirPods Pro (2nd Generation)
📊 FB Pixel: AddPaymentInfo tracked online
📊 FB Pixel: Purchase tracked {orderId: 'ORD...', value: 999}
```

### **Common Issues:**

❌ **Events not showing in Test Events Tool?**
- Check if Pixel is loaded: Type `fbq` in console
- Clear browser cache
- Disable ad blockers

❌ **Purchase event not firing?**
- Test with COD (easier to test)
- Check console for errors
- Verify order completes successfully

❌ **Events showing but not in Ads Manager?**
- Wait 20 minutes (can take time to sync)
- Check date range filters
- Verify Pixel ID matches

---

## 📊 Success Metrics to Track

### **Week 1-2: Data Collection**
```
✅ 100+ PageView events
✅ 50+ ViewContent events
✅ 10+ AddToCart events
✅ 5+ InitiateCheckout events
✅ 1+ Purchase events (for testing)
```

### **Week 3-4: Start Optimizing**
```
✅ 1000+ PageView events
✅ 100+ ViewContent events
✅ 50+ AddToCart events
✅ 10+ Purchase events
✅ Create Custom Audiences
✅ Launch Lookalike campaigns
```

### **Month 2+: Scale**
```
✅ Multiple profitable campaigns
✅ ROAS > 2.0 (₹2 revenue per ₹1 spent)
✅ 50+ purchases/month
✅ Refine audiences based on data
```

---

## 🚀 Advanced Tips

### **1. Value Optimization**
Facebook can optimize for purchase VALUE, not just quantity:
```
Campaign: Conversions
Optimization: Value
Delivery: Maximize conversion value
```

### **2. Dynamic Ads**
Once you have product catalog:
```
Ad Format: Carousel
Use: Dynamic Product Ads
Shows exact products people viewed
```

### **3. Custom Conversions**
Create custom events in Events Manager:
```
Name: "High-Value Purchase"
Rule: Purchase event where value >= 5000
Use: Optimize for big-ticket sales
```

### **4. Offline Conversions**
Upload COD deliveries back to Facebook:
```
Go to: Offline Events
Upload: Order ID, Value, Timestamp
Match: With purchase events
Track: Complete funnel including delivery
```

---

## 🎓 Next Steps

### **Immediate (This Week):**
1. ✅ Test all events manually
2. ✅ Verify Purchase event fires on real orders
3. ✅ Set up "Purchasers" Custom Audience

### **Short-term (This Month):**
1. ✅ Create Lookalike Audience (1%)
2. ✅ Launch first conversion campaign
3. ✅ Set up cart abandonment campaign

### **Long-term (Next 3 Months):**
1. ✅ Scale winning campaigns
2. ✅ Test different audience sizes (1%, 2%, 5%)
3. ✅ Launch Dynamic Product Ads
4. ✅ Implement Offline Conversion tracking

---

## 📞 Need Help?

### **Facebook Resources:**
- Events Manager: https://business.facebook.com/events_manager
- Pixel Helper Chrome Extension
- Facebook Support Chat

### **Tracking Issues?**
Check `src/utils/facebookPixel.ts` - all tracking functions are there!

---

## ✨ Summary

Your Facebook Pixel now tracks:
✅ **PageView** - Traffic
✅ **ViewContent** - Product interest
✅ **AddToCart** - Buy intent  
✅ **InitiateCheckout** - High intent
✅ **AddPaymentInfo** - Payment flow
✅ **Purchase** - Conversions (MOST IMPORTANT!)
✅ **Share** - Social engagement

**You're ready to run high-converting Facebook Ads! 🚀**
