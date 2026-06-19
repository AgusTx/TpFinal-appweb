import Link from 'next/link';
import { fetchProducts } from '../../services/api';

export default async function ProductsPage(){
  const products = await fetchProducts();

  return (
    <div>
      <h1>Listado de productos</h1>
      <ul>
        {products.map((p: { id: string; name: string; price: number }) => (
          <li key={p.id}>
            <Link href={`/products/${p.id}`}>{p.name} - ${p.price}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
