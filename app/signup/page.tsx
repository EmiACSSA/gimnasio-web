"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isValidEmail, isValidPhone, sanitizeFullName, translateAuthError } from "@/lib/auth-errors";

const supabase = createClient();

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const cleanedFullName = sanitizeFullName(fullName);
    const cleanedPhone = phone.trim().replace(/[<>]/g, "");

    if (!cleanedFullName || cleanedFullName.length < 2) {
      setMessage("Ingresá un nombre válido.");
      setIsSubmitting(false);
      return;
    }

    if (!isValidEmail(email)) {
      setMessage("Ingresá un email válido.");
      setIsSubmitting(false);
      return;
    }

    if (!isValidPhone(cleanedPhone)) {
      setMessage("Ingresá un teléfono válido.");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: cleanedFullName,
          phone: cleanedPhone,
        },
      },
    });

    if (error) {
      setMessage(translateAuthError(error.message));
    } else if (data.user?.identities?.length === 0) {
      setMessage("Este usuario ya existe o no pudo confirmarse.");
    } else {
      setMessage("Registro enviado. Revisa tu correo para confirmar la cuenta.");
    }

    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-[420px] rounded-[2px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png"
            alt="Next Level - Centro de Entrenamiento"
            width={180}
            height={48}
            className="h-10 w-auto"
          />
        </div>

        <h1 className="mb-6 text-center text-2xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.16em] text-[var(--text-primary)]">
          Registrarme
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="mb-2 block text-sm text-[var(--text-secondary)]">
              Nombre completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className="w-full rounded-[2px] px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm text-[var(--text-secondary)]">
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              className="w-full rounded-[2px] px-3 py-2"
            />
          </div>

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

          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-[var(--text-secondary)]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-[2px] px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--accent)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c5312b]"
          >
            {isSubmitting ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-[var(--text-secondary)]">{message}</p> : null}
      </div>
    </main>
  );
}
