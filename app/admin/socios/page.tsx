import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AdminPanelNav from "@/components/AdminPanelNav";
import MemberRoleTable, { type MemberRecord } from "@/components/MemberRoleTable";

export default async function AdminSociosPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: adminMember, error: adminMemberError } = await supabase
    .from("members")
    .select("role")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (adminMemberError || !adminMember || adminMember.role !== "administrador") {
    redirect("/clases");
  }

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("id, auth_id, full_name, email, phone, role, created_at")
    .order("full_name", { ascending: true });

  if (membersError) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-[2px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
          <AdminPanelNav />
          <h1 className="mt-6 text-2xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.16em] text-[var(--text-primary)]">
            Socios
          </h1>
          <p className="mt-3 text-[var(--text-secondary)]">Error al cargar los socios: {membersError.message}</p>
        </div>
      </main>
    );
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("member_id, booking_date, status")
    .eq("status", "confirmada");

  const today = new Date().toISOString().slice(0, 10);

  const noShowCounts = (bookings ?? []).reduce<Record<number, number>>((accumulator, booking) => {
    const bookingDate = booking.booking_date;
    if (bookingDate < today && typeof booking.member_id === "number") {
      accumulator[booking.member_id] = (accumulator[booking.member_id] ?? 0) + 1;
    }
    return accumulator;
  }, {});

  const serializedMembers = (members ?? []).map((member) => ({
    ...member,
    inasistencias: noShowCounts[member.id] ?? 0,
  }));

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-6xl rounded-[2px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        <AdminPanelNav />

        <div className="mt-6">
          <h1 className="text-2xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.16em] text-[var(--text-primary)]">
            Gestión de socios
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Buscá por nombre o email y modificá el rol de cada socio.
          </p>
        </div>

        <MemberRoleTable members={serializedMembers as MemberRecord[]} currentUserId={user.id} />
      </div>
    </main>
  );
}
