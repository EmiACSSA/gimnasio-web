import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

type AdminPageProps = {
  searchParams?: Promise<{
    date?: string;
    status?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
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
      <main style={{ padding: 24 }}>
        <h1>Administración</h1>
        <p>Error al cargar las reservas: {bookingsError.message}</p>
      </main>
    );
  }

  const filteredBookings = (bookings ?? []).filter((booking) => {
    const matchesDate = selectedDate ? booking.booking_date === selectedDate : true;
    const matchesStatus =
      selectedStatus === "todas" ? true : booking.status === selectedStatus;

    return matchesDate && matchesStatus;
  });

  return (
    <main style={{ padding: 24 }}>
      <h1>Administración de reservas</h1>

      <form method="get" style={{ marginTop: 16 }}>
        <div>
          <label htmlFor="date">Filtrar por fecha</label>
          <br />
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={selectedDate}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label htmlFor="status">Filtrar por estado</label>
          <br />
          <select id="status" name="status" defaultValue={selectedStatus}>
            <option value="todas">Todas</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
            <option value="asistio">Asistió</option>
          </select>
        </div>

        <button type="submit" style={{ marginTop: 16 }}>
          Aplicar filtros
        </button>
      </form>

      <table border={1} cellPadding={6} style={{ marginTop: 24 }}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Clase</th>
            <th>Horario</th>
            <th>Socio</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Acción</th>
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

            const dayText = classInfo?.day_of_week != null
              ? dayLabels[classInfo.day_of_week]
              : "-";

            return (
              <tr key={booking.id}>
                <td>{booking.booking_date}</td>
                <td>{classInfo?.name ?? "-"}</td>
                <td>
                  {dayText} · {classInfo?.start_time ?? "-"}
                </td>
                <td>{member?.full_name ?? "-"}</td>
                <td>{member?.phone ?? "-"}</td>
                <td>{booking.status}</td>
                <td>
                  <BookingStatusActions bookingId={booking.id} currentStatus={booking.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
