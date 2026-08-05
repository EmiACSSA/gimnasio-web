"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type LogoutButtonProps = {
  className?: string;
  label?: string;
};

export default function LogoutButton({ className, label = "Logout" }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={
        className ??
        "rounded-[2px] border border-[var(--border)] bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      }
    >
      {label}
    </button>
  );
}
