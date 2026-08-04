import Link from "next/link";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/admin/socios", label: "Socios" },
  { href: "/admin/clases", label: "Clases" },
];

export default function AdminPanelNav() {
  return (
    <nav className="flex flex-wrap gap-2 rounded-[2px] border border-[var(--border)] bg-[var(--background)] p-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-[2px] px-3 py-2 text-sm font-bold uppercase tracking-wide text-[var(--text-secondary)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
