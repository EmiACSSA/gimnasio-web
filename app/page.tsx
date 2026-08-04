export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <h1>Mi Gimnasio</h1>
        <div style={{ marginTop: 16 }}>
          <a href="/login" style={{ marginRight: 12 }}>
            Iniciar sesión
          </a>
          <a href="/signup">Registrarme</a>
        </div>
      </div>
    </main>
  );
}
