import { useState, useEffect } from 'react';
import { productsApi, reviewsApi } from '../services/cms';
import type { Product, Review } from '../lib/supabase';

// Check if Supabase is configured
const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function useProducts(featured?: boolean) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Only try to fetch from Supabase if configured
        if (isSupabaseConfigured) {
          const data = await productsApi.getAll(featured);
          setProducts(data);
        } else {
          // Return empty array if Supabase not configured
          setProducts([]);
        }
        
        setError(null);
      } catch (err) {
        console.warn('CMS not available, using fallback data:', err);
        setProducts([]);
        setError(null); // Don't show error, just use fallback
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [featured]);

  return { products, loading, error };
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const data = await productsApi.getBySlug(slug);
        setProduct(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  return { product, loading, error };
}

export function useReviews(productId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        const data = await reviewsApi.getByProduct(productId);
        setReviews(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  return { reviews, loading, error };
}
