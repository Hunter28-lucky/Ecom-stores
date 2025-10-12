# 🎯 Admin Dashboard Guide

## Quick Start

### 1. Start the Admin API Server (Required for Admin Panel)

```bash
npm run admin-api
```

This starts the API server on `http://localhost:3001` that handles saving products to the JSON file.

### 2. Start the Frontend (In a new terminal)

```bash
npm run dev
```

This starts your e-commerce site on `http://localhost:5173`

### OR Start Both Together

```bash
npm run dev:admin
```

This runs both servers at once!

---

## Using the Admin Dashboard

### Access Admin Panel

1. Go to your website: `http://localhost:5173`
2. Click the **"Admin"** button in the top-right corner
3. You're in the admin dashboard! 🎉

### Add a New Product

1. Click **"+ Add Product"** button
2. Fill in all the fields:
   - **Product Name**: Name of your product
   - **Price**: Price in rupees (without ₹ symbol)
   - **Image URL**: Link to product image (use Unsplash, Pexels, or any public URL)
   - **Category**: Product category (Audio, Wearables, etc.)
   - **Rating**: 0-5 star rating
   - **Reviews**: Number of reviews
   - **Description**: Detailed product description
   - **Features**: List of product features (click "+ Add Feature" for more)
3. Click **"Save Product"**
4. Done! Product is added permanently to your store ✅

### Edit a Product

1. In the products table, click the blue **Edit** button
2. Modify any field
3. Click **"Save Product"**
4. Changes are saved permanently! ✅

### Delete a Product

1. Click the red **Trash** button next to any product
2. Confirm deletion
3. Product is removed from your store ✅

---

## Features

✅ **Add Products** - Add unlimited products with images, descriptions, features
✅ **Edit Products** - Update any product information anytime
✅ **Delete Products** - Remove products you don't want
✅ **Live Preview** - See image preview before saving
✅ **Permanent Changes** - All changes are saved to `products.json` file
✅ **No Database** - Works with simple JSON file storage

---

## Finding Product Images

### Free Image Sources:
- **Unsplash**: https://unsplash.com/ (Copy image URL)
- **Pexels**: https://pexels.com/ (Copy image URL)
- **Pixabay**: https://pixabay.com/

### How to Get Image URL:
1. Go to Unsplash/Pexels
2. Search for your product (e.g., "headphones")
3. Click on image
4. Right-click → "Copy Image Address"
5. Paste in the "Image URL" field

---

## Important Notes

⚠️ **Admin API Must Be Running**: The admin panel needs the API server (`npm run admin-api`) to save changes. Without it, you can still browse products but can't add/edit/delete.

💡 **Changes Are Permanent**: All changes you make in the admin panel are saved to `public/products.json` and will be there even after restart!

🔒 **Security**: Currently there's no password protection. In production, you should add authentication!

---

## Troubleshooting

**Problem**: Can't save products / "Failed to save product" error
**Solution**: Make sure the admin API server is running (`npm run admin-api`)

**Problem**: Images not showing
**Solution**: Check if the image URL is valid and publicly accessible

**Problem**: Changes not appearing
**Solution**: Refresh the page after saving

---

## Production Deployment

For production, you'll need to:
1. Add authentication to the admin panel
2. Deploy the admin API as a serverless function
3. Use environment variables to secure the admin route

See `DEPLOYMENT_PRODUCTION.md` for detailed instructions.

---

Happy Managing! 🚀
