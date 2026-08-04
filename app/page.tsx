import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-8 text-center">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png"
            alt="Next Level - Centro de Entrenamiento"
            width={280}
            height={96}
            className="h-16 w-auto"
          />
        </div>

        <h1 className="mb-8 text-3xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.18em] text-[var(--text-primary)] sm:text-4xl">
          Bienvenido a la comunidad
        </h1>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="/login"
            className="inline-flex min-w-[160px] items-center justify-center bg-[var(--accent)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c5312b]"
          >
            Iniciar sesión
          </a>
          <a
            href="/signup"
            className="inline-flex min-w-[160px] items-center justify-center border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Registrarme
          </a>
        </div>
      </div>
    </main>
  );
}
