# 🔒 Admin Authentication Guide

## Password Protection

Your admin dashboard is now **password protected**! 

### Admin Password: `12345`

---

## How to Access Admin Panel

### Method 1: Click Admin Button
1. Go to your store: `http://localhost:5173`
2. Click the **"Admin"** button in the header
3. Enter password: **12345**
4. Click **"Access Admin Panel"**
5. You're in! 🎉

### Method 2: Direct URL
1. Go directly to: `http://localhost:5173/admin`
2. Enter password: **12345**
3. Click **"Access Admin Panel"**
4. You're in! 🎉

---

## Security Features

✅ **Password Required**: Can't access admin without password
✅ **Session-Based**: Login persists only for current browser session
✅ **Auto Logout**: Closes when you close the browser
✅ **Protected Route**: `/admin` URL requires authentication
✅ **Manual Logout**: "Logout" button to end session anytime

---

## Important Notes

### 🔒 Security
- Password is required every time you open a new browser session
- Normal users can't access admin panel without password
- Only users who know the password can manage products

### 💡 Changing Password
To change the admin password:
1. Open `src/components/AdminLogin.tsx`
2. Find line: `const ADMIN_PASSWORD = '12345';`
3. Change `'12345'` to your new password
4. Save the file
5. Done! New password is active

### 🚪 Logging Out
Two ways to logout:
1. Click the **"🔒 Logout"** button in admin dashboard
2. Close your browser (automatically logs out)

---

## Using the Admin Panel

Once logged in, you can:
- ✅ Add new products
- ✅ Edit existing products
- ✅ Delete products
- ✅ Upload product images
- ✅ Manage descriptions and features

All changes are saved permanently to `products.json`!

---

## Troubleshooting

**Problem**: "Incorrect password" error
- **Solution**: Make sure you're entering: `12345` (all numbers)

**Problem**: Still asking for password after login
- **Solution**: Make sure cookies/sessionStorage is enabled in your browser

**Problem**: Can't remember password
- **Solution**: Check `src/components/AdminLogin.tsx` file for current password

---

## For Production

⚠️ **Important**: Before deploying to production:
1. **Change the password** to something strong (not `12345`)
2. Consider using environment variables for password
3. Add more robust authentication (JWT tokens, database users, etc.)
4. Enable HTTPS for secure password transmission

---

## Quick Reference

**Default Password**: `12345`
**Admin URL**: `/admin`
**Password File**: `src/components/AdminLogin.tsx`
**Session Type**: Browser session (cleared when browser closes)

---

**Your admin dashboard is now secure! 🔒**
