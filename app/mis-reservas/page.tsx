import { redirect } from "next/navigation";
import CancelBookingButton from "@/components/CancelBookingButton";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const dayLabels = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default async function MisReservasPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (memberError || !member) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-[2px] border border-[var(--border)] bg-[var(--surface)] p-6">
          <h1 className="text-2xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.16em] text-[var(--text-primary)]">
            Mis reservas
          </h1>
          <p className="mt-4 text-[var(--text-secondary)]">
            No pudimos asociar tu usuario con un perfil de socio.
          </p>
        </div>
      </main>
    );
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(
      "id, booking_date, status, created_at, classes(name, day_of_week, start_time)",
    )
    .eq("member_id", member.id)
    .order("booking_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (bookingsError) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-[2px] border border-[var(--border)] bg-[var(--surface)] p-6">
          <h1 className="text-2xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.16em] text-[var(--text-primary)]">
            Mis reservas
          </h1>
          <p className="mt-4 text-[var(--text-secondary)]">
            Error al cargar tus reservas: {bookingsError.message}
          </p>
        </div>
      </main>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = (bookings ?? []).filter((booking) => {
    const bookingDate = new Date(`${booking.booking_date}T00:00:00`);
    return bookingDate >= today && booking.status === "confirmada";
  });

  const historyBookings = (bookings ?? []).filter((booking) => {
    const bookingDate = new Date(`${booking.booking_date}T00:00:00`);
    return bookingDate < today || booking.status !== "confirmada";
  });

  function renderTable(rows: typeof bookings) {
    return (
      <table className="min-w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr className="bg-[var(--background)] text-[var(--text-primary)]">
            <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
              Fecha
            </th>
            <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
              Clase
            </th>
            <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
              Horario
            </th>
            <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
              Estado
            </th>
            <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
              Acción
            </th>
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((booking) => {
            const classInfo = booking.classes as {
              name?: string;
              day_of_week?: number;
              start_time?: string;
            } | null;
            const bookingDate = new Date(`${booking.booking_date}T00:00:00`);
            const isFuture = bookingDate >= today;
            const dayText = classInfo?.day_of_week != null ? dayLabels[classInfo.day_of_week] : "-";

            return (
              <tr key={booking.id} className="align-top">
                <td className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--text-primary)]">
                  {booking.booking_date}
                </td>
                <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-primary)]">
                  {classInfo?.name ?? "-"}
                </td>
                <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                  {dayText} · {classInfo?.start_time ?? "-"}
                </td>
                <td className="border-b border-[var(--border)] px-3 py-3">
                  <span className="border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-bold uppercase tracking-wide text-[var(--text-primary)]">
                    {booking.status}
                  </span>
                </td>
                <td className="border-b border-[var(--border)] px-3 py-3">
                  {isFuture && booking.status === "confirmada" ? (
                    <CancelBookingButton bookingId={booking.id} />
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-5xl rounded-[2px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        <h1 className="text-2xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.16em] text-[var(--text-primary)]">
          Mis reservas
        </h1>

        <div className="mt-6 space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em] text-[var(--text-primary)]">
              Próximas
            </h2>
            <div className="overflow-x-auto">{renderTable(upcomingBookings)}</div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em] text-[var(--text-primary)]">
              Historial
            </h2>
            <div className="overflow-x-auto">{renderTable(historyBookings)}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
