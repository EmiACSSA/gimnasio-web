"use client";

import { useState } from "react";

type BookingStatusActionsProps = {
  bookingId: string;
  currentStatus: string;
};

export default function BookingStatusActions({
  bookingId,
  currentStatus,
}: BookingStatusActionsProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function updateStatus(status: "cancelada" | "asistio") {
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "No se pudo actualizar la reserva.");
    } else {
      setMessage(`Estado actualizado a ${status}.`);
    }

    setIsSubmitting(false);
  }

  return (
    <div className="space-y-2">
      {currentStatus !== "cancelada" ? (
        <button
          type="button"
          onClick={() => updateStatus("cancelada")}
          disabled={isSubmitting}
          className="border border-[var(--border)] bg-transparent px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Cancelar
        </button>
      ) : null}

      {currentStatus !== "asistio" ? (
        <button
          type="button"
          onClick={() => updateStatus("asistio")}
          disabled={isSubmitting}
          className="border border-[var(--border)] bg-transparent px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Marcar asistencia
        </button>
      ) : null}

      {message ? <p className="text-xs text-[var(--text-secondary)]">{message}</p> : null}
    </div>
  );
}
