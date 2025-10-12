import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ProductCatalog } from './components/ProductCatalog.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProductCatalog />
  </StrictMode>
);
