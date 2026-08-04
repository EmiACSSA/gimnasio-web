"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";

const supabase = createClient();

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const redirectTo = `${window.location.origin}/actualizar-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setMessage(translateAuthError(error.message));
    } else {
      setMessage("Si el correo está registrado, te enviamos un link para restablecer tu contraseña.");
    }

    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-[420px] rounded-[2px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="mb-6 text-center text-2xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.16em] text-[var(--text-primary)]">
          Recuperar contraseña
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-[var(--text-secondary)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-[2px] px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--accent)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c5312b]"
          >
            {isSubmitting ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <div className="mt-4 text-sm text-[var(--text-secondary)]">
          <Link href="/login" className="transition hover:text-[var(--text-primary)]">
            Volver al login
          </Link>
        </div>

        {message ? <p className="mt-4 text-sm text-[var(--text-secondary)]">{message}</p> : null}
      </div>
    </main>
  );
}
