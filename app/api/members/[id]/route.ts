import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedRoles = ["socio", "profesor", "administrador"];
const allowedPlans = ["funcional", "personalizado", "deportivo"];

function isValidMemberId(value: string): value is string {
  return UUID_REGEX.test(value.trim());
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isValidMemberId(id)) {
    return NextResponse.json({ error: "ID de miembro inválido." }, { status: 400 });
  }

  const memberId = id;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos para actualizar el miembro." }, { status: 400 });
  }

  const payload = body as { role?: unknown; plan?: unknown; acceso_funcional_gratis?: unknown };

  const updates: { role?: string; plan?: string; acceso_funcional_gratis?: boolean } = {};

  if (payload.role !== undefined) {
    if (typeof payload.role !== "string" || !allowedRoles.includes(payload.role)) {
      return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
    }
    updates.role = payload.role;
  }

  if (payload.plan !== undefined) {
    if (typeof payload.plan !== "string" || !allowedPlans.includes(payload.plan)) {
      return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
    }
    updates.plan = payload.plan;
  }

  if (payload.acceso_funcional_gratis !== undefined) {
    if (typeof payload.acceso_funcional_gratis !== "boolean") {
      return NextResponse.json({ error: "Valor inválido para acceso funcional gratis." }, { status: 400 });
    }
    updates.acceso_funcional_gratis = payload.acceso_funcional_gratis;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No se envió ningún campo para actualizar." }, { status: 400 });
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
    return NextResponse.json({ error: "Solo un administrador puede modificar socios." }, { status: 403 });
  }

  const { data: targetMember, error: targetMemberError } = await supabase
    .from("members")
    .select("id, role, auth_id")
    .eq("id", memberId)
    .maybeSingle();

  if (targetMemberError || !targetMember) {
    return NextResponse.json({ error: "No se encontró el miembro indicado." }, { status: 404 });
  }

  if (targetMember.id === currentMember.id && updates.role && updates.role !== "administrador") {
    return NextResponse.json({ error: "No podés quitarte tu propio rol de administrador." }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("members")
    .update(updates)
    .eq("id", memberId);

  if (updateError) {
    console.error("Error al actualizar miembro:", updateError);
    return NextResponse.json({ error: "No se pudo actualizar el miembro." }, { status: 500 });
  }

  revalidatePath("/admin/socios");

  return NextResponse.json({ message: "Miembro actualizado correctamente." }, { status: 200 });
}