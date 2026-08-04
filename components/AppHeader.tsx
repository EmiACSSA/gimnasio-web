import Image from "next/image";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function AppHeader() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Next Level - Centro de Entrenamiento"
            width={140}
            height={48}
            className="h-10 w-auto"
          />
        </Link>

        {user ? (
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <span className="font-[family-name:var(--font-sans)]">{user.email}</span>
            <LogoutButton />
          </div>
        ) : null}
      </div>
    </header>
  );
}
