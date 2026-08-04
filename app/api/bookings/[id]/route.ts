import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/booking-security";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const classCancellationWindows: Record<string, number> = {
  Funcional: 10,
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Datos inválidos para actualizar la reserva." },
      { status: 400 },
    );
  }

  const payload = body as { status?: string };
  const status = payload.status;

  if (!status || !["cancelada", "asistio"].includes(status)) {
    return NextResponse.json(
      { error: "Estado inválido para actualizar la reserva." },
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
      { error: "Debes iniciar sesión para realizar esta acción." },
      { status: 401 },
    );
  }

  const rateLimit = await enforceRateLimit(request, user.id, { limit: 20, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intentá de nuevo más tarde." },
      { status: 429 },
    );
  }

  const { data: currentMember, error: currentMemberError } = await supabase
    .from("members")
    .select("id, role")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (currentMemberError || !currentMember) {
    return NextResponse.json(
      { error: "No se pudo verificar tu perfil de socio." },
      { status: 403 },
    );
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("member_id, class_id, booking_date, classes(name, start_time)")
    .eq("id", id)
    .maybeSingle();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: "No se encontró la reserva indicada." },
      { status: 404 },
    );
  }

  const classInfo = booking.classes as { name?: string; start_time?: string } | null;
  const isAdmin = currentMember.role === "administrador";
  const isOwner = booking.member_id === currentMember.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json(
      { error: "No tienes permisos para modificar reservas." },
      { status: 403 },
    );
  }

  if (!isAdmin && status !== "cancelada") {
    return NextResponse.json(
      { error: "Solo podés cancelar tu propia reserva." },
      { status: 403 },
    );
  }

  if (!isAdmin && status === "cancelada" && classInfo?.name === "Funcional") {
    const cancellationWindow = classCancellationWindows[classInfo.name] ?? 0;
    if (cancellationWindow > 0 && classInfo.start_time) {
      const reservationDateTime = new Date(`${booking.booking_date}T${classInfo.start_time}:00`);
      const now = new Date();
      const diffInMinutes = Math.floor((reservationDateTime.getTime() - now.getTime()) / 60000);

      if (diffInMinutes < cancellationWindow && diffInMinutes >= 0) {
        return NextResponse.json(
          { error: "No podés cancelar esta reserva, faltan menos de 10 minutos para la clase." },
          { status: 400 },
        );
      }
    }
  }

  const { data: updateData, error: updateError } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select();

  console.log("UPDATE RESULT DATA:", updateData);
  console.log("UPDATE RESULT ERROR:", updateError);

  if (updateError) {
    console.error("Error al actualizar reserva:", updateError);
    return NextResponse.json(
      { error: "Ocurrió un error, intentá de nuevo." },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Reserva actualizada correctamente." }, { status: 200 });
}
