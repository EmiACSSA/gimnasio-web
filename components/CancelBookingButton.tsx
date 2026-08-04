"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CancelBookingButtonProps = {
  bookingId: string;
};

export default function CancelBookingButton({ bookingId }: CancelBookingButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCancel() {
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "cancelada" }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "No se pudo cancelar la reserva.");
    } else {
      setMessage("Reserva cancelada correctamente.");
      router.refresh();
    }

    setIsSubmitting(false);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isSubmitting}
        className="border border-[var(--border)] bg-transparent px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        {isSubmitting ? "Cancelando..." : "Cancelar reserva"}
      </button>
      {message ? <p className="text-xs text-[var(--text-secondary)]">{message}</p> : null}
    </div>
  );
}
