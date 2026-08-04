import { NextResponse } from "next/server";
import { enforceRateLimit, isValidBookingDate, isValidClassId } from "@/lib/booking-security";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Datos inválidos para crear la reserva." },
      { status: 400 },
    );
  }

  const payload = body as { classId?: unknown; bookingDate?: string };
  const { classId, bookingDate } = payload;

  if (!isValidClassId(classId) || !isValidBookingDate(bookingDate)) {
    return NextResponse.json(
      { error: "Datos inválidos para crear la reserva." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para reservar una clase." },
      { status: 401 },
    );
  }

  const rateLimit = await enforceRateLimit(request, user.id, { limit: 10, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intentá de nuevo más tarde." },
      { status: 429 },
    );
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (memberError || !member) {
    return NextResponse.json(
      { error: "No se pudo encontrar el miembro asociado a tu usuario." },
      { status: 404 },
    );
  }

  const { data: classInfo, error: classError } = await supabase
    .from("classes")
    .select("capacity, day_of_week")
    .eq("id", classId)
    .maybeSingle();

  if (classError || !classInfo) {
    return NextResponse.json(
      { error: "La clase seleccionada no existe." },
      { status: 404 },
    );
  }

  const bookingDateObject = new Date(`${bookingDate}T00:00:00`);
  const bookingDay = bookingDateObject.getDay();

  if (bookingDay !== classInfo.day_of_week) {
    return NextResponse.json(
      { error: "La fecha elegida no corresponde al día de esta clase." },
      { status: 400 },
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (bookingDateObject < today) {
    return NextResponse.json(
      { error: "No se puede reservar una fecha pasada." },
      { status: 400 },
    );
  }

  const { count, error: countError } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId)
    .eq("booking_date", bookingDate)
    .eq("status", "confirmada");

  if (countError) {
    console.error("Error al validar cupo disponible:", countError);
    return NextResponse.json(
      { error: "Ocurrió un error, intentá de nuevo." },
      { status: 500 },
    );
  }

  if ((count ?? 0) >= classInfo.capacity) {
    return NextResponse.json(
      {
        error: `La clase está llena para la fecha ${bookingDate}. No se puede confirmar la reserva.`,
      },
      { status: 409 },
    );
  }

  const { error: insertError } = await supabase.from("bookings").insert([
    {
      member_id: member.id,
      class_id: classId,
      booking_date: bookingDate,
      status: "confirmada",
    },
  ]);

  console.log("INSERT ERROR OBJECT:", insertError);

  if (insertError) {
    const isDuplicateBookingError =
      insertError.code === "23505" ||
      insertError.message?.includes("23505") ||
      insertError.details?.includes("23505") ||
      insertError.hint?.includes("23505") ||
      insertError.message?.includes("unique_member_class_date_confirmada") ||
      insertError.details?.includes("unique_member_class_date_confirmada");

    if (isDuplicateBookingError) {
      return NextResponse.json(
        { error: "Ya tiene una clase reservada en este día y horario" },
        { status: 409 },
      );
    }

    console.error("Error al crear reserva:", insertError);
    return NextResponse.json(
      { error: "Ocurrió un error, intentá de nuevo." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      message: "Reserva confirmada correctamente.",
    },
    { status: 200 },
  );
}
