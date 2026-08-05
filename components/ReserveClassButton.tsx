"use client";

import { useState } from "react";

type ReserveClassButtonProps = {
  classId: number;
  className: string;
  bookingDate: string;
  available?: number;
};

export default function ReserveClassButton({
  classId,
  className,
  bookingDate,
  available = 0,
}: ReserveClassButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(bookingDate);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleReserve() {
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        classId,
        bookingDate: selectedDate,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "No se pudo realizar la reserva.");
    } else {
      setMessage(`Reserva confirmada para ${className} en ${selectedDate}.`);
      setIsOpen(false);
    }

    setIsSubmitting(false);
  }

  const isOutOfStock = (available ?? 0) <= 0;

  return (
    <div className="w-full max-w-xs">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        disabled={isOutOfStock}
        className={`px-4 py-2 text-sm font-bold uppercase tracking-wide transition ${
          isOutOfStock
            ? "cursor-not-allowed border border-[var(--border)] bg-[var(--border)] text-[var(--text-secondary)]"
            : "bg-[var(--accent)] text-white hover:bg-[#c5312b]"
        }`}
      >
        {isOutOfStock ? "Sin cupo" : "Reservar"}
      </button>

      {isOpen ? (
        <div className="mt-3 rounded-[2px] border border-[var(--border)] bg-[var(--background)] p-3">
          <p className="mb-2 text-sm text-[var(--text-secondary)]">Fecha disponible</p>
          <div className="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]">
            {selectedDate}
          </div>
          <button
            type="button"
            onClick={handleReserve}
            disabled={isSubmitting}
            className="mt-3 w-full bg-[var(--accent)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c5312b] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Confirmando..." : "Confirmar reserva"}
          </button>
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-[var(--text-secondary)]">{message}</p> : null}
    </div>
  );
}
