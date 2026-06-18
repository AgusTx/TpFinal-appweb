export default function CartPage(){
  const sample = [
    { id: 'sample-1', name: 'Sample Product A', price: 10 },
    { id: 'sample-2', name: 'Sample Product B', price: 20 }
  ];

  const total = sample.reduce((s, p) => s + p.price, 0);

  return (
    <div style={{maxWidth:720}}>
      <h1>Carrito</h1>
      <ul>
        {sample.map(p => (
          <li key={p.id} style={{marginBottom:8}}>{p.name} - ${p.price}</li>
        ))}
      </ul>
      <p>Total: ${total}</p>

      <h2>Datos de envío (placeholder)</h2>
      <form>
        <div style={{marginBottom:8}}>
          <label style={{display:'block', marginBottom:4}}>Dirección</label>
          <input name="address" style={{width:'100%', padding:8}} />
        </div>
        <div style={{marginBottom:8}}>
          <label style={{display:'block', marginBottom:4}}>Teléfono</label>
          <input name="phone" style={{width:'100%', padding:8}} />
        </div>
        <button type="submit" style={{padding:'8px 16px'}}>Finalizar compra (placeholder)</button>
      </form>
    </div>
  );
}
