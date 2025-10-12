# Favicon Generation Instructions

The `favicon.svg` file contains the source design for all favicon sizes.

## Option 1: Online Conversion (Easiest)
1. Go to https://realfavicongenerator.net/
2. Upload `public/favicon.svg`
3. Generate all sizes
4. Download and extract to `public/` folder

## Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick if not installed
brew install imagemagick  # macOS
# sudo apt-get install imagemagick  # Linux

# Navigate to public folder
cd public

# Generate all sizes
convert favicon.svg -resize 16x16 favicon-16x16.png
convert favicon.svg -resize 32x32 favicon-32x32.png
convert favicon.svg -resize 180x180 apple-touch-icon.png
convert favicon.svg -resize 192x192 android-chrome-192x192.png
convert favicon.svg -resize 512x512 android-chrome-512x512.png
convert favicon.svg -resize 32x32 favicon.ico
```

## Required Files
After generation, your `public/` folder should contain:
- ✅ favicon.svg (source)
- ✅ favicon.ico (32x32)
- ✅ favicon-16x16.png
- ✅ favicon-32x32.png
- ✅ apple-touch-icon.png (180x180)
- ✅ android-chrome-192x192.png
- ✅ android-chrome-512x512.png
- ✅ site.webmanifest
- ✅ robots.txt
- ✅ sitemap.xml

## Quick Test
After generation, restart dev server:
```bash
npm run dev
```

Visit http://localhost:5173/ and check:
- Browser tab shows favicon
- No 404 errors in console for favicon files
