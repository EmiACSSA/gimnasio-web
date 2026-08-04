import Image from "next/image";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let memberName: string | null = null;

  if (user) {
    const { data: member } = await supabase
      .from("members")
      .select("full_name")
      .eq("auth_id", user.id)
      .maybeSingle();

    memberName = member?.full_name ?? user.email ?? null;
  }

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

        {user ? (
          <div className="space-y-4">
            <p className="text-lg text-[var(--text-secondary)]">
              Hola, <span className="font-semibold text-[var(--text-primary)]">{memberName ?? "socio"}</span>.
            </p>
            <div className="flex justify-center">
              <Link
                href="/clases"
                className="inline-flex min-w-[180px] items-center justify-center bg-[var(--accent)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c5312b]"
              >
                Reservar una clase
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex min-w-[160px] items-center justify-center bg-[var(--accent)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c5312b]"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-w-[160px] items-center justify-center border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Registrarme
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
