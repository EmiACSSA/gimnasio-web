"use client";

import { useMemo, useState } from "react";

export type MemberRecord = {
  id: number;
  auth_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  inasistencias: number;
};

type MemberRoleTableProps = {
  members: MemberRecord[];
  currentUserId: string;
};

const roleOptions = ["socio", "profesor", "administrador"];

export default function MemberRoleTable({ members, currentUserId }: MemberRoleTableProps) {
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  async function handleRoleChange(memberId: number, nextRole: string) {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: nextRole }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        window.alert(payload?.error ?? "No se pudo actualizar el rol.");
        return;
      }

      setLocalMembers((current) =>
        current.map((member) =>
          member.id === memberId
            ? {
                ...member,
                role: nextRole,
              }
            : member,
        ),
      );
    } catch {
      window.alert("No se pudo actualizar el rol.");
    } finally {
      setIsSubmitting(false);
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
                      onChange={(event) => handleRoleChange(member.id, event.target.value)}
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
