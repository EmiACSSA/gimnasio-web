import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppHeaderNav from "@/components/AppHeaderNav";

export default async function AppHeader() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;

  if (user) {
    const { data: member } = await supabase
      .from("members")
      .select("role")
      .eq("auth_id", user.id)
      .maybeSingle();

    isAdmin = member?.role === "administrador";
  }

  return <AppHeaderNav userEmail={user?.email ?? null} isAdmin={isAdmin} />;
}
