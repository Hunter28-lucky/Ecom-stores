export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // In production, we'll fetch from the public products.json
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:5173'}/products.json`);
    const products = await response.json();

    if (req.method === 'GET') {
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      const newProduct = {
        id: Date.now().toString(),
        ...req.body
      };
      products.push(newProduct);
      
      // For now, return success (in production you'd need to write to GitHub API)
      return res.status(200).json({ 
        success: true, 
        product: newProduct,
        message: 'Product added! Note: Changes are temporary. For permanent changes, edit products.json in your repo.' 
      });
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const index = products.findIndex(p => p.id === id);
      
      if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }

      products[index] = { ...products[index], ...req.body, id };
      
      return res.status(200).json({ 
        success: true, 
        product: products[index],
        message: 'Product updated! Note: Changes are temporary. For permanent changes, edit products.json in your repo.'
      });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const filtered = products.filter(p => p.id !== id);
      
      return res.status(200).json({ 
        success: true,
        message: 'Product deleted! Note: Changes are temporary. For permanent changes, edit products.json in your repo.'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
