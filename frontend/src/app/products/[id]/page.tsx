type Props = { params: { id: string } };

export default function ProductPage({ params }: Props){
  return (
    <div>
      <h1>Ficha de producto</h1>
      <p>ID: {params.id}</p>
      <p>Este es un placeholder para la vista de detalle.</p>
    </div>
  );
}
