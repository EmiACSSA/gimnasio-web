import type { createServerSupabaseClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

function formatDateString(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getNextReservableDateForClass(dayOfWeek: number, startTime: string, now = new Date()) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const currentDayIndex = now.getDay();
  const daysUntilOccurrence = (dayOfWeek - currentDayIndex + 7) % 7;
  const thisWeekOccurrence = new Date(now);
  thisWeekOccurrence.setHours(hours, minutes, 0, 0);
  thisWeekOccurrence.setDate(now.getDate() + daysUntilOccurrence);

  if (now < thisWeekOccurrence) {
    return formatDateString(thisWeekOccurrence);
  }

  const nextWeekOccurrence = new Date(thisWeekOccurrence);
  nextWeekOccurrence.setDate(thisWeekOccurrence.getDate() + 7);

  return formatDateString(nextWeekOccurrence);
}

export async function promoteWaitlistForClass(
  supabase: SupabaseServerClient,
  classId: string,
  bookingDate: string,
  startTime: string,
) {
  const now = new Date();
  const classDateTime = new Date(`${bookingDate}T${startTime}:00`);
  const promotionWindow = new Date(classDateTime.getTime() - 60 * 60 * 1000);

  if (now < promotionWindow) {
    return 0;
  }

  const { data: classInfo, error: classError } = await supabase
    .from("classes")
    .select("capacity")
    .eq("id", classId)
    .maybeSingle();

  if (classError || !classInfo) {
    return 0;
  }

  const { count: confirmedCount, error: confirmedCountError } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId)
    .eq("booking_date", bookingDate)
    .eq("status", "confirmada");

  if (confirmedCountError) {
    return 0;
  }

  const remainingCapacity = Math.max((classInfo.capacity ?? 0) - (confirmedCount ?? 0), 0);

  if (remainingCapacity <= 0) {
    return 0;
  }

  const { data: waitlistRows, error: waitlistError } = await supabase
    .from("bookings")
    .select("id")
    .eq("class_id", classId)
    .eq("booking_date", bookingDate)
    .eq("status", "lista_espera")
    .order("created_at", { ascending: true })
    .limit(remainingCapacity);

  if (waitlistError || !waitlistRows?.length) {
    return 0;
  }

  let promotedCount = 0;

  for (const booking of waitlistRows) {
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "confirmada" })
      .eq("id", booking.id);

    if (!updateError) {
      promotedCount += 1;
    }
  }

  return promotedCount;
}