import { supabase, type Product, type Review, type Category } from '../lib/supabase';

// Products API
export const productsApi = {
  // Get all active products
  async getAll(featured?: boolean) {
    let query = supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (featured !== undefined) {
      query = query.eq('featured', featured);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Product[];
  },

  // Get product by slug
  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single();

    if (error) throw error;
    return data as Product;
  },

  // Get product by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Product;
  },

  // Create product (admin only)
  async create(product: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  // Update product (admin only)
  async update(id: string, updates: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  // Delete product (admin only)
  async delete(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Search products
  async search(query: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('featured', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data as Product[];
  },
};

// Reviews API
export const reviewsApi = {
  // Get reviews for a product
  async getByProduct(productId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Review[];
  },

  // Create review
  async create(review: Partial<Review>) {
    const { data, error } = await supabase
      .from('reviews')
      .insert([review])
      .select()
      .single();

    if (error) throw error;
    return data as Review;
  },

  // Update review (admin only)
  async update(id: string, updates: Partial<Review>) {
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Review;
  },

  // Delete review (admin only)
  async delete(id: string) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Categories API
export const categoriesApi = {
  // Get all categories
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as Category[];
  },

  // Get category by slug
  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data as Category;
  },

  // Create category (admin only)
  async create(category: Partial<Category>) {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  // Update category (admin only)
  async update(id: string, updates: Partial<Category>) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  // Delete category (admin only)
  async delete(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Storage API for images
export const storageApi = {
  // Upload image
  async uploadImage(file: File, bucket: string = 'products') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // Delete image
  async deleteImage(url: string, bucket: string = 'products') {
    const filePath = url.split('/').pop();
    if (!filePath) return;

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
  },
};
