import Link from 'next/link';

export default function ProductsPage(){
  const sample = [
    { id: 'sample-1', name: 'Sample Product A' },
    { id: 'sample-2', name: 'Sample Product B' }
  ];

  return (
    <div>
      <h1>Listado de productos</h1>
      <ul>
        {sample.map(p => (
          <li key={p.id}>
            <Link href={`/products/${p.id}`}>{p.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
