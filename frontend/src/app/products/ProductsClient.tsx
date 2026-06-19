'use client';

import { useEffect, useMemo, useState } from 'react';
import { createProduct, fetchCategories, fetchProducts, updateProduct } from '../../services/api';
import Link from 'next/link';

export default function ProductsClient() {
  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number; category: string }>>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [form, setForm] = useState({ id: '', name: '', price: '', category: '' });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [editMode, setEditMode] = useState(false);

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
        const [result, categoriesResult] = await Promise.all([fetchProducts(filters), fetchCategories()]);
        setProducts(result);
        setCategories(categoriesResult);
        if (!form.category && categoriesResult.length > 0) {
          setForm((current) => ({ ...current, category: categoriesResult[0] }));
        }
      } catch (err) {
        setError('No se pudieron cargar los productos o categorías.');
      }
    }

    load();
  }, [filters]);

  async function handleCreateOrUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setStatus(editMode ? 'Actualizando producto...' : 'Creando producto...');

    const price = Number(form.price);
    if (!form.name || !form.category || Number.isNaN(price) || price <= 0) {
      setError('Completa nombre, categoría y precio válido.');
      setStatus('');
      return;
    }

    try {
      if (editMode && form.id) {
        const updated = await updateProduct(form.id, {
          name: form.name,
          price,
          category: form.category,
        });
        setProducts((current) => current.map((product) => product.id === updated.id ? updated : product));
        setStatus('Producto actualizado correctamente.');
      } else {
        const newProduct = await createProduct({
          name: form.name,
          price,
          category: form.category,
        });
        setProducts((current) => [newProduct, ...current]);
        setStatus('Producto creado correctamente.');
      }

      setForm({ id: '', name: '', price: '', category: categories[0] || '' });
      setEditMode(false);
    } catch (err) {
      setError('No se pudo guardar el producto.');
    } finally {
      setTimeout(() => setStatus(''), 2500);
    }
  }

  function startEdit(product: { id: string; name: string; price: number; category: string }) {
    setForm({ id: product.id, name: product.name, price: String(product.price), category: product.category });
    setEditMode(true);
    setError('');
    setStatus('');
  }

  function resetForm() {
    setForm({ id: '', name: '', price: '', category: categories[0] || '' });
    setEditMode(false);
    setError('');
    setStatus('');
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
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Link href={`/products/${product.id}`}>Ver detalle</Link>
              <button
                type="button"
                onClick={() => startEdit(product)}
                style={{ marginLeft: 'auto', padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff' }}
              >
                Editar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <section className="card" style={{ marginTop: 32 }}>
        <h2>{editMode ? 'Editar producto' : 'Agregar nuevo producto'}</h2>
        <form onSubmit={handleCreateOrUpdate} style={{ display: 'grid', gap: 14, marginTop: 16 }}>
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
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="submit"
              style={{ padding: 12, borderRadius: 12, border: 'none', background: '#0f172a', color: '#fff', flex: 1 }}
            >
              {editMode ? 'Actualizar producto' : 'Crear producto'}
            </button>
            {editMode && (
              <button
                type="button"
                onClick={resetForm}
                style={{ padding: 12, borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', flex: 1 }}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
