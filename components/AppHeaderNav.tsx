"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import LogoutButton from "@/components/LogoutButton";

type AppHeaderNavProps = {
  userEmail?: string | null;
  isAdmin?: boolean;
};

export default function AppHeaderNav({ userEmail, isAdmin = false }: AppHeaderNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const desktopLinks = [
    { href: "/clases", label: "Clases" },
    { href: "/mis-reservas", label: "Mis reservas" },
  ];

  const mobileLinks = [
    { href: "/clases", label: "Clases" },
    { href: "/mis-reservas", label: "Mis reservas" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Next Level - Centro de Entrenamiento"
            width={140}
            height={48}
            className="h-10 w-auto"
          />
        </Link>

        {userEmail ? (
          <>
            <nav className="hidden items-center justify-end gap-3 text-sm text-[var(--text-secondary)] sm:flex">
              {desktopLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition hover:text-[var(--text-primary)]"
                >
                  {link.label}
                </Link>
              ))}

              {isAdmin ? (
                <Link href="/admin" className="transition hover:text-[var(--text-primary)]">
                  Admin
                </Link>
              ) : null}

              <span className="max-w-[180px] truncate font-[family-name:var(--font-sans)] text-[var(--text-primary)]">
                {userEmail}
              </span>

              <LogoutButton />
            </nav>

            <button
              type="button"
              aria-label="Abrir menú de navegación"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((current) => !current)}
              className="flex flex-col gap-1.5 rounded-[2px] border border-[var(--border)] p-2 text-[var(--text-primary)] transition hover:border-[var(--accent)] sm:hidden"
            >
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </button>
          </>
        ) : null}
      </div>

      {userEmail ? (
        <div className={`${isMenuOpen ? "block" : "hidden"} border-t border-[var(--border)] bg-[var(--surface)] sm:hidden`}>
          <nav className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-sm">
            {mobileLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-[2px] border border-[var(--border)] px-3 py-3 text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {link.label}
              </Link>
            ))}

            <div className="rounded-[2px] border border-[var(--border)] px-3 py-3 text-[var(--text-secondary)]">
              {userEmail}
            </div>

            <LogoutButton
              label="Cerrar sesión"
              className="rounded-[2px] border border-[var(--border)] bg-transparent px-3 py-3 text-left text-sm font-semibold uppercase tracking-wide text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            />
          </nav>
        </div>
      ) : null}
    </header>
  );
}
