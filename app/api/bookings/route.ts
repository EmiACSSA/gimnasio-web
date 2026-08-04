import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { classId, bookingDate } = body as {
    classId?: number;
    bookingDate?: string;
  };

  if (!classId || !bookingDate) {
    return NextResponse.json(
      { error: "Faltan datos para crear la reserva." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("USER ID DESDE ROUTE HANDLER:", user?.id);
  console.log("USER ERROR:", userError);

  if (userError || !user) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para reservar una clase." },
      { status: 401 },
    );
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  console.log("MEMBER RESULT:", member);
  console.log("MEMBER ERROR:", memberError);

  if (memberError || !member) {
    return NextResponse.json(
      { error: "No se pudo encontrar el miembro asociado a tu usuario." },
      { status: 404 },
    );
  }

  const { data: classInfo, error: classError } = await supabase
    .from("classes")
    .select("capacity")
    .eq("id", classId)
    .maybeSingle();

  if (classError || !classInfo) {
    return NextResponse.json(
      { error: "La clase seleccionada no existe." },
      { status: 404 },
    );
  }

  const { count, error: countError } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId)
    .eq("booking_date", bookingDate)
    .eq("status", "confirmada");

  if (countError) {
    return NextResponse.json(
      { error: "No se pudo validar el cupo disponible." },
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

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
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
