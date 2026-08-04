const authErrorMessages: Record<string, string> = {
  "User already registered": "Ese correo ya está registrado.",
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "Email not confirmed": "Todavía no confirmaste tu correo.",
  "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
};

export function translateAuthError(message?: string | null) {
  if (!message) {
    return "Ocurrió un error. Intentá de nuevo.";
  }

  return authErrorMessages[message] ?? "Ocurrió un error. Intentá de nuevo.";
}
