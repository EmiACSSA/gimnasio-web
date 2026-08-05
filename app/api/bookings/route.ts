import { NextResponse } from "next/server";
import { enforceRateLimit, isValidBookingDate, isValidClassId } from "@/lib/booking-security";
import { getNextReservableDateForClass, promoteWaitlistForClass } from "@/lib/booking-rules";
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
    .select("id, plan, acceso_funcional_gratis")
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
    .select("capacity, day_of_week, name, start_time")
    .eq("id", classId)
    .maybeSingle();

  const { data: classException, error: classExceptionError } = await supabase
    .from("class_exceptions")
    .select("id")
    .eq("class_id", classId)
    .eq("exception_date", bookingDate)
    .maybeSingle();

  if (classExceptionError) {
    console.error("Error al validar excepción de clase:", classExceptionError);
    return NextResponse.json(
      { error: "Ocurrió un error, intentá de nuevo." },
      { status: 500 },
    );
  }

  if (classException) {
    return NextResponse.json(
      { error: "Esta clase no tiene sesión en la fecha elegida." },
      { status: 400 },
    );
  }

  if (classError || !classInfo) {
    return NextResponse.json(
      { error: "La clase seleccionada no existe." },
      { status: 404 },
    );
  }

  if (classInfo.name === "Funcional") {
    const isFunctionalPlan = member.plan === "funcional";
    const hasFunctionalAccess = member.acceso_funcional_gratis === true;

    if (!isFunctionalPlan && !hasFunctionalAccess) {
      return NextResponse.json(
        { error: "No tenés acceso para reservar Funcional." },
        { status: 403 },
      );
    }
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

  const nextReservableDate = getNextReservableDateForClass(classInfo.day_of_week, classInfo.start_time);
  if (bookingDate !== nextReservableDate) {
    return NextResponse.json(
      { error: "Solo podés reservar la próxima ocurrencia de esta clase." },
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

  const shouldWaitlist =
    classInfo.name === "Funcional" &&
    member.plan !== "funcional" &&
    member.acceso_funcional_gratis === true;

  // Unificado con el resto de la tabla, que usa español ("confirmada", "cancelada", "asistio")
  const finalStatus = shouldWaitlist ? "lista_espera" : "confirmada";

  if (!shouldWaitlist && (count ?? 0) >= classInfo.capacity) {
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
      status: finalStatus,
    },
  ]);

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
        { error: "Ya tenés una clase reservada en este día y horario." },
        { status: 409 },
      );
    }

    console.error("Error al crear reserva:", insertError);
    return NextResponse.json(
      { error: "Ocurrió un error, intentá de nuevo." },
      { status: 500 },
    );
  }

  if (finalStatus === "lista_espera") {
    // TODO: confirmar en booking-rules.ts que promoteWaitlistForClass espera un
    // número acá (¿minutos desde medianoche?) y no un string tipo "19:00:00".
    // El cast de abajo solo destraba el build, no valida el dato en runtime.
    await promoteWaitlistForClass(supabase, classId, bookingDate, Number(classInfo.start_time));
  }

  return NextResponse.json(
    {
      message:
        finalStatus === "lista_espera"
          ? "Tu reserva quedó en lista de espera."
          : "Reserva confirmada correctamente.",
    },
    { status: 200 },
  );
}