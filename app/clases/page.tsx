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
      <main className="px-4 py-8">
        <div className="mx-auto max-w-4xl rounded-[2px] border border-[var(--border)] bg-[var(--surface)] p-6">
          <h1 className="text-2xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.16em] text-[var(--text-primary)]">
            Clases
          </h1>
          <p className="mt-3 text-[var(--text-secondary)]">Error al cargar las clases: {classesError.message}</p>
        </div>
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
        available: bookingsError ? null : Math.max(item.capacity - (count ?? 0), 0),
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
    <main className="px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.16em] text-[var(--text-primary)]">
            Clases
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">Usuario autenticado: {user.email}</p>
        </div>

        {dayLabels.map((label, dayNumber) => {
          const classesForDay = grouped[dayNumber] ?? [];

          return (
            <section key={label} className="mb-8">
              <h2 className="mb-4 text-lg font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em] text-[var(--text-primary)]">
                {label}
              </h2>

              {classesForDay.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">No hay clases programadas este día.</p>
              ) : (
                <div className="grid gap-4">
                  {classesForDay.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[2px] border border-[var(--border)] bg-[var(--surface)] p-4"
                    >
                      <div className="border-l-4 border-[var(--accent)] pl-4">
                        <p className="text-lg font-semibold text-[var(--text-primary)]">{item.name}</p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          Horario: {item.start_time} · Duración: {item.duration_minutes} min
                        </p>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-[var(--accent)]">
                              {item.available ?? "No disponible"}
                            </p>
                            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                              Cupo disponible
                            </p>
                          </div>

                          <ReserveClassButton
                            classId={item.id}
                            className={item.name}
                            bookingDate={item.bookingDate}
                            available={item.available ?? 0}
                          />
                        </div>

                        {item.availabilityError ? (
                          <p className="mt-3 text-sm text-[var(--text-secondary)]">
                            Error al calcular cupo: {item.availabilityError}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
