type Props = { params: { id: string } };

export default async function ProductPage({ params }: Props){
  const { id } = await params;

  return (
    <div>
      <h1>Ficha de producto</h1>
      <p>ID: {id}</p>
      <p>Este es un placeholder para la vista de detalle.</p>
    </div>
  );
}
