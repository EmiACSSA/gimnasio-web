"use client";

import { useState } from "react";

type ReserveClassButtonProps = {
  classId: number;
  className: string;
  bookingDate: string;
};

export default function ReserveClassButton({
  classId,
  className,
  bookingDate,
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

  return (
    <div className="w-full max-w-xs">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="bg-[var(--accent)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c5312b]"
      >
        Reservar
      </button>

      {isOpen ? (
        <div className="mt-3 rounded-[2px] border border-[var(--border)] bg-[var(--background)] p-3">
          <label htmlFor={`date-${classId}`} className="mb-2 block text-sm text-[var(--text-secondary)]">
            Fecha
          </label>
          <input
            id={`date-${classId}`}
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="w-full rounded-[2px] px-3 py-2"
          />
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
