import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ClassExceptionManager from "@/components/ClassExceptionManager";
import ClassDeleteButton from "@/components/ClassDeleteButton";

const dayLabels = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

async function requireAdminSession() {
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
    .select("role")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (memberError || !member || member.role !== "administrador") {
    redirect("/clases");
  }

  return supabase;
}

function sanitizeClassName(value: string) {
  return value.trim().replace(/[<>]/g, "").replace(/<script|script>/gi, "").replace(/javascript:/gi, "").replace(/on\w+=/gi, "");
}

async function getClassBookingsCount(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, classId: number) {
  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId);

  if (error) {
    return null;
  }

  return count ?? 0;
}

export async function createClassAction(formData: FormData) {
  "use server";

  const supabase = await requireAdminSession();
  const name = sanitizeClassName(String(formData.get("name") ?? ""));
  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = String(formData.get("start_time") ?? "");
  const durationMinutes = Number(formData.get("duration_minutes"));
  const capacity = Number(formData.get("capacity"));

  if (!name || !/^\d{2}:\d{2}$/.test(startTime) || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 || !Number.isInteger(durationMinutes) || durationMinutes <= 0 || !Number.isInteger(capacity) || capacity <= 0) {
    redirect("/admin/clases?error=Datos%20inv%C3%A1lidos");
  }

  const { error } = await supabase.from("classes").insert([
    {
      name,
      day_of_week: dayOfWeek,
      start_time: startTime,
      duration_minutes: durationMinutes,
      capacity,
    },
  ]);

  if (error) {
    redirect("/admin/clases?error=No%20se%20pudo%20crear%20la%20clase");
  }

  revalidatePath("/admin/clases");
  redirect("/admin/clases?message=Clase%20creada");
}

export async function updateClassAction(formData: FormData) {
  "use server";

  const supabase = await requireAdminSession();
  const id = Number(formData.get("id"));
  const name = sanitizeClassName(String(formData.get("name") ?? ""));
  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = String(formData.get("start_time") ?? "");
  const durationMinutes = Number(formData.get("duration_minutes"));
  const capacity = Number(formData.get("capacity"));

  if (!Number.isInteger(id) || !name || !/^\d{2}:\d{2}$/.test(startTime) || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 || !Number.isInteger(durationMinutes) || durationMinutes <= 0 || !Number.isInteger(capacity) || capacity <= 0) {
    redirect("/admin/clases?error=Datos%20inv%C3%A1lidos");
  }

  const { error } = await supabase
    .from("classes")
    .update({
      name,
      day_of_week: dayOfWeek,
      start_time: startTime,
      duration_minutes: durationMinutes,
      capacity,
    })
    .eq("id", id);

  if (error) {
    redirect("/admin/clases?error=No%20se%20pudo%20actualizar%20la%20clase");
  }

  revalidatePath("/admin/clases");
  redirect("/admin/clases?message=Clase%20actualizada");
}

export async function deleteClassAction(formData: FormData) {
  "use server";

  const supabase = await requireAdminSession();
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id)) {
    redirect("/admin/clases?error=ID%20inv%C3%A1lido");
  }

  const bookingCount = await getClassBookingsCount(supabase, id);

  if (bookingCount === null) {
    redirect("/admin/clases?error=No%20se%20pudo%20validar%20las%20reservas%20asociadas");
  }

  if ((bookingCount ?? 0) > 0) {
    redirect("/admin/clases?error=No%20se%20puede%20eliminar,%20tiene%20reservas%20asociadas");
  }

  const { error } = await supabase.from("classes").delete().eq("id", id);

  if (error) {
    redirect("/admin/clases?error=No%20se%20pudo%20eliminar%20la%20clase");
  }

  revalidatePath("/admin/clases");
  redirect("/admin/clases?message=Clase%20eliminada");
}

export async function createClassExceptionAction(formData: FormData) {
  "use server";

  const supabase = await requireAdminSession();
  const classId = Number(formData.get("class_id"));
  const exceptionDate = String(formData.get("exception_date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!Number.isInteger(classId) || !/^\d{4}-\d{2}-\d{2}$/.test(exceptionDate)) {
    redirect("/admin/clases?error=Datos%20inv%C3%A1lidos%20para%20la%20excepci%C3%B3n");
  }

  const { error } = await supabase.from("class_exceptions").insert([
    {
      class_id: classId,
      exception_date: exceptionDate,
      reason: reason || null,
    },
  ]);

  if (error) {
    redirect("/admin/clases?error=No%20se%20pudo%20crear%20la%20excepci%C3%B3n");
  }

  revalidatePath("/admin/clases");
  redirect("/admin/clases?message=Excepci%C3%B3n%20creada");
}

export async function deleteClassExceptionAction(formData: FormData) {
  "use server";

  const supabase = await requireAdminSession();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/admin/clases?error=ID%20inv%C3%A1lido");
  }

  const { error } = await supabase.from("class_exceptions").delete().eq("id", id);

  if (error) {
    redirect("/admin/clases?error=No%20se%20pudo%20eliminar%20la%20excepci%C3%B3n");
  }

  revalidatePath("/admin/clases");
  redirect("/admin/clases?message=Excepci%C3%B3n%20eliminada");
}

