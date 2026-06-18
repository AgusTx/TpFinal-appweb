export default function RegisterPage(){
  return (
    <div style={{maxWidth:520}}>
      <h1>Registro</h1>
      <form>
        <div style={{marginBottom:12}}>
          <label style={{display:'block', marginBottom:4}}>Nombre</label>
          <input name="name" type="text" placeholder="Tu nombre" style={{width:'100%', padding:8}} required />
        </div>
        <div style={{marginBottom:12}}>
          <label style={{display:'block', marginBottom:4}}>Email</label>
          <input name="email" type="email" placeholder="tu@ejemplo.com" style={{width:'100%', padding:8}} required />
        </div>
        <div style={{marginBottom:12}}>
          <label style={{display:'block', marginBottom:4}}>Contraseña</label>
          <input name="password" type="password" placeholder="********" style={{width:'100%', padding:8}} required />
        </div>
        <button type="submit" style={{padding:'8px 16px'}}>Crear cuenta</button>
      </form>
    </div>
  );
}
