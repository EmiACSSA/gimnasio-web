import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const status = body.status as "cancelada" | "asistio";

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
    .select("member_id")
    .eq("id", id)
    .maybeSingle();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: "No se encontró la reserva indicada." },
      { status: 404 },
    );
  }

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

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Reserva actualizada correctamente." }, { status: 200 });
}
