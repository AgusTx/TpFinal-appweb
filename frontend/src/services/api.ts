export const apiBase = process.env.API_URL || 'http://localhost:4000';

export async function fetchProducts(filters: { q?: string; category?: string; minPrice?: number; maxPrice?: number } = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (typeof filters.minPrice === 'number') params.set('minPrice', String(filters.minPrice));
  if (typeof filters.maxPrice === 'number') params.set('maxPrice', String(filters.maxPrice));

  const url = `${apiBase}/products${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${apiBase}/categories`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch categories');
  }
  return res.json();
}

export async function fetchProductById(id: string) {
  const res = await fetch(`${apiBase}/products/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch product');
  }
  return res.json();
}

export async function createProduct(product: { name: string; price: number; category: string }) {
  const res = await fetch(`${apiBase}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });

  if (!res.ok) {
    throw new Error('Failed to create product');
  }

  return res.json();
}

export async function updateProduct(id: string, product: { name: string; price: number; category: string }) {
  const res = await fetch(`${apiBase}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });

  if (!res.ok) {
    throw new Error('Failed to update product');
  }

  return res.json();
}
