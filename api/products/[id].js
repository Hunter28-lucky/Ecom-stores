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
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:5173'}/products.json`);
    const products = await response.json();

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

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
