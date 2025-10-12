# Simple JSON-based CMS

Your e-commerce site now uses a **simple JSON file** to manage products - no database needed!

## How to Add/Edit Products

1. **Edit the products file**: Open `public/products.json`

2. **Product Structure**: Each product has these fields:
   ```json
   {
     "id": "unique-id",
     "name": "Product Name",
     "price": 2999,
     "image": "https://your-image-url.com/image.jpg",
     "category": "Category Name",
     "rating": 4.5,
     "reviews": 128,
     "description": "Product description text",
     "features": [
       "Feature 1",
       "Feature 2",
       "Feature 3"
     ]
   }
   ```

3. **Add a new product**: Copy an existing product object, change the values, and add it to the array.

4. **Image URLs**: You can use:
   - **Unsplash**: `https://images.unsplash.com/photo-[ID]?w=500`
   - **Pexels**: `https://images.pexels.com/photos/[ID]/pexels-photo-[ID].jpeg?w=500`
   - **Your own hosted images**: Any public image URL
   - **Imgur**: Upload to imgur.com and use the direct link

5. **Save and reload**: After editing `products.json`, just refresh your website!

## Example: Adding a New Product

```json
{
  "id": "7",
  "name": "Laptop Stand Aluminum",
  "price": 1499,
  "image": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500",
  "category": "Accessories",
  "rating": 4.6,
  "reviews": 89,
  "description": "Ergonomic laptop stand made from premium aluminum. Adjustable height and angle.",
  "features": [
    "Premium aluminum build",
    "Adjustable height",
    "Cable management",
    "Universal compatibility"
  ]
}
```

## Finding Free Product Images

- **Unsplash**: https://unsplash.com/ (Free high-quality images)
- **Pexels**: https://www.pexels.com/ (Free stock photos)
- **Pixabay**: https://pixabay.com/ (Free images and videos)

## Tips

- Keep product IDs unique (use numbers: "1", "2", "3", etc.)
- Use high-quality images (at least 500x500px)
- Write clear, engaging descriptions
- Add 3-5 features per product
- Keep prices in whole numbers (no decimals)

That's it! No coding, no database - just edit JSON and refresh! 🎉
