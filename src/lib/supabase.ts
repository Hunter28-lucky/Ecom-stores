import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. CMS features will be disabled.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  original_price?: number;
  category_id?: string;
  rating: number;
  review_count: number;
  stock_status: 'in_stock' | 'out_of_stock' | 'pre_order';
  featured: boolean;
  active: boolean;
  images: string[];
  features: string[];
  specifications?: Record<string, any>;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  verified: boolean;
  helpful_count: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_mobile: string;
  customer_email?: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_data?: any;
  items: any[];
  created_at: string;
}
