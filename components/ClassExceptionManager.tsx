"use client";

import { useState } from "react";

type ClassExceptionManagerProps = {
  classes: Array<{ id: number; name: string }>;
  existingExceptions: Array<{
    id: string;
    class_id: number;
    exception_date: string;
    reason?: string | null;
    classes?: { name?: string } | null;
  }>;
  createAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export default function ClassExceptionManager({
  classes,
  existingExceptions,
  createAction,
  deleteAction,
}: ClassExceptionManagerProps) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? 0);
  const [exceptionDate, setExceptionDate] = useState("");
  const [reason, setReason] = useState("");

  async function handleCreateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await createAction(formData);
  }

  async function handleDeleteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await deleteAction(formData);
  }

  return (
    <div className="mb-8 rounded-[2px] border border-[var(--border)] bg-[var(--background)] p-4">
      <h2 className="text-lg font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em] text-[var(--text-primary)]">
        Excepciones de clase
      </h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Agregá una fecha puntual donde una clase no se dicta.
      </p>

      <form onSubmit={handleCreateSubmit} className="mt-4 grid gap-4 md:grid-cols-4">
        <div>
          <label htmlFor="class_id" className="mb-2 block text-sm text-[var(--text-secondary)]">
            Clase
          </label>
          <select
            id="class_id"
            name="class_id"
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(Number(event.target.value))}
            className="w-full rounded-[2px] px-3 py-2"
          >
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="exception_date" className="mb-2 block text-sm text-[var(--text-secondary)]">
            Fecha
          </label>
          <input
            id="exception_date"
            name="exception_date"
            type="date"
            value={exceptionDate}
            onChange={(event) => setExceptionDate(event.target.value)}
            required
            className="w-full rounded-[2px] px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="reason" className="mb-2 block text-sm text-[var(--text-secondary)]">
            Motivo
          </label>
          <input
            id="reason"
            name="reason"
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Feriado, profesor ausente..."
            className="w-full rounded-[2px] px-3 py-2"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-[var(--accent)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c5312b]"
          >
            Agregar excepción
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-[var(--background)] text-[var(--text-primary)]">
              <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                Clase
              </th>
              <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                Fecha
              </th>
              <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                Motivo
              </th>
              <th className="border-b border-[var(--border)] px-3 py-3 font-[family-name:var(--font-poppins)] uppercase tracking-[0.12em]">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {existingExceptions.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-primary)]">
                  {item.classes?.name ?? "-"}
                </td>
                <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                  {item.exception_date}
                </td>
                <td className="border-b border-[var(--border)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                  {item.reason ?? "-"}
                </td>
                <td className="border-b border-[var(--border)] px-3 py-3">
                  <form onSubmit={handleDeleteSubmit}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      className="border border-[var(--border)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      Eliminar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
