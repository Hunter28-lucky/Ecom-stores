import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const productsPath = path.join(__dirname, '../public/products.json');

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const data = await fs.readFile(productsPath, 'utf-8');
    const products = JSON.parse(data);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read products' });
  }
});

// Add new product
app.post('/api/products', async (req, res) => {
  try {
    const data = await fs.readFile(productsPath, 'utf-8');
    const products = JSON.parse(data);
    
    const newProduct = {
      id: Date.now().toString(),
      ...req.body
    };
    
    products.push(newProduct);
    await fs.writeFile(productsPath, JSON.stringify(products, null, 2));
    
    res.json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const data = await fs.readFile(productsPath, 'utf-8');
    const products = JSON.parse(data);
    
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    products[index] = { ...products[index], ...req.body, id: req.params.id };
    await fs.writeFile(productsPath, JSON.stringify(products, null, 2));
    
    res.json({ success: true, product: products[index] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const data = await fs.readFile(productsPath, 'utf-8');
    let products = JSON.parse(data);
    
    products = products.filter(p => p.id !== req.params.id);
    await fs.writeFile(productsPath, JSON.stringify(products, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Admin API running on http://localhost:${PORT}`);
});
