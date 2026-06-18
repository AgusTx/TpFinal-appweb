import Header from '../components/Header';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main style={{padding:16}}>{children}</main>
      </body>
    </html>
  );
}
