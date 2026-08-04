"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
            full_name: fullName,
            phone_number: phone,
},
      },
    });

    if (error) {
      setMessage(error.message);
    } else if (data.user?.identities?.length === 0) {
      setMessage("Este usuario ya existe o no pudo confirmarse.");
    } else {
      setMessage("Registro enviado. Revisa tu correo para confirmar la cuenta.");
    }

    setIsSubmitting(false);
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Signup</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="fullName">Nombre completo</label>
          <br />
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label htmlFor="phone">Teléfono</label>
          <br />
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label htmlFor="password">Password</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={isSubmitting} style={{ marginTop: 16 }}>
          {isSubmitting ? "Registrando..." : "Registrarse"}
        </button>
      </form>

      {message ? <p>{message}</p> : null}
    </main>
  );
}
