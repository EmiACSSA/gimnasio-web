"use client";

import { useState } from "react";

type BookingStatusActionsProps = {
  bookingId: number;
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
    <div>
      {currentStatus !== "cancelada" ? (
        <button
          type="button"
          onClick={() => updateStatus("cancelada")}
          disabled={isSubmitting}
          style={{ marginRight: 8 }}
        >
          Cancelar
        </button>
      ) : null}

      {currentStatus !== "asistio" ? (
        <button
          type="button"
          onClick={() => updateStatus("asistio")}
          disabled={isSubmitting}
        >
          Marcar asistencia
        </button>
      ) : null}

      {message ? <p>{message}</p> : null}
    </div>
  );
}
