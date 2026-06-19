'use client';

import { useEffect, useMemo, useState } from 'react';
import { createProduct, fetchProducts } from '../../services/api';
import Link from 'next/link';

const categories = ['accesorios', 'pantallas', 'audio'];

export default function ProductsClient() {
  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number; category: string }>>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [form, setForm] = useState({ name: '', price: '', category: categories[0] });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const filters = useMemo(() => ({
    q: q || undefined,
    category: category || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  }), [q, category, minPrice, maxPrice]);

  useEffect(() => {
    async function load() {
      try {
        setError('');
        const result = await fetchProducts(filters);
        setProducts(result);
      } catch (err) {
        setError('No se pudieron cargar los productos.');
      }
    }

    load();
  }, [filters]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setStatus('Creando producto...');

    const price = Number(form.price);
    if (!form.name || !form.category || Number.isNaN(price) || price <= 0) {
      setError('Completa nombre, categoría y precio válido.');
      setStatus('');
      return;
    }

    try {
      const newProduct = await createProduct({
        name: form.name,
        price,
        category: form.category,
      });
      setProducts((current) => [newProduct, ...current]);
      setForm({ name: '', price: '', category: categories[0] });
      setStatus('Producto creado correctamente.');
    } catch (err) {
      setError('No se pudo crear el producto.');
    } finally {
      setTimeout(() => setStatus(''), 2500);
    }
  }

  return (
    <div className="card">
      <h1 className="page-title">Listado de productos</h1>

      <section style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar por nombre o categoría"
            style={{ padding: 12, borderRadius: 12, border: '1px solid #cbd5e1', width: '100%' }}
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            style={{ padding: 12, borderRadius: 12, border: '1px solid #cbd5e1' }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
          <input
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="Precio mínimo"
            type="number"
            style={{ padding: 12, borderRadius: 12, border: '1px solid #cbd5e1' }}
          />
          <input
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Precio máximo"
            type="number"
            style={{ padding: 12, borderRadius: 12, border: '1px solid #cbd5e1' }}
          />
        </div>
      </section>

      {error && <div style={{ color: '#b91c1c', marginBottom: 18 }}>{error}</div>}
      {status && <div style={{ color: '#0f766e', marginBottom: 18 }}>{status}</div>}

      <ul className="product-list">
        {products.map((product) => (
          <li key={product.id} className="product-item">
            <h2>{product.name}</h2>
            <p>Categoría: {product.category}</p>
            <p>Precio: ${product.price}</p>
            <Link href={`/products/${product.id}`}>Ver detalle</Link>
          </li>
        ))}
      </ul>

      <section className="card" style={{ marginTop: 32 }}>
        <h2>Agregar nuevo producto</h2>
        <form onSubmit={handleCreate} style={{ display: 'grid', gap: 14, marginTop: 16 }}>
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Nombre del producto"
            style={{ padding: 12, borderRadius: 12, border: '1px solid #cbd5e1' }}
          />
          <input
            value={form.price}
            onChange={(event) => setForm({ ...form, price: event.target.value })}
            placeholder="Precio"
            type="number"
            style={{ padding: 12, borderRadius: 12, border: '1px solid #cbd5e1' }}
          />
          <select
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            style={{ padding: 12, borderRadius: 12, border: '1px solid #cbd5e1' }}
          >
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <button type="submit" style={{ padding: 12, borderRadius: 12, border: 'none', background: '#0f172a', color: '#fff' }}>
            Crear producto
          </button>
        </form>
      </section>
    </div>
  );
}
