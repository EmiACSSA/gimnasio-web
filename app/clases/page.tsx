import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ReserveClassButton from "@/components/ReserveClassButton";

const dayLabels = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function getNextDateForDay(dayOfWeek: number) {
  const today = new Date();
  const currentDay = today.getDay();
  const offset = (dayOfWeek - currentDay + 7) % 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + (offset === 0 ? 7 : offset));
  nextDate.setHours(0, 0, 0, 0);
  return nextDate.toISOString().slice(0, 10);
}

export default async function ClasesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("*")
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (classesError) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Clases</h1>
        <p>Error al cargar las clases: {classesError.message}</p>
      </main>
    );
  }

  const classesWithAvailability = await Promise.all(
    (classes ?? []).map(async (item) => {
      const bookingDate = getNextDateForDay(item.day_of_week);
      const { count, error: bookingsError } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("class_id", item.id)
        .eq("booking_date", bookingDate)
        .eq("status", "confirmada");

      return {
        ...item,
        bookingDate,
        available: bookingsError
          ? null
          : Math.max(item.capacity - (count ?? 0), 0),
        availabilityError: bookingsError?.message ?? null,
      };
    }),
  );

  const grouped = classesWithAvailability.reduce<Record<number, typeof classesWithAvailability>>(
    (acc, item) => {
      acc[item.day_of_week] = acc[item.day_of_week] ?? [];
      acc[item.day_of_week].push(item);
      return acc;
    },
    {},
  );

  return (
    <main style={{ padding: 24 }}>
      <h1>Clases</h1>
      <p>Usuario autenticado: {user.email}</p>

      {Object.keys(grouped).map((dayKey) => {
        const dayNumber = Number(dayKey);
        const classesForDay = grouped[dayNumber] ?? [];

        return (
          <section key={dayKey} style={{ marginTop: 24 }}>
            <h2>{dayLabels[dayNumber]}</h2>

            {classesForDay.map((item) => (
              <div
                key={item.id}
                style={{ marginTop: 12, border: "1px solid #ccc", padding: 12 }}
              >
                <p>
                  <strong>{item.name}</strong>
                </p>
                <p>
                  Horario: {item.start_time} · Duración: {item.duration_minutes} min
                </p>
                <p>
                  Cupo disponible: {item.available ?? "No disponible"}
                </p>
                {item.availabilityError ? (
                  <p>Error al calcular cupo: {item.availabilityError}</p>
                ) : null}
                <ReserveClassButton
                  classId={item.id}
                  className={item.name}
                  bookingDate={item.bookingDate}
                />
              </div>
            ))}
          </section>
        );
      })}
    </main>
  );
}