type AdminClassesPageProps = {
  searchParams?: Promise<{
    editId?: string;
    error?: string;
    message?: string;
  }>;
};

export default async function AdminClassesPage({ searchParams }: AdminClassesPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const editId = Number(resolvedSearchParams.editId ?? 0);
  const errorMessage = resolvedSearchParams.error ?? "";
  const successMessage = resolvedSearchParams.message ?? "";

  const supabase = await requireAdminSession();

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name, day_of_week, start_time, duration_minutes, capacity")
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  const { data: classExceptions, error: classExceptionsError } = await supabase
    .from("class_exceptions")
    .select("id, class_id, exception_date, reason, classes(name)")
    .order("exception_date", { ascending: true });

  if (classesError || classExceptionsError) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto max-w-5xl rounded-[2px] border border-[var(--border)] bg-[var(--surface)] p-6">
          <h1 className="text-2xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.16em] text-[var(--text-primary)]">
            Gestión de clases
          </h1>
          <p className="mt-3 text-[var(--text-secondary)]">Error al cargar las clases: {classesError?.message ?? classExceptionsError?.message ?? "No se pudo cargar el listado."}</p>
        </div>
      </main>
    );
  }

  const editingClass = (classes ?? []).find((item) => item.id === editId) ?? null;

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-6xl rounded-[2px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-[family-name:var(--font-poppins)] uppercase tracking-[0.16em] text-[var(--text-primary)]">
              Gestión de clases
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Crear, editar o eliminar clases del programa.
            </p>
          </div>
          <Link href="/admin" className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
            Volver al panel
          </Link>
        </div>

        {errorMessage ? (
          <p className="mb-4 rounded-[2px] border border-[var(--accent)] bg-[rgba(239,62,54,0.12)] px-3 py-2 text-sm text-[var(--text-primary)]">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="mb-4 rounded-[2px] border border-[var(--success)] bg-[rgba(76,175,80,0.12)] px-3 py-2 text-sm text-[var(--text-primary)]">
            {successMessage}
          </p>
        ) : null}

        <form action={editingClass ? updateClassAction : createClassAction} className="mb-8 grid gap-4 rounded-[2px] border border-[var(--border)] bg-[var(--background)] p-4 md:grid-cols-2">
          {editingClass ? <input type="hidden" name="id" value={editingClass.id} /> : null}

          <div>
            <label htmlFor="name" className="mb-2 block text-sm text-[var(--text-secondary)]">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={editingClass?.name ?? ""}
              required
              className="w-full rounded-[2px] px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="day_of_week" className="mb-2 block text-sm text-[var(--text-secondary)]">
              Día
            </label>
            <select
              id="day_of_week"
              name="day_of_week"
              defaultValue={editingClass?.day_of_week ?? 0}
              className="w-full rounded-[2px] px-3 py-2"
            >
              {dayLabels.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="start_time" className="mb-2 block text-sm text-[var(--text-secondary)]">
              Horario
            </label>
            <input
              id="start_time"
              name="start_time"
              type="time"
              defaultValue={editingClass?.start_time ?? "09:00"}
              required
              className="w-full rounded-[2px] px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="duration_minutes" className="mb-2 block text-sm text-[var(--text-secondary)]">
              Duración (min)
            </label>
            <input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              defaultValue={editingClass?.duration_minutes ?? 60}
              min={1}
              required
              className="w-full rounded-[2px] px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="capacity" className="mb-2 block text-sm text-[var(--text-secondary)]">
              Capacidad
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              defaultValue={editingClass?.capacity ?? 10}
              min={1}
              required
              className="w-full rounded-[2px] px-3 py-2"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-[var(--accent)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c5312b]"
            >
              {editingClass ? "Guardar cambios" : "Crear clase"}
            </button>
          </div>
        </form>

        <ClassExceptionManager
          classes={(classes ?? []).map((item) => ({ id: item.id, name: item.name }))}
          existingExceptions={(classExceptions ?? []).map((item) => ({
            id: item.id,
            class_id: item.class_id,
            exception_date: item.exception_date,
            reason: item.reason,
            classes: item.classes as { name?: string } | null,
          }))}
          createAction={createClassExceptionAction}
          deleteAction={deleteClassExceptionAction}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-[var(--background)] text-[var(--text-primary)]">
                <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                  Nombre
                </th>
                <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                  Día
                </th>
                <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                  Horario
                </th>
                <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                  Duración
                </th>
                <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                  Capacidad
                </th>
                <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {(classes ?? []).map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-primary)]">
                    {item.name}
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                    {dayLabels[item.day_of_week] ?? "-"}
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                    {item.start_time}
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                    {item.duration_minutes} min
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                    {item.capacity}
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-3">
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/admin/clases?editId=${item.id}`}
                        className="border border-[var(--border)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        Editar
                      </Link>
                      <ClassDeleteButton classId={item.id} deleteAction={deleteClassAction} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
