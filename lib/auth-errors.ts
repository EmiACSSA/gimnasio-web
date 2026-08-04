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

export function sanitizeFullName(value: string) {
  return value.trim().replace(/[<>]/g, "").replace(/<script|script>/gi, "").replace(/javascript:/gi, "").replace(/on\w+=/gi, "");
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string) {
  return /^[0-9+()\-\s]{7,20}$/.test(value.trim());
}
