import Link from 'next/link';

export default function Header(){
  return (
    <header style={{padding:16, borderBottom:'1px solid #e5e7eb', marginBottom:20}}>
      <nav style={{display:'flex', gap:12, alignItems:'center'}}>
        <Link href="/">Hardware of Legends</Link>
        <div style={{flex:1}} />
        <Link href="/products">Productos</Link>
        <Link href="/cart">Carrito</Link>
        <Link href="/auth/login">Login</Link>
        <Link href="/auth/register">Registro</Link>
      </nav>
    </header>
  );
}
