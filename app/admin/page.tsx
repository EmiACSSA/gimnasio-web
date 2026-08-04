import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AdminPanelNav from "@/components/AdminPanelNav";

export default async function AdminPage() {
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

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoString = thirtyDaysAgo.toISOString().slice(0, 10);

  const { data: todayBookings, error: todayBookingsError } = await supabase
    .from("bookings")
    .select("id, class_id, classes(name)")
    .eq("booking_date", today)
    .eq("status", "confirmada");

  if (todayBookingsError) {
    throw todayBookingsError;
  }

  const { count: activeMembersCount, error: activeMembersError } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("role", "socio");

  if (activeMembersError) {
    throw activeMembersError;
  }

  const { data: popularBookings, error: popularBookingsError } = await supabase
    .from("bookings")
    .select("class_id, classes(name)")
    .eq("status", "confirmada")
    .gte("booking_date", thirtyDaysAgoString)
    .lte("booking_date", today);

  if (popularBookingsError) {
    throw popularBookingsError;
  }

  const { data: noShowBookings, error: noShowBookingsError } = await supabase
    .from("bookings")
    .select("id")
    .eq("status", "confirmada")
    .gte("booking_date", thirtyDaysAgoString)
    .lt("booking_date", today);

  if (noShowBookingsError) {
    throw noShowBookingsError;
  }

  const bookingsByClass = (todayBookings ?? []).reduce<Record<string, number>>((accumulator, booking) => {
    const className = (booking.classes as { name?: string } | null)?.name ?? "Sin clase";
    accumulator[className] = (accumulator[className] ?? 0) + 1;
    return accumulator;
  }, {});

  const mostPopularClass = (popularBookings ?? []).reduce<Record<string, number>>((accumulator, booking) => {
    const className = (booking.classes as { name?: string } | null)?.name ?? "Sin clase";
    accumulator[className] = (accumulator[className] ?? 0) + 1;
    return accumulator;
  }, {});

  const popularClassEntry = Object.entries(mostPopularClass).sort((left, right) => right[1] - left[1])[0];
  const classSummaryEntries = Object.entries(bookingsByClass);

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-6xl rounded-[2px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        <AdminPanelNav />

        <div className="mt-6">
          <h1 className="text-2xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.16em] text-[var(--text-primary)]">
            Dashboard del panel
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Resumen operativo del club y del estado de reservas.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[2px] border border-[var(--border)] bg-[var(--background)] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">Reservas confirmadas hoy</p>
            <p className="mt-2 text-2xl font-[family-name:var(--font-poppins)] text-[var(--text-primary)]">{Object.values(bookingsByClass).reduce((sum, value) => sum + value, 0)}</p>
            <div className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
              {classSummaryEntries.length === 0 ? (
                <p>No hay reservas confirmadas hoy.</p>
              ) : (
                classSummaryEntries.map(([className, count]) => (
                  <p key={className}>
                    {className}: {count}
                  </p>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2px] border border-[var(--border)] bg-[var(--background)] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">Socios activos</p>
            <p className="mt-2 text-2xl font-[family-name:var(--font-poppins)] text-[var(--text-primary)]">{activeMembersCount ?? 0}</p>
          </div>

          <div className="rounded-[2px] border border-[var(--border)] bg-[var(--background)] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">Clase más popular</p>
            <p className="mt-2 text-2xl font-[family-name:var(--font-poppins)] text-[var(--text-primary)]">
              {popularClassEntry ? popularClassEntry[0] : "-"}
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {popularClassEntry ? `${popularClassEntry[1]} reservas` : "Sin datos"}
            </p>
          </div>

          <div className="rounded-[2px] border border-[var(--border)] bg-[var(--background)] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">Inasistencias últimos 30 días</p>
            <p className="mt-2 text-2xl font-[family-name:var(--font-poppins)] text-[var(--text-primary)]">{noShowBookings?.length ?? 0}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
