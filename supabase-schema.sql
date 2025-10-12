-- Supabase Database Schema for E-commerce CMS
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'pre_order')),
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  images JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table (for tracking)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_mobile TEXT NOT NULL,
  customer_email TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  payment_data JSONB,
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Users Table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-update updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public read access for categories, products, and reviews
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (active = true);

CREATE POLICY "Public can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Public can view reviews" ON reviews
  FOR SELECT USING (true);

-- Admin full access (authenticated users with admin role)
CREATE POLICY "Admins can do everything on products" ON products
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admin_users WHERE active = true)
  );

CREATE POLICY "Admins can do everything on categories" ON categories
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admin_users WHERE active = true)
  );

CREATE POLICY "Admins can do everything on reviews" ON reviews
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admin_users WHERE active = true)
  );

CREATE POLICY "Admins can view orders" ON orders
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admin_users WHERE active = true)
  );

-- Insert sample data
INSERT INTO categories (name, slug, description) VALUES
  ('Headphones', 'headphones', 'Premium wireless and wired headphones'),
  ('Earbuds', 'earbuds', 'True wireless earbuds'),
  ('Speakers', 'speakers', 'Bluetooth and smart speakers');

INSERT INTO products (
  name, 
  slug, 
  description, 
  price, 
  original_price, 
  category_id,
  rating,
  review_count,
  featured,
  images,
  features,
  meta_title,
  meta_description
) VALUES (
  'Premium Wireless Headphones',
  'premium-wireless-headphones',
  'Premium Wireless Headphones with Active Noise Cancellation, 40-Hour Battery Life, Premium Sound Quality, Wireless & Bluetooth 5.0. Perfect for music lovers and professionals.',
  199,
  299,
  (SELECT id FROM categories WHERE slug = 'headphones' LIMIT 1),
  4.8,
  2847,
  true,
  '["https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg?auto=compress&cs=tinysrgb&w=800", "https://images.pexels.com/photos/8000544/pexels-photo-8000544.jpeg?auto=compress&cs=tinysrgb&w=800", "https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  '["Active Noise Cancellation", "40-Hour Battery Life", "Premium Sound Quality", "Wireless & Bluetooth 5.0"]'::jsonb,
  'Premium Wireless Headphones - Shop Best Deals Online',
  'Buy Premium Wireless Headphones with Active Noise Cancellation. Shop now and save ₹100.'
);

INSERT INTO reviews (product_id, customer_name, rating, comment, verified) VALUES
  ((SELECT id FROM products WHERE slug = 'premium-wireless-headphones' LIMIT 1), 'Priya Sharma', 5, 'Best headphones I''ve ever owned. The sound quality is absolutely incredible! Perfect for work from home.', true),
  ((SELECT id FROM products WHERE slug = 'premium-wireless-headphones' LIMIT 1), 'Rahul Kumar', 5, 'Worth every penny. The noise cancellation is a game-changer for travel. Delivered within 2 days!', true),
  ((SELECT id FROM products WHERE slug = 'premium-wireless-headphones' LIMIT 1), 'Anjali Patel', 4, 'Great quality and comfortable for long listening sessions. Battery life is amazing.', true);

-- Insert sample admin user (replace with your email)
INSERT INTO admin_users (email, full_name, role) VALUES
  ('admin@example.com', 'Admin User', 'admin');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
