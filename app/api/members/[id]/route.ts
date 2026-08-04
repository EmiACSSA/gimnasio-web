import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const allowedRoles = ["socio", "profesor", "administrador"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const memberId = Number(id);

  if (!Number.isInteger(memberId)) {
    return NextResponse.json({ error: "ID de miembro inválido." }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos para actualizar el miembro." }, { status: 400 });
  }

  const payload = body as { role?: string };
  const nextRole = payload.role;

  if (!nextRole || !allowedRoles.includes(nextRole)) {
    return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión para realizar esta acción." }, { status: 401 });
  }

  const { data: currentMember, error: currentMemberError } = await supabase
    .from("members")
    .select("id, role")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (currentMemberError || !currentMember || currentMember.role !== "administrador") {
    return NextResponse.json({ error: "Solo un administrador puede cambiar roles." }, { status: 403 });
  }

  const { data: targetMember, error: targetMemberError } = await supabase
    .from("members")
    .select("id, role, auth_id")
    .eq("id", memberId)
    .maybeSingle();

  if (targetMemberError || !targetMember) {
    return NextResponse.json({ error: "No se encontró el miembro indicado." }, { status: 404 });
  }

  if (targetMember.id === currentMember.id && nextRole !== "administrador") {
    return NextResponse.json({ error: "No podés quitarte tu propio rol de administrador." }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("members")
    .update({ role: nextRole })
    .eq("id", memberId);

  if (updateError) {
    return NextResponse.json({ error: "No se pudo actualizar el rol del miembro." }, { status: 500 });
  }

  revalidatePath("/admin/socios");

  return NextResponse.json({ message: "Rol actualizado correctamente." }, { status: 200 });
}
