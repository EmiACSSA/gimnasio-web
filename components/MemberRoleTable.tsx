"use client";

import { useMemo, useState } from "react";

export type MemberRecord = {
  id: string;
  auth_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  plan: string;
  acceso_funcional_gratis: boolean;
  created_at: string;
  inasistencias: number;
};

type MemberRoleTableProps = {
  members: MemberRecord[];
  currentUserId: string;
};

const roleOptions = ["socio", "profesor", "administrador"];
const planOptions = ["funcional", "personalizado", "deportivo"];

export default function MemberRoleTable({ members, currentUserId }: MemberRoleTableProps) {
  const [search, setSearch] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [localMembers, setLocalMembers] = useState(members);

  const filteredMembers = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return localMembers;
    }

    return localMembers.filter((member) => {
      const haystack = `${member.full_name} ${member.email}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [localMembers, search]);

  async function handleMemberUpdate(
    memberId: string,
    updates: Partial<Pick<MemberRecord, "role" | "plan" | "acceso_funcional_gratis">>,
  ) {
    setSubmittingId(memberId);

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        window.alert(payload?.error ?? "No se pudo actualizar el socio.");
        return;
      }

      setLocalMembers((current) =>
        current.map((member) =>
          member.id === memberId
            ? {
                ...member,
                ...updates,
              }
            : member,
        ),
      );
    } catch {
      window.alert("No se pudo actualizar el socio.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div>
        <label htmlFor="member-search" className="mb-2 block text-sm text-[var(--text-secondary)]">
          Buscar por nombre o email
        </label>
        <input
          id="member-search"
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Ej: Juan Pérez o juan@mail.com"
          className="w-full rounded-[2px] px-3 py-2"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-[var(--background)] text-[var(--text-primary)]">
              <th className="border-b border-[var(--border)] px-3 py-3 text-xs font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                Nombre
              </th>
              <th className="border-b border-[var(--border)] px-3 py-3 text-xs font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                Email
              </th>
              <th className="border-b border-[var(--border)] px-3 py-3 text-xs font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                Teléfono
              </th>
              <th className="border-b border-[var(--border)] px-3 py-3 text-xs font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                Rol
              </th>
              <th className="border-b border-[var(--border)] px-3 py-3 text-xs font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                Plan
              </th>
              <th className="border-b border-[var(--border)] px-3 py-3 text-xs font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                Funcional gratis
              </th>
              <th className="border-b border-[var(--border)] px-3 py-3 text-xs font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                Fecha de registro
              </th>
              <th className="border-b border-[var(--border)] px-3 py-3 text-xs font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                Inasistencias
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => {
              const isSelf = member.auth_id === currentUserId;
              const isSubmitting = submittingId === member.id;
              const isFuncionalPlan = member.plan === "funcional";

              return (
                <tr key={member.id} className="align-top">
                  <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-primary)]">
                    {member.full_name || "-"}
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                    {member.email || "-"}
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                    {member.phone || "-"}
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-3">
                    <select
                      value={member.role}
                      onChange={(event) => handleMemberUpdate(member.id, { role: event.target.value })}
                      disabled={isSubmitting || isSelf}
                      className="w-full rounded-[2px] px-3 py-2"
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-3">
                    <select
                      value={member.plan}
                      onChange={(event) => handleMemberUpdate(member.id, { plan: event.target.value })}
                      disabled={isSubmitting}
                      className="w-full rounded-[2px] px-3 py-2"
                    >
                      {planOptions.map((plan) => (
                        <option key={plan} value={plan}>
                          {plan}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={member.acceso_funcional_gratis}
                      disabled={isSubmitting || isFuncionalPlan}
                      title={
                        isFuncionalPlan
                          ? "No aplica: ya tiene Funcional como plan contratado"
                          : "Acceso gratis a Funcional otorgado por el profesor"
                      }
                      onChange={(event) =>
                        handleMemberUpdate(member.id, { acceso_funcional_gratis: event.target.checked })
                      }
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                    {new Date(member.created_at).toLocaleDateString("es-AR")}
                  </td>
                  <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-primary)]">
                    {member.inasistencias}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}