import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AdminPanelNav from "@/components/AdminPanelNav";
import ExportBookingsCsvButton from "@/components/ExportBookingsCsvButton";
import BookingStatusActions from "@/components/BookingStatusActions";

const dayLabels = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

type AdminReservasPageProps = {
  searchParams?: Promise<{
    date?: string;
    status?: string;
  }>;
};

function getStatusClass(status: string) {
  if (status === "confirmada") {
    return "border border-[var(--accent)] bg-[rgba(239,62,54,0.12)] px-2 py-1 text-xs font-bold uppercase tracking-wide text-[var(--accent)]";
  }

  if (status === "cancelada") {
    return "border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]";
  }

  if (status === "asistio") {
    return "border border-[var(--success)] bg-[rgba(76,175,80,0.12)] px-2 py-1 text-xs font-bold uppercase tracking-wide text-[var(--success)]";
  }

  return "border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-bold uppercase tracking-wide text-[var(--text-primary)]";
}

export default async function AdminReservasPage({ searchParams }: AdminReservasPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedDate = resolvedSearchParams.date ?? "";
  const selectedStatus = resolvedSearchParams.status ?? "todas";

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

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(
      "id, booking_date, status, created_at, members(full_name, phone), classes(name, day_of_week, start_time)",
    )
    .order("booking_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (bookingsError) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-[2px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
          <AdminPanelNav />
          <h1 className="mt-6 text-2xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.16em] text-[var(--text-primary)]">
            Administración de reservas
          </h1>
          <p className="mt-3 text-[var(--text-secondary)]">Error al cargar las reservas: {bookingsError.message}</p>
        </div>
      </main>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const normalizedBookings = (bookings ?? []).map((booking) => {
    const member = Array.isArray(booking.members)
      ? (booking.members[0] as { full_name?: string; phone?: string } | null)
      : (booking.members as { full_name?: string; phone?: string } | null);
    const classInfo = Array.isArray(booking.classes)
      ? (booking.classes[0] as { name?: string; day_of_week?: number; start_time?: string } | null)
      : (booking.classes as { name?: string; day_of_week?: number; start_time?: string } | null);

    return {
      ...booking,
      members: member,
      classes: classInfo,
    };
  });

  const filteredBookings = normalizedBookings.filter((booking) => {
    const matchesDate = selectedDate ? booking.booking_date === selectedDate : true;
    const matchesStatus = selectedStatus === "todas" ? true : booking.status === selectedStatus;

    return matchesDate && matchesStatus;
  });

  const exportRows = filteredBookings.map((booking) => ({
    booking_date: booking.booking_date,
    classes: booking.classes as { name?: string; start_time?: string } | null,
    members: booking.members as { full_name?: string; phone?: string } | null,
    status: booking.status,
  }));

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-6xl rounded-[2px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        <AdminPanelNav />

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.16em] text-[var(--text-primary)]">
              Administración de reservas
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Consulta y actualiza el estado de las reservas del club.
            </p>
          </div>

          <ExportBookingsCsvButton bookings={exportRows} />
        </div>

        <form method="get" className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="date" className="mb-2 block text-sm text-[var(--text-secondary)]">
              Filtrar por fecha
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={selectedDate}
              className="w-full rounded-[2px] px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-2 block text-sm text-[var(--text-secondary)]">
              Filtrar por estado
            </label>
            <select
              id="status"
              name="status"
              defaultValue={selectedStatus}
              className="w-full rounded-[2px] px-3 py-2"
            >
              <option value="todas">Todas</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
              <option value="asistio">Asistió</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-[var(--accent)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c5312b]"
            >
              Aplicar filtros
            </button>
          </div>
        </form>

        <div className="mt-6 overflow-x-auto">
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
                  Socio
                </th>
                <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                  Teléfono
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
              {filteredBookings.map((booking) => {
                const member = booking.members as { full_name?: string; phone?: string } | null;
                const classInfo = booking.classes as {
                  name?: string;
                  day_of_week?: number;
                  start_time?: string;
                } | null;

                const dayText = classInfo?.day_of_week != null ? dayLabels[classInfo.day_of_week] : "-";
                const isPastConfirmed = booking.status === "confirmada" && booking.booking_date < today;

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
                    <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-primary)]">
                      {member?.full_name ?? "-"}
                    </td>
                    <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                      {member?.phone ?? "-"}
                    </td>
                    <td className="border-b border-[var(--border)] px-3 py-3">
                      <span className={isPastConfirmed ? "border border-[var(--warning)] bg-[rgba(255,193,7,0.15)] px-2 py-1 text-xs font-bold uppercase tracking-wide text-[var(--warning)]" : getStatusClass(booking.status)}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="border-b border-[var(--border)] px-3 py-3">
                      <BookingStatusActions bookingId={booking.id} currentStatus={booking.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
